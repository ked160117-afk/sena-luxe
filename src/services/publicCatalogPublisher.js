import { doc, runTransaction, setDoc, writeBatch } from 'firebase/firestore';

/**
 * Reserve a monotonically increasing public-catalog revision before reading
 * canonical data or staging a generation. Firestore rules enforce admin access.
 */
export async function reservePublicCatalogRevision(database) {
  const sequenceRef = doc(database, 'publicCatalogControl', 'publishSequence');
  return runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(sequenceRef);
    const current = snapshot.exists() && typeof snapshot.data().revision === 'number'
      ? snapshot.data().revision
      : 0;
    const nextRevision = current + 1;
    transaction.set(sequenceRef, {
      revision: nextRevision,
      updatedAt: new Date().toISOString(),
    });
    return nextRevision;
  });
}

/**
 * Activate a fully staged generation only if its revision is newer than the
 * currently active generation. An older concurrent publisher cannot win late.
 * The caller must finish writing the generation before calling this function.
 */
export async function activatePublicCatalogGeneration(database, generationId, publishRevision, counts) {
  if (typeof generationId !== 'string' || !generationId.trim() || generationId.length > 120 || generationId.includes('/')) {
    throw new Error('公開世代IDが不正です。');
  }
  if (!Number.isInteger(publishRevision) || publishRevision <= 0) {
    throw new Error('公開リビジョンが不正です。');
  }
  if (!counts || typeof counts !== 'object' ||
      !Number.isInteger(counts.games) || counts.games < 0 ||
      !Number.isInteger(counts.products) || counts.products < 0 ||
      !Number.isInteger(counts.rates) || counts.rates < 0) {
    throw new Error('公開データの件数が不正です。');
  }
  const activePointerRef = doc(database, 'publicCatalogControl', 'active');
  return runTransaction(database, async (transaction) => {
    const activeSnapshot = await transaction.get(activePointerRef);
    const activeRevision = activeSnapshot.exists() && typeof activeSnapshot.data().publishRevision === 'number'
      ? activeSnapshot.data().publishRevision
      : 0;
    if (activeRevision >= publishRevision) return false;

    transaction.set(activePointerRef, {
      generationId,
      publishRevision,
      publishedAt: new Date().toISOString(),
      games: counts.games,
      products: counts.products,
      rates: counts.rates,
    });
    return true;
  });
}

/**
 * Stage an immutable catalog generation in bounded batches. The active pointer
 * must not be changed until this function resolves successfully.
 */
export async function stagePublicCatalogGeneration(database, generationId, rows, publicSettings, counts) {
  if (typeof generationId !== 'string' || !generationId.trim() || generationId.length > 120 || generationId.includes('/')) {
    throw new Error('公開世代IDが不正です。');
  }
  if (!Array.isArray(rows) || !counts || typeof counts !== 'object') {
    throw new Error('公開データの形式が不正です。');
  }

  const allowedKinds = new Set(['games', 'products', 'stoneRates']);
  const seen = new Set();
  const actualCounts = { games: 0, products: 0, rates: 0 };

  for (const row of rows) {
    if (!row || !allowedKinds.has(row.kind) || typeof row.id !== 'string' ||
        !row.id.trim() || row.id.includes('/') || !row.data ||
        typeof row.data !== 'object' || Array.isArray(row.data)) {
      throw new Error('公開データに不正なレコードが含まれています。');
    }
    const key = `${row.kind}/${row.id}`;
    if (seen.has(key)) throw new Error('公開データに重複したIDがあります。');
    seen.add(key);
    if (row.data.id !== row.id) throw new Error('公開データのIDが一致しません。');

    if (row.kind === 'games') actualCounts.games += 1;
    if (row.kind === 'products') actualCounts.products += 1;
    if (row.kind === 'stoneRates') actualCounts.rates += 1;
  }

  if (actualCounts.games !== counts.games ||
      actualCounts.products !== counts.products ||
      actualCounts.rates !== counts.rates ||
      !Number.isInteger(counts.games) || !Number.isInteger(counts.products) ||
      !Number.isInteger(counts.rates)) {
    throw new Error('公開データの件数が一致しません。');
  }

  if (!publicSettings || typeof publicSettings !== 'object' || Array.isArray(publicSettings)) {
    throw new Error('公開設定の形式が不正です。');
  }
  const allowedSettings = ['lineUrl', 'shopNotice', 'enableDirectLineCopy', 'contactDeskHours'];
  const settingKeys = Object.keys(publicSettings);
  if (settingKeys.length !== allowedSettings.length ||
      !allowedSettings.every((key) => Object.prototype.hasOwnProperty.call(publicSettings, key))) {
    throw new Error('公開設定に許可されていない項目、または不足項目があります。');
  }

  if (typeof publicSettings.lineUrl !== 'string' || publicSettings.lineUrl.length > 2048 ||
      typeof publicSettings.shopNotice !== 'string' || publicSettings.shopNotice.length > 2000 ||
      typeof publicSettings.enableDirectLineCopy !== 'boolean' ||
      typeof publicSettings.contactDeskHours !== 'string' || publicSettings.contactDeskHours.length > 200) {
    throw new Error('公開設定の値が不正です。');
  }

  const generationRef = (kind, id) =>
    doc(database, 'publicCatalogGenerations', generationId, kind, id);

  for (let offset = 0; offset < rows.length; offset += 400) {
    const batch = writeBatch(database);
    rows.slice(offset, offset + 400).forEach((row) => {
      batch.set(generationRef(row.kind, row.id), row.data);
    });
    await batch.commit();
  }

  await setDoc(doc(database, 'publicCatalogGenerations', generationId, 'settings', 'general'), publicSettings);
  await setDoc(doc(database, 'publicCatalogGenerations', generationId), {
    generationId,
    games: counts.games,
    products: counts.products,
    rates: counts.rates,
    settings: 1,
    createdAt: new Date().toISOString(),
  });
}
