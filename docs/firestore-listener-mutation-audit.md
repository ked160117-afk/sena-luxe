# Firestore privacy split — listener and mutation audit

Date: 2026-11-12
Branch: security/public-private-firestore-split
Status: audit only; no production or Firebase Console changes.

## Findings

### Public listeners currently read canonical collections

`StoreContext.tsx` attaches these listeners unconditionally, before admin authentication:

- `games`
- `products`
- `stoneRates`
- `settings/general`

This is incompatible with restrictive canonical rules. These listeners must be redirected to the sanitized public mirrors before canonical reads are denied.

### Admin UI currently consumes the same context state

`AdminDashboardView` reads `games`, `products`, `stoneRates`, and `settings` from the shared StoreContext. Therefore a listener switch alone would also deprive the admin dashboard of canonical records and private fields. Separate admin-only state/listeners are required, and the dashboard must consume those canonical admin states after authorization.

### Mutation paths that need mirror consistency

Product:
- `createProductAtomic` creates canonical product and advances `sequences` in one transaction.
- `updateProductDoc` updates canonical product.
- `deleteProductDoc` deletes canonical product and updates permanent-number ledger.
- `toggleProductStatus` calls `updateProductDoc`.
- Video upload currently writes `productVideos` metadata/chunks separately; public mirror builder intentionally excludes video fields.

Stone rates:
- `updateStoneRatePriceDoc` writes price, status, verification flag and price history.
- `updateStoneRateDoc` edits plan details.
- `addStoneRatePlanDoc` creates a plan.
- `setAllStoneRatesPreparation` batch-updates all canonical rates directly from StoreContext.

Games:
- `addGameDoc`, `updateGameDoc`, and `promoteCandidateDoc` write canonical game records.
- `addNewCandidateGame` currently uses `updateGameDoc` to create a candidate record.

Settings:
- `saveSettingsDoc` writes canonical `settings/general`.

Requests and sequences are separate private/admin workflows and must not be copied into public mirrors.

## Important safety findings

1. The current public mirror builder is a one-time/manual rebuild, not an automatic synchronization mechanism. It cannot yet keep mirrors current after each admin mutation.
2. A public mirror must be changed in the same Firestore transaction/batch as the canonical mutation wherever feasible. Otherwise a failed mirror write can leave stale public content visible.
3. Product deletion must remove the matching `publicProducts/{id}` document while preserving the sequence ledger's permanent-number record.
4. Product status/category/verification/price edits must remove the public mirror whenever the product no longer meets the allowlist.
5. Stone-rate price edits currently deliberately set `isPreparation: true` and `verifiedForPublic: false`; the public mirror must therefore remove the rate until it is separately confirmed and explicitly eligible.
6. Game edits that set `isHandled: false` must remove the public mirror; candidates must never be exposed through `publicGames`.
7. The current public listener's legacy stone-rate fallback can restore an initial catalog price when a Firestore price is null. This behavior must not be carried into the new public mirror reader: a public price must come only from the explicitly verified mirror record. Do not alter canonical records or price history as part of this change.
8. Public settings must be projected using an explicit allowlist. Admin settings must continue to read/write canonical `settings/general`.
9. Existing Firestore rules still permit anonymous reads of canonical catalog collections. Do not deploy restrictive rules until all public listeners and every relevant admin path are switched and verified.
10. Product videos remain unresolved. Keep their metadata and chunks private; do not publish video URLs/IDs or enable public video reads until a separate reviewed design ties a video to an eligible currently published product.

## Safe implementation order

1. Introduce distinct public and admin state in StoreContext without changing current listener behavior yet.
2. Add admin-only canonical listeners and make AdminDashboard consume the admin state. Clear private state on logout/auth loss.
3. Switch public listeners to `publicGames`, `publicProducts`, `publicStoneRates`, and `publicSettings/general`; keep harmless static fallback catalog data only where it cannot invent stock or prices.
4. Implement atomic canonical + mirror mutation helpers and cover all mutation paths above, including stale mirror deletion.
5. Build mirrors once from verified canonical records while admin is authenticated.
6. Run build/lint/tests and review the complete diff.
7. Verify with anonymous and admin test sessions against the exact named Firestore database.
8. Only after all checks pass, separately approve and publish restrictive rules to that exact database.

## Not performed

- No Firebase Console rules publication.
- No live mirror rebuild or canonical data migration.
- No changes to production Worker/deployment.
- No deletion or rewriting of canonical products, prices, histories, or sequence ledgers.
- No claim that anonymous access is blocked yet.


## Follow-up source verification (2026-11-12)

The earlier sections above record the original audit state. The following changes were subsequently implemented on this draft branch and supersede the earlier statements that the listener split is pending:

- Public `StoreContext` listeners now read `publicGames`, `publicProducts`, `publicStoneRates`, and `publicSettings/general` only.
- Admin-authorized listeners separately read canonical `games`, `products`, `stoneRates`, `settings/general`, `sequences`, and `requests`; private context state is cleared when admin authorization is lost or the user logs out.
- Admin dashboard consumers were switched to the separate canonical admin state.
- Admin mutation wrappers now invoke a full public-mirror rebuild after canonical writes, including product, rate, game, and settings mutation paths.
- The rebuild remains non-atomic: it writes mirror documents in multiple batches and may leave a partial or stale public mirror after failure. This is a production blocker, not a completed security solution.
- The draft Firestore rules restrict canonical catalog/settings/video reads to admins and allow public reads only from mirrors. The rules have not been published to Firebase Console.
- The draft `test/{docId}` rule is admin-only. `testFirestoreConnection()` treats permission-denied and all other non-offline errors as successful reachability, so ordinary visitors do not currently fail the connection check solely because they cannot read `test/connection`. This behavior is not a robust health or authorization test and should be redesigned separately.

## Remaining release blockers

1. Replace in-place multi-batch mirror refresh with a staged generation plus active pointer, or an equally safe design with a single publication boundary.
2. Audit the full repository for Firestore reads outside the already inspected context/service paths and confirm no public component depends on canonical-only fields.
3. Add automated Rules tests for anonymous and authorized-admin access against the exact named database configuration.
4. Test every CRUD, publish/unpublish, bulk update, delete, numbering, price-history, and logout/login path.
5. Run a controlled migration only after those checks; do not run the current non-atomic builder against production.
6. Keep production Worker and Firebase Console rules unchanged until separately authorized and all release gates pass.
