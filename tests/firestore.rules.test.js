import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { readFile } from 'node:fs/promises';
import { reservePublicCatalogRevision, stagePublicCatalogGeneration, activatePublicCatalogGeneration } from '../src/services/publicCatalogPublisher.js';

// The Firestore Emulator currently cannot reliably bind rules to the production named database.
// These automated tests validate the rules against an isolated demo project's default database.
// The production named database still requires a separate controlled verification before release.
const PROJECT_ID = 'demo-sena-luxe-rules-test';
const ADMIN_UID = 'cjUzsc6SK4ZBrsddvFQjuhPphBA2';
const ACTIVE_GENERATION = 'catalog-test-active';
const INACTIVE_GENERATION = 'catalog-test-staging';

let testEnv;
let publicDb;
let otherUserDb;
let adminDb;

const publicGame = {
  id: 'game-a',
  code: 'GAMEA',
  name: 'テストゲーム',
  shortName: 'テスト',
  category: 'RPG',
  currencyName: 'テスト石',
  currencyUnit: '個',
  iconUrl: 'https://example.com/game.png',
  currencyIconUrl: 'https://example.com/currency.png',
  isHandled: true,
  description: '公開用の説明',
  order: 1,
};

const publicProduct = {
  id: 'product-a',
  productNumber: 'SL-TEST-001',
  gameId: 'game-a',
  gameCode: 'GAMEA',
  gameName: 'テストゲーム',
  category: '引退垢',
  title: '公開テスト商品',
  summary: '公開用の概要',
  price: 1000,
  status: '掲載中',
  verifiedForPublic: true,
  imageUrl: 'https://example.com/product.png',
  deviceCompatibility: 'iOS',
  keyHighlights: ['公開情報'],
  createdAt: '2026-11-12T00:00:00.000Z',
  updatedAt: '2026-11-12T00:00:00.000Z',
  order: 1,
};

const publicRate = {
  id: 'rate-a',
  gameId: 'game-a',
  gameCode: 'GAMEA',
  gameName: 'テストゲーム',
  planName: '無償石テスト',
  currencyName: '無償石',
  currencyType: '無償',
  currencyAmount: '1000個',
  conditions: 'テスト条件',
  currentPrice: 500,
  confirmedDate: '2026-11-12',
  status: '取扱中',
  stockStatus: '在庫要確認',
  isPreparation: false,
  verifiedForPublic: true,
};

const publicSettings = {
  lineUrl: 'https://lin.ee/6uy8hu9',
  shopNotice: 'テストのお知らせ',
  enableDirectLineCopy: true,
  contactDeskHours: '公式LINEにてご案内',
};

async function seedFixtures() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'publicCatalogControl/active'), {
      generationId: ACTIVE_GENERATION,
      publishRevision: 1,
      publishedAt: '2026-11-12T00:00:00.000Z',
      games: 1,
      products: 1,
      rates: 1,
    });

    const activeRoot = `publicCatalogGenerations/${ACTIVE_GENERATION}`;
    await setDoc(doc(db, `${activeRoot}/games/game-a`), publicGame);
    await setDoc(doc(db, `${activeRoot}/products/product-a`), publicProduct);
    await setDoc(doc(db, `${activeRoot}/stoneRates/rate-a`), publicRate);
    await setDoc(doc(db, `${activeRoot}/settings/general`), publicSettings);

    const inactiveRoot = `publicCatalogGenerations/${INACTIVE_GENERATION}`;
    await setDoc(doc(db, `${inactiveRoot}/products/staging-secret`), publicProduct);

    await setDoc(doc(db, 'games/internal-game'), { name: '非公開ゲーム候補' });
    await setDoc(doc(db, 'products/private-draft'), { title: '非公開下書き', internalNote: 'secret' });
    await setDoc(doc(db, 'stoneRates/private-rate'), { priceHistory: [100, 200] });
    await setDoc(doc(db, 'settings/general'), { privateSetting: 'secret' });
    await setDoc(doc(db, 'sequences/GAMEA'), { nextNumber: 42 });
    await setDoc(doc(db, 'admins/some-other-admin'), { uid: 'some-other-admin' });
    await setDoc(doc(db, 'requests/private-request'), { id: 'private-request' });
    await setDoc(doc(db, 'productVideos/private-video'), { storageId: 'secret' });
    await setDoc(doc(db, 'productVideos/private-video/chunks/chunk-1'), { data: 'secret' });
    await setDoc(doc(db, 'test/connection'), { ok: true });
    await setDoc(doc(db, 'publicCatalogControl/publishSequence'), { revision: 1, updatedAt: '2026-11-12T00:00:00.000Z' });
  });
}

before(async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
  publicDb = testEnv.unauthenticatedContext().firestore();
  otherUserDb = testEnv.authenticatedContext('ordinary-user', {
    email: 'ordinary@example.com',
  }).firestore();
  adminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: 'ked160117@gmail.com',
  }).firestore();
  await seedFixtures();
});

after(async () => {
  await testEnv?.cleanup();
});

test('public product rules accept only the four current account categories', async () => {
  for (const category of ['引退垢', '初期垢', '石垢', '進行済み石垢']) {
    const product = { ...publicProduct, id: `category-${category}`, category };
    await assertSucceeds(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/products/${product.id}`), product));
  }
  const legacyCategory = { ...publicProduct, id: 'legacy-stone-category', category: 'ゲーム内通貨・石垢' };
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/products/${legacyCategory.id}`), legacyCategory));
});

test('public product rules reject records missing product or game identifiers', async () => {
  const missingProductNumber = { ...publicProduct, id: 'missing-product-number', productNumber: '' };
  const missingGameId = { ...publicProduct, id: 'missing-game-id', gameId: '' };
  const missingGameName = { ...publicProduct, id: 'missing-game-name', gameName: '' };
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/products/missing-product-number`), missingProductNumber));
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/products/missing-game-id`), missingGameId));
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/products/missing-game-name`), missingGameName));
});

test('public stone-rate rules reject records missing game identifiers', async () => {
  const missingGameId = { ...publicRate, id: 'missing-rate-game-id', gameId: '' };
  const missingGameName = { ...publicRate, id: 'missing-rate-game-name', gameName: '' };
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/stoneRates/missing-rate-game-id`), missingGameId));
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/stoneRates/missing-rate-game-name`), missingGameName));
});

test('public product rules reject image payloads above the bounded document limit', async () => {
  const oversizedProduct = { ...publicProduct, id: 'oversized-image', imageUrl: 'x'.repeat(250001) };
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/products/oversized-image`), oversizedProduct));
});

test('public game rules reject oversized app and currency icon payloads', async () => {
  const oversizedAppIcon = { ...publicGame, id: 'oversized-app-icon', iconUrl: 'x'.repeat(100001) };
  const oversizedCurrencyIcon = { ...publicGame, id: 'oversized-currency-icon', currencyIconUrl: 'x'.repeat(100001) };
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/games/oversized-app-icon`), oversizedAppIcon));
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/games/oversized-currency-icon`), oversizedCurrencyIcon));
});

test('public stone-rate rules reject paid and unverified currency types', async () => {
  const paidRate = { ...publicRate, currencyType: '有償' };
  const unknownRate = { ...publicRate, currencyType: '未確認' };
  const missingTypeRate = { ...publicRate };
  delete missingTypeRate.currencyType;
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/stoneRates/paid-rate`), paidRate));
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/stoneRates/unknown-rate`), unknownRate));
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/stoneRates/missing-type-rate`), { ...missingTypeRate, id: 'missing-type-rate' }));
});

test('anonymous users can read only the active public catalog generation', async () => {
  const root = `publicCatalogGenerations/${ACTIVE_GENERATION}`;
  await assertSucceeds(getDoc(doc(publicDb, 'publicCatalogControl/active')));
  await assertSucceeds(getDoc(doc(publicDb, `${root}/products/product-a`)));
  await assertSucceeds(getDocs(collection(publicDb, `${root}/games`)));
  await assertSucceeds(getDocs(collection(publicDb, `${root}/products`)));
  await assertSucceeds(getDocs(collection(publicDb, `${root}/stoneRates`)));
  await assertSucceeds(getDoc(doc(publicDb, `${root}/settings/general`)));
  await assertFails(getDoc(doc(publicDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/products/staging-secret`)));
  await assertFails(getDoc(doc(publicDb, `publicCatalogGenerations/${ACTIVE_GENERATION}`)));
});

test('anonymous collection queries cannot enumerate canonical or private records', async () => {
  const deniedCollections = [
    'games',
    'products',
    'stoneRates',
    'settings',
    'sequences',
    'admins',
    'requests',
    'productVideos',
    'publicGames',
    'publicProducts',
    'publicStoneRates',
    'publicSettings',
  ];
  for (const path of deniedCollections) {
    await assertFails(getDocs(collection(publicDb, path)), `Anonymous list should fail: ${path}`);
  }
});

test('anonymous users cannot read canonical or administrative collections', async () => {
  const deniedPaths = [
    'games/internal-game',
    'products/private-draft',
    'stoneRates/private-rate',
    'settings/general',
    'sequences/GAMEA',
    'admins/some-other-admin',
    'requests/private-request',
    'productVideos/private-video',
    'productVideos/private-video/chunks/chunk-1',
    'test/connection',
    'publicCatalogControl/publishSequence',
    'publicGames/legacy',
    'publicProducts/legacy',
    'publicStoneRates/legacy',
    'publicSettings/legacy',
  ];
  for (const path of deniedPaths) {
    await assertFails(getDoc(doc(publicDb, path)), `Anonymous read should fail: ${path}`);
  }
});

test('anonymous and ordinary users cannot write catalog data or admin controls', async () => {
  await assertFails(setDoc(doc(publicDb, 'publicCatalogControl/active'), {
    generationId: 'attacker-generation',
    publishedAt: 'now',
    games: 0,
    products: 0,
    rates: 0,
  }));
  await assertFails(setDoc(doc(publicDb, 'publicCatalogGenerations/attacker/products/p1'), publicProduct));
  await assertFails(setDoc(doc(publicDb, 'products/attacker-draft'), { title: 'attack' }));
  await assertFails(getDoc(doc(otherUserDb, 'products/private-draft')));
  await assertFails(getDoc(doc(otherUserDb, 'publicCatalogControl/publishSequence')));
  await assertFails(setDoc(doc(otherUserDb, 'publicCatalogControl/publishSequence'), { revision: 99, updatedAt: 'now' }));
  await assertFails(setDoc(doc(otherUserDb, 'admins/ordinary-user'), {
    uid: 'ordinary-user',
    email: 'ordinary@example.com',
    role: 'super_admin',
    createdAt: 'now',
    updatedAt: 'now',
  }));
});

test('public request intake permits only valid create and denies read/update/delete', async () => {
  const validRequest = {
    id: 'public-request-1',
    gameTitle: 'テストゲーム',
    requestType: '石垢',
    desiredQuantity: '1000個',
    budget: '1000円',
    contactNotes: '問い合わせテスト',
    createdAt: '2026-11-12T00:00:00.000Z',
    status: '受付済',
  };
  const requestRef = doc(publicDb, 'requests/public-request-1');
  await assertSucceeds(setDoc(requestRef, validRequest));
  await assertFails(getDoc(requestRef));
  await assertFails(updateDoc(requestRef, { status: '対応中' }));
  await assertFails(deleteDoc(requestRef));

  await assertFails(setDoc(doc(publicDb, 'requests/request-with-extra-field'), {
    ...validRequest,
    id: 'request-with-extra-field',
    adminNotes: 'must not be public',
  }));
  await assertFails(setDoc(doc(publicDb, 'requests/request-with-mismatched-id'), {
    ...validRequest,
    id: 'different-id',
  }));
  await assertFails(setDoc(doc(publicDb, 'requests/request-with-invalid-status'), {
    ...validRequest,
    id: 'request-with-invalid-status',
    status: '対応済',
  }));
});

test('authorized admin can read canonical data and publish schema-valid public documents', async () => {
  await assertSucceeds(getDoc(doc(adminDb, 'products/private-draft')));
  await assertSucceeds(getDoc(doc(adminDb, 'stoneRates/private-rate')));
  await assertSucceeds(getDoc(doc(adminDb, 'publicCatalogControl/publishSequence')));
  await assertSucceeds(setDoc(doc(adminDb, 'products/admin-created'), { title: '管理者商品' }));

  const root = `publicCatalogGenerations/${ACTIVE_GENERATION}`;
  await assertSucceeds(setDoc(doc(adminDb, `${root}/products/admin-product`), {
    ...publicProduct,
    id: 'admin-product',
  }));
  await assertFails(setDoc(doc(adminDb, `${root}/products/leaky-product`), {
    ...publicProduct,
    id: 'leaky-product',
    internalNote: 'must be rejected',
  }));
  await assertFails(setDoc(doc(adminDb, `${root}/products/invalid-price`), {
    ...publicProduct,
    id: 'invalid-price',
    price: 0,
  }));
  await assertFails(setDoc(doc(adminDb, 'admins/another-user'), {
    uid: 'another-user',
    email: 'other@example.com',
    role: 'super_admin',
    createdAt: 'now',
    updatedAt: 'now',
  }));
});


test('authorized admin can publish only allowlisted games, rates, settings, and pointer fields', async () => {
  const root = `publicCatalogGenerations/${ACTIVE_GENERATION}`;

  await assertSucceeds(setDoc(doc(adminDb, `${root}/games/admin-game`), {
    ...publicGame,
    id: 'admin-game',
  }));
  await assertFails(setDoc(doc(adminDb, `${root}/games/leaky-game`), {
    ...publicGame,
    id: 'leaky-game',
    privateNote: 'must be rejected',
  }));

  await assertSucceeds(setDoc(doc(adminDb, `${root}/stoneRates/admin-rate`), {
    ...publicRate,
    id: 'admin-rate',
  }));
  await assertFails(setDoc(doc(adminDb, `${root}/stoneRates/leaky-rate`), {
    ...publicRate,
    id: 'leaky-rate',
    priceHistory: [100, 200],
  }));

  await assertSucceeds(setDoc(doc(adminDb, `${root}/settings/general`), publicSettings));
  await assertFails(setDoc(doc(adminDb, `${root}/settings/general`), {
    ...publicSettings,
    privateAdminNotice: 'must be rejected',
  }));

  await assertSucceeds(updateDoc(doc(adminDb, 'publicCatalogControl/active'), {
    generationId: 'catalog-test-next',
    publishRevision: 2,
    publishedAt: '2026-11-12T00:01:00.000Z',
    games: 1,
    products: 1,
    rates: 1,
  }));
  await assertFails(updateDoc(doc(adminDb, 'publicCatalogControl/active'), {
    privateAdminNote: 'must be rejected',
  }));
});

test('publisher revision fence preserves the active generation on failed staging and rejects stale concurrent publishes', async () => {
  const pointerRef = doc(adminDb, 'publicCatalogControl/active');
  const initialPointer = await getDoc(pointerRef);
  const initialGeneration = initialPointer.data().generationId;
  const initialRevision = initialPointer.data().publishRevision;

  // Simulate a publisher reserving a revision and then failing during staging:
  // because activation is never called, the known-good pointer stays untouched.
  const failedStagingRevision = await reservePublicCatalogRevision(adminDb);
  const afterFailedStaging = await getDoc(pointerRef);
  assert.equal(afterFailedStaging.data().generationId, initialGeneration);
  assert.equal(afterFailedStaging.data().publishRevision, initialRevision);

  // Two concurrent publishers must receive unique, monotonically increasing revisions.
  const [revisionA, revisionB] = await Promise.all([
    reservePublicCatalogRevision(adminDb),
    reservePublicCatalogRevision(adminDb),
  ]);
  assert.notEqual(revisionA, revisionB);
  const olderRevision = Math.min(revisionA, revisionB);
  const newerRevision = Math.max(revisionA, revisionB);
  assert.ok(olderRevision > failedStagingRevision);

  const counts = { games: 1, products: 1, rates: 1 };
  assert.equal(
    await activatePublicCatalogGeneration(adminDb, INACTIVE_GENERATION, newerRevision, counts),
    true,
  );
  assert.equal(
    await activatePublicCatalogGeneration(adminDb, ACTIVE_GENERATION, olderRevision, counts),
    false,
  );

  let activePointer = await getDoc(pointerRef);
  assert.equal(activePointer.data().generationId, INACTIVE_GENERATION);
  assert.equal(activePointer.data().publishRevision, newerRevision);
  await assertSucceeds(getDoc(doc(publicDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/products/staging-secret`)));
  await assertFails(getDoc(doc(publicDb, `publicCatalogGenerations/${ACTIVE_GENERATION}/products/product-a`)));

  // Explicit rollback is a new, higher revision pointing to the retained old generation.
  const rollbackRevision = await reservePublicCatalogRevision(adminDb);
  assert.equal(
    await activatePublicCatalogGeneration(adminDb, ACTIVE_GENERATION, rollbackRevision, counts),
    true,
  );
  activePointer = await getDoc(pointerRef);
  assert.equal(activePointer.data().generationId, ACTIVE_GENERATION);
  assert.equal(activePointer.data().publishRevision, rollbackRevision);
  await assertSucceeds(getDoc(doc(publicDb, `publicCatalogGenerations/${ACTIVE_GENERATION}/products/product-a`)));
  await assertFails(getDoc(doc(publicDb, `publicCatalogGenerations/${INACTIVE_GENERATION}/products/staging-secret`)));
});

test('partial generation staging failure leaves old pointer active and staged documents private', async () => {
  const pointerRef = doc(adminDb, 'publicCatalogControl/active');
  const before = await getDoc(pointerRef);
  const generationId = 'catalog-test-failed-staging';

  // The first 400 valid docs commit; the second batch contains a forbidden
  // private field and must fail. The publisher must never switch the pointer.
  const rows = Array.from({ length: 400 }, (_, index) => ({
    kind: 'games',
    id: `staged-game-${index}`,
    data: { ...publicGame, id: `staged-game-${index}` },
  }));
  rows.push({
    kind: 'games',
    id: 'staged-game-private-field',
    data: { ...publicGame, id: 'staged-game-private-field', privateNote: 'must be rejected' },
  });

  await assert.rejects(
    stagePublicCatalogGeneration(adminDb, generationId, rows, publicSettings, {
      games: rows.length,
      products: 0,
      rates: 0,
    }),
  );

  const after = await getDoc(pointerRef);
  assert.equal(after.data().generationId, before.data().generationId);
  assert.equal(after.data().publishRevision, before.data().publishRevision);

  let stagedAdminSnapshot;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    stagedAdminSnapshot = await getDoc(doc(context.firestore(), `publicCatalogGenerations/${generationId}/games/staged-game-0`));
  });
  assert.equal(stagedAdminSnapshot.exists(), true);
  await assertFails(getDoc(doc(publicDb, `publicCatalogGenerations/${generationId}/games/staged-game-0`)));
});

test('public catalog publisher rejects malformed input before any Firestore writes', async () => {
  const validRows = [{
    kind: 'games',
    id: 'game-preflight',
    data: { id: 'game-preflight', name: '検証用ゲーム' },
  }];
  const validCounts = { games: 1, products: 0, rates: 0 };

  const invalidCases = [
    ['empty generation ID', '', validRows, publicSettings, validCounts, '公開世代IDが不正です。'],
    ['unknown collection kind', 'preflight-a', [{ ...validRows[0], kind: 'admins' }], publicSettings, validCounts, '公開データに不正なレコードが含まれています。'],
    ['document ID containing slash', 'preflight-b', [{ ...validRows[0], id: 'bad/id' }], publicSettings, validCounts, '公開データに不正なレコードが含まれています。'],
    ['mismatched document and payload IDs', 'preflight-c', [{ ...validRows[0], data: { id: 'different-id' } }], publicSettings, validCounts, '公開データのIDが一致しません。'],
    ['duplicate document IDs', 'preflight-d', [...validRows, ...validRows], publicSettings, { games: 2, products: 0, rates: 0 }, '公開データに重複したIDがあります。'],
    ['incorrect record counts', 'preflight-e', validRows, publicSettings, { games: 0, products: 0, rates: 0 }, '公開データの件数が一致しません。'],
    ['non-integer record counts', 'preflight-f', validRows, publicSettings, { games: 1.5, products: 0, rates: 0 }, '公開データの件数が一致しません。'],
    ['missing public setting', 'preflight-g', validRows, { ...publicSettings, lineUrl: undefined }, validCounts, '公開設定に許可されていない項目、または不足項目があります。'],
    ['private extra public setting', 'preflight-h', validRows, { ...publicSettings, adminNote: 'secret' }, validCounts, '公開設定に許可されていない項目、または不足項目があります。'],
  ];

  for (const [label, generationId, rows, settings, counts, message] of invalidCases) {
    await assert.rejects(
      stagePublicCatalogGeneration({}, generationId, rows, settings, counts),
      (error) => error.message === message,
      label,
    );
  }
});

test('public catalog publisher rejects unsafe generation paths and invalid setting values before writes', async () => {
  const rows = [];
  const counts = { games: 0, products: 0, rates: 0 };
  const invalidCases = [
    ['generation ID containing slash', 'unsafe/generation', publicSettings, '公開世代IDが不正です。'],
    ['non-string LINE URL', 'preflight-setting-a', { ...publicSettings, lineUrl: 123 }, '公開設定の値が不正です。'],
    ['oversized shop notice', 'preflight-setting-b', { ...publicSettings, shopNotice: 'x'.repeat(2001) }, '公開設定の値が不正です。'],
    ['non-boolean direct LINE copy setting', 'preflight-setting-c', { ...publicSettings, enableDirectLineCopy: 'true' }, '公開設定の値が不正です。'],
    ['oversized contact hours', 'preflight-setting-d', { ...publicSettings, contactDeskHours: 'x'.repeat(201) }, '公開設定の値が不正です。'],
  ];

  for (const [label, generationId, settings, message] of invalidCases) {
    await assert.rejects(
      stagePublicCatalogGeneration({}, generationId, rows, settings, counts),
      (error) => error.message === message,
      label,
    );
  }
});

test('publisher activation rejects unsafe pointers and invalid revisions or counts before Firestore access', async () => {
  const invalidCases = [
    ['slash in generation ID', 'unsafe/generation', 1, { games: 0, products: 0, rates: 0 }, '公開世代IDが不正です。'],
    ['non-positive revision', 'safe-generation', 0, { games: 0, products: 0, rates: 0 }, '公開リビジョンが不正です。'],
    ['fractional revision', 'safe-generation', 1.5, { games: 0, products: 0, rates: 0 }, '公開リビジョンが不正です。'],
    ['negative count', 'safe-generation', 1, { games: -1, products: 0, rates: 0 }, '公開データの件数が不正です。'],
    ['missing count', 'safe-generation', 1, { games: 0, products: 0 }, '公開データの件数が不正です。'],
  ];

  for (const [label, generationId, revision, counts, message] of invalidCases) {
    await assert.rejects(
      activatePublicCatalogGeneration({}, generationId, revision, counts),
      (error) => error.message === message,
      label,
    );
  }
});
