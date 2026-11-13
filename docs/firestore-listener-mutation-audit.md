# Firestore privacy split — listener and mutation audit

Date: 2026-11-14
Branch: integration/security-catalog-split
Status: source review of the draft integration branch only. No production or Firebase Console changes.

## Current draft-branch implementation

### Public and admin listeners

- Public catalog listeners use the active immutable generation under `publicCatalogGenerations/{generationId}` for games, products, stone rates, and public settings.
- The active generation is selected through `publicCatalogControl/active`.
- Admin-only listeners read canonical games, products, stone rates, settings, sequences, and requests only after admin authorization.
- The admin dashboard consumes the separate admin state.
- Admin state is cleared when authorization is lost or the account changes.
- Draft Firestore rules deny anonymous reads of canonical catalog, settings, video, sequence, request, and admin data. They allow public reads only from the active public generation and the narrowly scoped public request-create path.
- These rules are in the repository only; they have not been published to the production named database.

### Admin mutation and publication paths

The StoreContext mutation wrappers currently call `rebuildPublicCatalogMirrors()` after successful canonical writes for:
- product create, update, delete, and publish/unpublish status changes;
- stone-rate price changes, plan edits, plan additions, and bulk preparation;
- game edits, new handled titles, candidate creation, and candidate promotion;
- public-facing settings changes.

The builder reads canonical data as an authorized admin, applies explicit public field allowlists and eligibility checks, stages a new immutable generation in bounded batches, and changes the active pointer only after staging succeeds. A failed staging operation leaves the previous active generation selected. Revision fencing prevents an older concurrent publisher from replacing a newer generation.

This is a sequential canonical-write-then-publish workflow, not a single transaction spanning the canonical mutation and public snapshot. If the canonical write succeeds but publication fails, the previous public generation remains visible until an administrator retries publication. The UI surfaces a publication failure; it must not be described as a fully successful public update.

The current implementation performs a full catalog rebuild after each relevant admin mutation. This is simple and keeps the published snapshot coherent, but it can create substantial reads/writes as the catalog grows. Confirm the exact database free-tier assignment and current usage before running it against production. A future optimization could coalesce writes or publish only affected records, but must preserve the immutable-generation and atomic-pointer safety properties.

### Public data eligibility and exclusions

- Public products are limited to verified, published `引退垢` entries with valid positive prices and required bounded display fields.
- Public stone rates require explicit `currencyType: '無償'`, verified public status, active handling status, non-preparation state, and a valid positive price.
- Public games must be handled titles.
- Public settings use a fixed field allowlist.
- Private notes, price history, requests, sequence ledgers, admin records, video metadata, and video chunks are not copied into public generations.
- Product video playback is not implemented as a public feature by this migration; video data remains private.

### Other admin and public workflows

- Public request creation is schema- and length-validated in draft rules; public reads, updates, and deletes remain denied.
- Request rate limiting is not implemented. App Check does not replace rate limiting.
- Login no longer auto-creates admin role documents or auto-seeds initial catalog data.
- Manual initial seed and bulk-sync controls show a warning that Firestore reads/writes may occur.
- The legacy admin email/UID fallback remains in place to avoid accidental lockout. Confirm ownership, recovery, and MFA before any future removal or tightening.
- App Check initialization is conditional, but the configured reCAPTCHA v3 site key is currently blank. App Check is therefore not active/enforced by this code as checked.

## Automated verification on the draft branch

The latest previously checked CI run for the integration branch completed successfully for:
- TypeScript/lint and production build;
- Firestore Rules Emulator suites;
- exact named-database target configuration check;
- Cloudflare `_headers` build-asset inclusion;
- browser bundle check for Node gRPC transport;
- dependency audit gates.

The emulator uses an isolated demo project/default database. It does not prove that the production named database has the intended rules, billing/free-tier assignment, data shape, or live access behavior. CI success is not production verification.

## Remaining release gates

1. Verify the configured named Firestore database's edition, free-tier assignment, billing plan, and current usage in Firebase Console. Do not enable Blaze or change billing without explicit approval.
2. Register and configure reCAPTCHA v3 for Firebase App Check, set the public site key, verify token metrics and compatibility, and only then consider enforcement. Do not enable enforcement while the key is blank or tokens are unverified.
3. Confirm the real admin account UID/email, recovery path, and MFA. Do not remove the legacy fallback until access is proven safe.
4. Back up the production named database and plan a controlled release sequence that deploys rules to that exact named database, deploys the matching Worker build, signs in as admin, publishes a public generation, and verifies public and admin behavior.
5. Run real-browser checks against the deployed site: public catalog loads from the active generation; anonymous reads of canonical/private collections are denied; admin CRUD, publication, logout/login, request intake, and numbering behave correctly.
6. Verify live Worker response headers. CI currently verifies only that `dist/_headers` contains the configured headers; it does not verify the live response. A CSP is not included pending compatibility review.
7. Review public request abuse controls and decide whether server-side rate limiting is required before broad launch.
8. Keep public video playback out of scope until a separate reviewed design is implemented and tested.

## Not performed

- No Firebase Console rules publication or production database writes.
- No production mirror rebuild or canonical data migration.
- No Cloudflare Worker deployment or live response-header verification.
- No billing-plan changes or paid services enabled.
- No deletion or rewriting of canonical products, prices, price histories, or sequence ledgers.
- No claim that production anonymous access is already blocked.
