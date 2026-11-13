## Named database billing gate

The configured database is a non-default named Firestore database. Google Cloud's current Firestore pricing documentation states that named databases require billing to be enabled and do not qualify for the free allocation. The actual project billing state must be checked in Firebase/Google Cloud Console. Do not run the live generation-preparation button or perform migration reads/writes until billing and possible charges are explicitly confirmed. No live data migration or billing change has been performed.

# Firestore privacy hardening migration plan

Status (2026-11-13): public/admin listener split and immutable generation publisher are implemented on the draft security branch. Latest CI on the PR branch passed TypeScript, all 9 Firestore Rules Emulator tests, production build, exact named-database target validation, browser bundle check, and dependency gates. A committed `package-lock.json` now pins the verified dependency tree, and CI uses `npm ci`. Production-only audit: 0 advisories. Full dependency tree: 13 moderate, 0 high, 0 critical (CI blocks high/critical). The emulator uses an isolated demo project's default database, not the production named database. Generation failure/rollback/concurrency, App Check, real-browser checks, and production deployment remain pending. No production Firestore rules, live data, or Worker deployment have been changed.

## Goal
Prevent unauthenticated visitors from reading private product drafts, unlisted products, internal price history, inquiry records, sequence ledgers, admin settings, and admin records directly from Firestore. Publicly displayed catalog fields remain public by design.

## Confirmed current behavior
- The app connects to the named database configured in `firebase-applet-config.json`: `ai-studio-senaluxe-db843e7b-ccb6-43a4-9c9e-55c8dd6ab699`.
- Draft `firebase.json` now uses the multi-database array form with exactly that named database and `firestore.rules`; it deliberately does not configure `(default)`. CI checks that the rules target matches `firebase-applet-config.json`. When production deployment is separately approved, target only `firebase deploy --only firestore:ai-studio-senaluxe-db843e7b-ccb6-43a4-9c9e-55c8dd6ab699`.
- On the draft branch, public listeners follow `publicCatalogControl/active` and subscribe only to `publicCatalogGenerations/{activeGeneration}/games`, `/products`, `/stoneRates`, and `/settings/general`; admin-only listeners subscribe to canonical collections after admin authorization.
- Production rules have not been changed and still allow public reads of canonical `games`, `products`, `stoneRates`, `productVideos` and its chunks, `settings`, and `test`.
- Draft rules restrict canonical catalog/settings/video reads to admins and expose only the currently active immutable generation. Legacy flat `publicGames`, `publicProducts`, `publicStoneRates`, and `publicSettings` collections are admin-only in the draft rules. These rules have not been published.
- `testFirestoreConnection()` performs a server read of `test/connection`; it returns true for permission-denied and other non-offline errors, so the draft admin-only `test` rule does not currently block general visitors. This check proves reachability only weakly and is not an authorization test.
- Current production `requests/{requestId}` permits unrestricted public creates (`allow create: if true`) without a schema/size/status allowlist; reads and management are admin-only. The draft rules tighten create validation, but App Check/rate limiting remains separate. `sequences` is admin-only.
- Admin recognition currently includes a hard-coded email and UID fallback as well as `admins/{uid}`; preserve account access during any change and review this bootstrap path separately.

## Target collection layout
| Collection | Public access | Admin access | Purpose |
|---|---|---|---|
| `publicCatalogGenerations/{active}/games` | Read only for active generation | Admin writes | Only handled catalog titles and safe display fields |
| `games` | None | Read/write | Full game catalog including candidates and internal fields |
| `publicCatalogGenerations/{active}/products` | Read only for active generation | Admin writes | Sanitized currently published products only |
| `products` | None | Read/write | Canonical product records, including drafts/unpublished data |
| `publicCatalogGenerations/{active}/stoneRates` | Read only for active generation | Admin writes | Sanitized, explicitly verified current rates only |
| `stoneRates` | None | Read/write | Canonical plans, preparation flags, notes, and price history |
| `publicCatalogGenerations/{active}/settings/general` | Read only for active generation | Admin writes | Explicit allowlist of public settings only |
| `publicCatalogControl/active` | Read only | Admin pointer switch | Publishes the complete generation after staging succeeds |
| `publicCatalogControl/publishSequence` | None | Admin only | Monotonic publication revision fence |
| `publicCatalogGenerations/{generationId}` root metadata | None | Admin only | Generation metadata/counts; old generations retained for rollback |
| Legacy flat public mirror collections | None | Admin only | No longer used by the storefront |
| `settings/general` | None | Read/write | Full admin settings |
| `productVideos` | None by default | Read/write | Private video metadata/chunks; public video publishing requires a separate reviewed mirror |
| `requests` | Create only with strict validation | Read/write | Customer requests |
| `sequences` | None | Read/write | Numbering and permanent-retirement ledger |
| `admins` | None | Read/write by authorized admins | Admin authorization |

## Publication rules
- A product may enter the active generation's `products` subcollection only when `verifiedForPublic === true`, category is `ゲーム内通貨・石垢` or `引退垢`, status is `掲載中`, price is a positive number, and title/summary are non-empty.
- Every public product document must be constructed from an explicit field allowlist. Never spread the canonical product object into the public document.
- Unpublishing, deleting, or invalidating a product must remove its public mirror in the same trusted write operation.
- A stone rate may enter the active generation's `stoneRates` subcollection only when explicitly verified, status is `取扱中`, preparation is false, current price is positive, and required display fields are non-empty. Do not copy `priceHistory`, internal notes, or reference prices unless separately approved for public display.
- Only `isHandled === true` games should be mirrored to the active generation's `games` subcollection.
- Only the explicit public settings allowlist should be mirrored.
- Video metadata and chunks remain private until an approved publishing design ties them to a currently public product. Do not make the existing entire video collection public.

## Migration sequence (do not skip)

1. Implemented on the draft branch: public/admin listeners are separated. Public listeners follow `publicCatalogControl/active`; admin listeners read canonical collections only after admin authorization.
2. Implemented on the draft branch: an admin-only publisher reads canonical data, applies explicit public field allowlists and eligibility checks, stages a unique immutable generation under `publicCatalogGenerations/{generationId}`, writes public settings and metadata, and only then transactionally switches the active pointer.
3. Implemented on the draft branch: a monotonic `publishSequence` is reserved before the canonical snapshot is read. The final pointer transaction refuses to activate an older/equal revision if a newer publish is already active. Older generations are retained; no cleanup is run.
4. Implemented on the draft branch: public mirror reads reset to safe empty/static defaults when the pointer is missing or listeners fail. Admin canonical state is separate and cleared on logout/auth loss.
5. Implemented on the draft branch: admin mutation wrappers request a full generation rebuild after canonical changes. If rebuilding fails, the last active generation remains intact; the admin operation reports the publish failure. The storefront may temporarily show the previous snapshot until an admin retries publication. Automated retry/reconciliation and mutation-specific failure recovery still need testing.
6. CI verification: 9 Firestore Rules Emulator test cases pass, including active/inactive generation access, anonymous collection enumeration denial across canonical/private collections, request schema validation, non-admin access denial, and public field allowlists. TypeScript check and production build also pass. These tests run against an isolated demo project's default database only.
7. Partially verified: emulator tests inject a failure into the second generation batch after 400 valid documents have been staged; they confirm the active pointer remains unchanged and anonymous users cannot read the partial generation. Tests also cover concurrent revision reservation, stale publisher rejection, and rollback to a retained generation. Real-browser CRUD/publish/unpublish/price-verification paths and simultaneous full admin UI publisher execution remain pending.
8. Dependency gate passed for high/critical findings: production-only audit 0 advisories; full dependency tree has 13 moderate, 0 high, 0 critical. The committed lockfile and `npm ci` make this result reproducible. Review moderate dev-tool advisories periodically.
9. Pending: verify admin identity, recovery, and MFA strategy; preserve the current owner fallback until this is safely confirmed.
10. Pending: configure Firebase App Check with a real provider/site key, observe valid traffic, and then decide whether to enforce it on the exact named database. A conditional reCAPTCHA v3 App Check initializer is in the draft source, but the configured site key is empty and enforcement remains off.
11. Pending: perform controlled verification against the exact named production database. Do not assume the emulator's default database represents it.
12. Before production rollout, prepare a no-downtime staging path. The current production Worker does not contain the new generation publisher; deploying the listener-split Worker before an active generation exists would temporarily show an empty public catalog. Use either a secured preview Worker or a separate additive admin-only preparation release/rules to build and verify the generation while the current storefront continues working. Do not tighten canonical rules yet. Once the active generation is confirmed, deploy the listener-split Worker, then publish restrictive rules to the exact named database (never `(default)` by mistake). Verify public browsing and direct anonymous denial of every canonical/private collection. A separate additive preparation draft is now available as PR #2: https://github.com/ked160117-afk/sena-luxe/pull/2. It keeps the current storefront listeners and canonical public reads intact while staging the new generation. Both PRs remain drafts and require separate approval before any deployment.
13. Confirm the public storefront remains functional and admin CRUD, request intake, numbering, price history, logout/login, error recovery, and rollback all work. Do not proceed to retired-account content work until this security task is genuinely complete.

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

- The generation builder copies only `lineUrl`, `shopNotice`, `enableDirectLineCopy`, and `contactDeskHours` from canonical `settings/general` to `publicCatalogGenerations/{generationId}/settings/general`.
- The public listener has been switched on the draft branch. No other settings fields are copied. Production rules remain unchanged.


## Write-path audit (2026-11-12)

The following application write paths were confirmed during source inspection. They write canonical collections first; the StoreContext admin mutation wrappers then rebuild a complete immutable public generation. They do not patch individual public documents in-place:

- Products: createProductAtomic, updateProductDoc, deleteProductDoc, and the status toggle routed through updateProductDoc.
- Stone rates: updateStoneRatePriceDoc, updateStoneRateDoc, addStoneRatePlanDoc, and the direct batch in StoreContext.setAllStoneRatesPreparation.
- Games: addGameDoc, updateGameDoc, promoteCandidateDoc, and candidate creation routed through updateGameDoc.
- Public settings: saveSettingsDoc.
- The generation publisher is triggered by admin mutations and the admin dashboard; it creates an immutable snapshot then atomically switches the active pointer. Previous generations are retained for rollback.

Important consequence: a successful canonical write followed by a failed generation rebuild leaves the previous active generation visible (no partially staged generation becomes public), but the storefront can temporarily show the prior snapshot. The admin operation surfaces the publish failure; the admin must retry publication. The price-change operation marks a rate unverified/preparation, so the next successful generation excludes it. Retry/reconciliation behavior must be exercised before production.

## Next implementation gates

1. Partially complete: 9 emulator tests now cover a real partial generation batch failure, private staged documents, pointer rollback, concurrent revision reservation, and stale publish rejection. Real-browser and simultaneous full admin UI publisher checks remain before production release.
2. Verify the public storefront and admin CRUD in a real browser, including product create/update/delete, publish/unpublish, rate verification/preparation, settings updates, numbering, price-history preservation, and logout/login.
3. Resolve the production dependency audit findings without blind downgrades or unverified compatibility overrides.
4. Confirm owner admin identity, recovery path, and MFA; do not remove the legacy owner fallback until verified.
5. Register reCAPTCHA v3 for the web app/domain, set `recaptchaSiteKey`, verify valid tokens and traffic, then evaluate enforcement. The initializer is present but currently inactive because the key is empty.
6. Verify the exact named production database and confirm anonymous users cannot read or enumerate canonical/private collections.
7. Only with separate approval, run the staged generation migration, publish rules to the exact named database, deploy the Worker, and verify live headers and public/admin behavior.

The following are release blockers, not claims of completion. No production rules, live mirror migration, or Worker deployment has been performed.

## Public request write hardening (2026-11-12)

The draft rules now validate public request creation against an exact field allowlist and bounded string lengths. Clients cannot submit extra fields such as `adminNotes` or choose a non-initial status; the document ID must match the `id` field. Reads, updates, and deletes remain admin-only. The latest 7-case emulator suite passes these request tests. This reduces malformed/oversized writes but is not rate limiting or bot protection. Firebase App Check and abuse controls remain a separate release gate.
