# SENA LUXE — security hardening review

Date: 2026-11-12
Branch: security/public-private-firestore-split
Scope: Firestore, Firebase Authentication, public catalog, admin operations, request intake, video data, CI and deployment boundary.

## Security controls implemented on this draft branch

- Default-deny Firestore catch-all remains in place.
- Public catalog listeners use dedicated mirror collections, not canonical product/game/rate/settings collections.
- Admin dashboard listeners use separate canonical state and are attached only after the app's admin check.
- Draft rules make canonical games, products, stone rates, settings, sequence ledgers, admin records, and product videos admin-only.
- Draft rules enforce exact field allowlists on public mirror writes, with basic type, length, price, category, status, and verification checks; an admin cannot accidentally add arbitrary private fields to a public mirror document.
- Draft admin-record rules no longer allow one admin to grant or edit another user's role: a legacy bootstrap admin may create only their own strictly shaped record; client updates/deletes and cross-user role creation are denied.
- Public mirrors are written by an admin-only builder using explicit field allowlists.
- Public request creation now has an exact field allowlist, required fields, bounded string lengths, a document-ID match, and a fixed initial status. Public reads/updates/deletes remain denied.
- Public mirror eligibility now also excludes legacy service/boosting/paid-currency wording in product and stone-rate display fields, matching the site's stone-account-only policy.
- Request IDs now use UUIDs rather than timestamp-only identifiers.
- Video upload/read/delete helpers now perform an admin check before attempting Firestore access. Firestore rules remain the enforcement boundary.
- No product credentials, price history, private settings, requests, sequences, video metadata or video chunks are copied into public mirrors.

## Confirmed risks and release blockers

### Critical — generation publication is implemented in draft code but not yet proven safe
The builder now writes a new immutable generation under `publicCatalogGenerations/{generationId}`, writes its settings and count metadata, then switches the single `publicCatalogControl/active` document only after all batches commit. A separate admin-only monotonic publish revision is reserved before staging; the final pointer switch runs in a transaction and refuses to replace a pointer with an equal/newer revision. This fences the previously identified out-of-order concurrent publisher race. Public listeners follow the pointer; draft rules allow public reads only when the generation ID matches the active pointer. Older generations are retained for rollback and are not automatically deleted.

Remaining checks before this can be considered production-ready:
- Firestore Rules Emulator tests have now been added on this branch using an isolated `demo-` project and the emulator's default database. They cover active/inactive generation reads, canonical/private collection denial, request schema validation, non-admin access denial, and admin publication allowlists. These tests are wired into CI but have not yet been observed passing.
- The emulator does not currently provide a reliable way to apply the configured rules to the production named database ID. Therefore these tests are a rules-logic check, not proof of the named production database's deployed rules. A separate controlled verification of the exact named database remains mandatory.
- Test failure before pointer update: the previous active generation must remain visible.
- Add emulator coverage for the publish revision fence and test pointer switch/rollback with concurrent admin publish attempts.
- Verify generation document paths and public listener behavior in a real browser.

Do not run this against production or publish restrictive rules until those tests pass.

### High — admin authorization has legacy hard-coded fallbacks
The current admin check accepts a hard-coded email or UID in addition to an `admins/{uid}` record. This was retained to avoid locking the existing owner out during migration. It is a long-term privilege-management risk and should be replaced by a verified admin allowlist or server-issued custom claims only after the actual owner account and recovery path are verified.

- Do not remove either fallback blindly; that could lock the owner out.
- Confirm the intended admin UID and verified email in Firebase Authentication.
- Draft rules now prevent cross-user admin role creation and deny client-side admin-record updates/deletes. This has not been exercised in Rules emulator tests yet.
- Ensure no ordinary account can create or modify an admin record.
- Consider MFA for every administrator.
- Keep public self-registration disabled.

### High — App Check is not configured in the app source
The Firebase app config has an empty `recaptchaSiteKey`, and the source initialization currently has no Firebase App Check initialization. App Check is not a substitute for Firestore Rules, but it is an important additional abuse barrier for public request writes and database access.

Required before enforcement:
- Register the web app with Firebase App Check and choose an appropriate supported provider.
- Add the real site key/configuration without exposing any secret.
- Test legitimate public browsing and admin sign-in first.
- Monitor metrics before enabling enforcement for the exact named Firestore database.
- Never enable enforcement until the app has been verified to send valid App Check tokens.

### High — security Rules tests are added but not yet verified
The branch now includes `firebase.json`, `@firebase/rules-unit-testing`, Firebase CLI, and `tests/firestore.rules.test.js`. CI runs the Firestore emulator suite between TypeScript checking and the production build. Test coverage includes active vs inactive public generations, canonical/private collection denial, request schema abuse, non-admin access, and admin publication allowlists. The emulator suite uses an isolated demo project/default database; it does not validate the production named database. The publication revision fence has been implemented in draft code and rules, but still requires emulator and concurrent-run verification.

Remaining:
- Observe a successful CI emulator run and inspect its test output.
- Perform a separately controlled rules verification against the exact production named database before release; do not infer this from emulator success.
- Expand coverage after validating the first run, including every collection/subcollection and failure/rollback scenarios.

### High — public video playback is intentionally disabled by the privacy split
Public product mirrors omit `videoUrl` and `videoStorageId`. Video metadata/chunks are admin-only. The client video helpers now reject non-admin access. This protects private videos but means the existing public product-card video path cannot be treated as supported until a separate safe public-video publishing design is implemented and tested.

Do not relax video rules or copy video IDs into public mirrors without reviewing product publication state, ownership, file size, and deletion/unpublish behavior.

### Medium — request validation is not rate limiting
The strict request schema blocks extra fields and oversized content but does not stop automated repeated submissions. App Check, abuse monitoring, and possibly a server-side rate-limit mechanism remain necessary.

### Medium — connection health check is not an authorization test
`testFirestoreConnection()` reads `test/connection` and treats permission-denied as server reachability. This allows the app to avoid a false offline state when the collection is admin-only, but it does not verify public read/write permissions. Keep it separate from security tests.

### Medium — security headers have not been audited
Review Cloudflare-served response headers (CSP, frame restrictions, MIME sniffing, referrer policy, permissions policy, and cache behavior) after confirming the current app's inline scripts, Firebase Auth popup/redirect, image sources, and external links. Do not add a restrictive CSP blindly; it can break the site.

## Required verification matrix

| Area | Anonymous visitor | Authorized admin | Current state |
|---|---|---|---|
| Public catalog mirrors | Read only | Read/write | Draft rules/code only; live access untested |
| Canonical games/products/rates | Denied | Read/write | Draft rules only |
| Canonical settings | Denied | Read/write | Draft rules only |
| Requests | Validated create only; no read | Read/manage | Draft rules only |
| Sequences | Denied | Read/write | Draft rules only |
| Admin records | No list/read of others; no write | Controlled admin access | Draft rules only |
| Product videos/chunks | Denied | Read/write | Draft rules + client guard |
| App Check | Enforced only after valid setup | Enforced only after valid setup | Not configured |
| Security Rules emulator tests | Test cases authored; results pending | Test cases authored; results pending | Added to branch CI on isolated emulator default DB; named production DB still unverified |
| Public mirror atomic switch | Read active generation only | Publish staged generation | Not implemented |

## Release gates

1. Complete staged/versioned mirror publication and rollback.
2. Audit all Firestore reads/writes across the repository and all external/public routes.
3. Run and pass the new Rules emulator tests, then expand coverage for rollback and concurrent publishing.
4. Verify admin identity, MFA, and recovery before changing legacy authorization fallbacks.
5. Configure App Check and observe valid traffic before enforcement.
6. Verify public product browsing and admin CRUD, video behavior, request intake, numbering, price history, logout/login, and error recovery.
7. Review security headers without changing the visual design.
8. Run the migration only after all previous gates pass.
9. Obtain separate approval before publishing rules to the exact named database or deploying the production Worker.

## Production safety

No production Worker deployment, Firebase Console Rules publication, live mirror migration, Firebase Storage/R2 enablement, paid-plan change, or canonical product/price/history/sequence mutation was performed as part of this review.
