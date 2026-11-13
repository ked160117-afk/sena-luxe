import { after, before, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { readFile } from 'node:fs/promises';

const PROJECT_ID = 'demo-sena-luxe-prep-rules-test';
const ADMIN_UID = 'cjUzsc6SK4ZBrsddvFQjuhPphBA2';
const ACTIVE = 'catalog-prep-active';
const INACTIVE = 'catalog-prep-inactive';

let testEnv;
let publicDb;
let ordinaryDb;
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
  createdAt: '2026-11-13T00:00:00.000Z',
  updatedAt: '2026-11-13T00:00:00.000Z',
  order: 1,
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
      generationId: ACTIVE,
      publishRevision: 1,
      publishedAt: '2026-11-13T00:00:00.000Z',
      games: 1,
      products: 1,
      rates: 0,
    });
    await setDoc(doc(db, 'publicCatalogControl/publishSequence'), {
      revision: 1,
      updatedAt: '2026-11-13T00:00:00.000Z',
    });
    await setDoc(doc(db, `publicCatalogGenerations/${ACTIVE}`), { generationId: ACTIVE, games: 1, products: 1, rates: 0 });
    await setDoc(doc(db, `publicCatalogGenerations/${ACTIVE}/games/game-a`), publicGame);
    await setDoc(doc(db, `publicCatalogGenerations/${ACTIVE}/products/product-a`), publicProduct);
    await setDoc(doc(db, `publicCatalogGenerations/${ACTIVE}/settings/general`), publicSettings);

    await setDoc(doc(db, `publicCatalogGenerations/${INACTIVE}`), { generationId: INACTIVE });
    await setDoc(doc(db, `publicCatalogGenerations/${INACTIVE}/products/staging-secret`), {
      ...publicProduct,
      id: 'staging-secret',
    });

    // The preparation release deliberately preserves current production reads.
    await setDoc(doc(db, 'games/canonical-game'), { name: '公開中の正規カタログ' });
    await setDoc(doc(db, 'products/canonical-product'), { title: '公開中の正規商品' });
    await setDoc(doc(db, 'stoneRates/canonical-rate'), { currentPrice: 500 });
    await setDoc(doc(db, 'settings/general'), { lineUrl: 'https://lin.ee/6uy8hu9' });
    await setDoc(doc(db, 'productVideos/video-a'), { storageId: 'public-video' });
    await setDoc(doc(db, 'productVideos/video-a/chunks/chunk-1'), { data: 'public-video-chunk' });
  });
}

before(async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
  publicDb = testEnv.unauthenticatedContext().firestore();
  ordinaryDb = testEnv.authenticatedContext('ordinary-user', { email: 'ordinary@example.com' }).firestore();
  adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: 'ked160117@gmail.com' }).firestore();
  await seedFixtures();
});

after(async () => {
  await testEnv?.cleanup();
});

test('public stone-rate rules reject paid and unverified currency types', async () => {
  const baseRate = {
    id: 'rate-test',
    gameId: 'game-a',
    gameCode: 'GAMEA',
    gameName: 'テストゲーム',
    planName: '無償石テスト',
    currencyName: '無償石',
    currencyType: '無償',
    currencyAmount: '1000個',
    conditions: 'テスト条件',
    currentPrice: 500,
    confirmedDate: '2026-11-13',
    status: '取扱中',
    stockStatus: '在庫要確認',
    isPreparation: false,
    verifiedForPublic: true,
  };
  await assertSucceeds(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE}/stoneRates/free-rate`), baseRate));
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE}/stoneRates/paid-rate`), { ...baseRate, id: 'paid-rate', currencyType: '有償' }));
  await assertFails(setDoc(doc(adminDb, `publicCatalogGenerations/${INACTIVE}/stoneRates/unknown-rate`), { ...baseRate, id: 'unknown-rate', currencyType: '未確認' }));
});

test('preparation release keeps current storefront reads and exposes only the active staged generation', async () => {
  await assertSucceeds(getDoc(doc(publicDb, 'games/canonical-game')));
  await assertSucceeds(getDoc(doc(publicDb, 'products/canonical-product')));
  await assertSucceeds(getDoc(doc(publicDb, 'stoneRates/canonical-rate')));
  await assertSucceeds(getDoc(doc(publicDb, 'settings/general')));
  await assertSucceeds(getDoc(doc(publicDb, 'productVideos/video-a')));
  await assertSucceeds(getDoc(doc(publicDb, 'productVideos/video-a/chunks/chunk-1')));

  await assertSucceeds(getDoc(doc(publicDb, 'publicCatalogControl/active')));
  await assertSucceeds(getDoc(doc(publicDb, `publicCatalogGenerations/${ACTIVE}/products/product-a`)));
  await assertSucceeds(getDocs(collection(publicDb, `publicCatalogGenerations/${ACTIVE}/games`)));
  await assertSucceeds(getDoc(doc(publicDb, `publicCatalogGenerations/${ACTIVE}/settings/general`)));
  await assertFails(getDoc(doc(publicDb, `publicCatalogGenerations/${INACTIVE}/products/staging-secret`)));
  await assertFails(getDoc(doc(publicDb, `publicCatalogGenerations/${ACTIVE}`)));
  await assertFails(getDoc(doc(publicDb, 'publicCatalogControl/publishSequence')));
});

test('admin can stage allowlisted generation documents and activate the pointer without changing canonical records', async () => {
  const next = 'catalog-prep-next';
  await assertSucceeds(setDoc(doc(adminDb, `publicCatalogGenerations/${next}/games/game-b`), {
    ...publicGame,
    id: 'game-b',
  }));
  await assertSucceeds(setDoc(doc(adminDb, `publicCatalogGenerations/${next}/products/product-b`), {
    ...publicProduct,
    id: 'product-b',
  }));
  await assertSucceeds(setDoc(doc(adminDb, `publicCatalogGenerations/${next}/settings/general`), publicSettings));
  await assertSucceeds(setDoc(doc(adminDb, `publicCatalogGenerations/${next}`), {
    generationId: next,
    games: 1,
    products: 1,
    rates: 0,
    settings: 1,
    createdAt: '2026-11-13T00:01:00.000Z',
  }));
  await assertSucceeds(updateDoc(doc(adminDb, 'publicCatalogControl/active'), {
    generationId: next,
    publishRevision: 2,
    publishedAt: '2026-11-13T00:01:00.000Z',
    games: 1,
    products: 1,
    rates: 0,
  }));
  await assertSucceeds(getDoc(doc(publicDb, `publicCatalogGenerations/${next}/products/product-b`)));
  await assertSucceeds(getDoc(doc(adminDb, 'products/canonical-product')));
});

test('anonymous and ordinary users cannot write generation data or publication controls', async () => {
  await assertFails(setDoc(doc(publicDb, `publicCatalogGenerations/${INACTIVE}/products/attack`), publicProduct));
  await assertFails(updateDoc(doc(publicDb, 'publicCatalogControl/active'), {
    generationId: 'attacker',
    publishRevision: 99,
    publishedAt: 'now',
    games: 0,
    products: 0,
    rates: 0,
  }));
  await assertFails(setDoc(doc(ordinaryDb, `publicCatalogGenerations/${INACTIVE}/products/attack`), publicProduct));
  await assertFails(setDoc(doc(ordinaryDb, 'publicCatalogControl/publishSequence'), {
    revision: 99,
    updatedAt: 'now',
  }));
});
