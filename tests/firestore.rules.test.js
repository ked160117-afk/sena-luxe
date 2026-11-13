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

  await assertSucceeds(getDoc(doc(adminDb, `publicCatalogGenerations/${generationId}/games/staged-game-0`)));
  await assertFails(getDoc(doc(publicDb, `publicCatalogGenerations/${generationId}/games/staged-game-0`)));
});
