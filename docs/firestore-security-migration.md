# Firestore privacy hardening migration plan

Status: public/admin listener split and initial mirror refresh hooks are implemented on a draft branch. The refresh mechanism is not atomic and is not production-ready. No production Firestore rules or data have been changed.

## Goal
Prevent unauthenticated visitors from reading private product drafts, unlisted products, internal price history, inquiry records, sequence ledgers, admin settings, and admin records directly from Firestore. Publicly displayed catalog fields remain public by design.

## Confirmed current behavior
- The app connects to the named database configured in `firebase-applet-config.json`: `ai-studio-senaluxe-db843e7b-ccb6-43a4-9c9e-55c8dd6ab699`.
- On the draft branch, public listeners now subscribe to `publicGames`, `publicProducts`, `publicStoneRates`, and `publicSettings/general`; admin-only listeners subscribe to canonical collections after admin authorization.
- Production rules have not been changed and still allow public reads of canonical `games`, `products`, `stoneRates`, `productVideos` and its chunks, `settings`, and `test`.
- Draft rules restrict canonical catalog/settings/video reads to admins and expose only the public mirror collections, but these rules have not been published.
- `testFirestoreConnection()` performs a server read of `test/connection`; it returns true for permission-denied and other non-offline errors, so the draft admin-only `test` rule does not currently block general visitors. This check proves reachability only weakly and is not an authorization test.
- `requests` permits public creates but restricts reads and management to admins. `sequences` is admin-only.
- Admin recognition currently includes a hard-coded email and UID fallback as well as `admins/{uid}`; preserve account access during any change and review this bootstrap path separately.

## Target collection layout
| Collection | Public access | Admin access | Purpose |
|---|---|---|---|
| `publicGames` | Read only | Read/write | Only handled catalog titles and safe display fields |
| `games` | None | Read/write | Full game catalog including candidates and internal fields |
| `publicProducts` | Read only | Read/write | Sanitized currently published products only |
| `products` | None | Read/write | Canonical product records, including drafts/unpublished data |
| `publicStoneRates` | Read only | Read/write | Sanitized, explicitly verified current rates only |
| `stoneRates` | None | Read/write | Canonical plans, preparation flags, notes, and price history |
| `publicSettings/general` | Read only | Read/write | Explicit allowlist of public settings only |
| `settings/general` | None | Read/write | Full admin settings |
| `productVideos` | None by default | Read/write | Private video metadata/chunks; public video publishing requires a separate reviewed mirror |
| `requests` | Create only with strict validation | Read/write | Customer requests |
| `sequences` | None | Read/write | Numbering and permanent-retirement ledger |
| `admins` | None | Read/write by authorized admins | Admin authorization |

## Publication rules
- A product may enter `publicProducts` only when `verifiedForPublic === true`, category is `ゲーム内通貨・石垢` or `引退垢`, status is `掲載中`, price is a positive number, and title/summary are non-empty.
- Every public product document must be constructed from an explicit field allowlist. Never spread the canonical product object into the public document.
- Unpublishing, deleting, or invalidating a product must remove its public mirror in the same trusted write operation.
- A stone rate may enter `publicStoneRates` only when explicitly verified, status is `取扱中`, preparation is false, current price is positive, and required display fields are non-empty. Do not copy `priceHistory`, internal notes, or reference prices unless separately approved for public display.
- Only `isHandled === true` games should be mirrored to `publicGames`.
- Only the explicit public settings allowlist should be mirrored.
- Video metadata and chunks remain private until an approved publishing design ties them to a currently public product. Do not make the existing entire video collection public.

## Migration sequence (do not skip)
1. Implemented on the draft branch: an admin-only mirror builder writes allowlisted `publicGames`, `publicProducts`, `publicStoneRates`, and `publicSettings/general`; matching draft rules permit public reads and admin writes. This has not been deployed or executed against the live database.
2. Completed on the draft branch: public website listeners now read only `publicGames`, `publicProducts`, `publicStoneRates`, and `publicSettings/general`.
3. Completed on the draft branch: separate admin-only canonical listeners feed the admin dashboard after admin authorization; private state is cleared on logout/auth loss.
4. Partially implemented only: mutation wrappers trigger a full mirror rebuild after canonical writes. This is non-atomic, may leave stale or partially refreshed mirrors if a later batch fails, and must be replaced or made safely recoverable before production.
5. Pending: replace the in-place multi-batch rebuild with a staged/versioned generation and a single active-generation pointer (or another demonstrably safe atomic publication design). Do not run the current builder against production yet.
6. Pending: execute a controlled migration only after the publication design and write paths are tested. The current builder does not modify canonical records, prices, price histories, product numbers, or sequence ledgers, but can rewrite public mirror collections.
7. Pending: test anonymous reads and writes, admin reads/writes, CRUD/publish/unpublish, numbering, price history, logout/login, and the public site against the exact named database.
8. Only after all tests pass, separately approve and publish restrictive rules to the exact named database. Never publish to `(default)` by mistake.
9. Verify direct unauthenticated reads of canonical collections are denied, while only approved public mirrors remain readable and the site continues to work.

## Required security-rule principles
- Default deny for every collection.
- No public read on canonical collections.
- No public write except narrowly validated request creation.
- Rules are not query filters. The app must query public mirror collections rather than query canonical collections and expect Firestore to filter records.
- Keep all admin writes protected by an authorization mechanism that cannot be self-granted by an ordinary signed-in user.
- Review request validation and abuse protection separately.

## Safety / billing constraints
- Do not enable Firebase Storage, Cloudflare R2, Blaze, or any paid add-on as part of this work.
- Do not migrate video chunks automatically; the current Firestore chunk design has quota and bandwidth implications and needs a separate cost review.
- Do not delete, overwrite, or normalize canonical product, price, price-history, or sequence data.
- A Firebase web API key is not a secret; Firestore Security Rules are the actual access control boundary.

## Completion criteria
This task is complete only when code is merged, rules are published to the correct named database, the migration has run, and anonymous-vs-admin access tests plus real site checks have passed. A GitHub branch or successful build alone is not completion.


## Public settings mirror

- The migration builder copies only `lineUrl`, `shopNotice`, `enableDirectLineCopy`, and `contactDeskHours` from `settings/general` to `publicSettings/general`.
- The public listener has been switched on the draft branch. No other settings fields are copied. Production rules remain unchanged.


## Write-path audit (2026-11-12)

The following application write paths were confirmed during source inspection. They currently write canonical collections and do not yet maintain the corresponding public mirror in the same operation:

- Products: createProductAtomic, updateProductDoc, deleteProductDoc, and the status toggle routed through updateProductDoc.
- Stone rates: updateStoneRatePriceDoc, updateStoneRateDoc, addStoneRatePlanDoc, and the direct batch in StoreContext.setAllStoneRatesPreparation.
- Games: addGameDoc, updateGameDoc, promoteCandidateDoc, and candidate creation routed through updateGameDoc.
- Public settings: saveSettingsDoc.
- The current mirror builder is a one-time/manual rebuild. It is not a live synchronization mechanism.

Important consequence: switching listeners or tightening rules before every write path is updated would cause stale or missing public catalog data. In particular, the current price-change operation intentionally marks a rate as unverified/preparation; its public mirror must be removed as part of that same logical change. A later verification/publish action must add it back only after all eligibility checks pass.

## Next implementation gates

1. Replace the current in-place mirror rebuild with a staged/versioned publication mechanism; ensure public clients can read only the active generation and cannot enumerate staging data.
2. Audit every public-facing component for reliance on omitted private fields, especially videoUrl/videoStorageId and settings fields.
3. Make all mutations keep public mirrors consistent; cover unpublish/delete, category/verification/price changes, bulk preparation, and settings changes. Include retries/reconciliation for partial failures.
4. Audit all Firestore reads outside StoreContext and firestoreService, including direct reads of `requests`, `sequences`, `admins`, and `test`.
5. Add automated Firestore Rules tests (emulator if available) for anonymous and admin read/write permissions.
6. Run build/type checks and focused tests for public browsing, admin CRUD, product numbering, price history preservation, and logout/login state reset.
7. Only then execute the controlled mirror migration and test actual anonymous/admin access against the exact named database.

No application listener or mutation behavior was changed by this audit note. This document is still on the draft branch only.
