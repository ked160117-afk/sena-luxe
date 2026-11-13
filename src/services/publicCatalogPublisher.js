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
