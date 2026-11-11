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
  }).firestore(DATABASE_ID);
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
