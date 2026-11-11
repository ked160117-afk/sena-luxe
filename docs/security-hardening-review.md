# SENA LUXE — security hardening review

Date: 2026-11-12
Branch: security/public-private-firestore-split
Scope: Firestore, Firebase Authentication, public catalog, admin operations, request intake, video data, CI and deployment boundary.

## Security controls implemented on this draft branch

- Default-deny Firestore catch-all remains in place.
- Public catalog listeners use dedicated mirror collections, not canonical product/game/rate/settings collections.
- Admin dashboard listeners use separate canonical state and are attached only after the app's admin check.
- Draft rules make canonical games, products, stone rates, settings, sequence ledgers, admin records, and product videos admin-only.
- Draft admin-record rules no longer allow one admin to grant or edit another user's role: a legacy bootstrap admin may create only their own strictly shaped record; client updates/deletes and cross-user role creation are denied.
- Public mirrors are written by an admin-only builder using explicit field allowlists.
- Public request creation now has an exact field allowlist, required fields, bounded string lengths, a document-ID match, and a fixed initial status. Public reads/updates/deletes remain denied.
- Public mirror eligibility now also excludes legacy service/boosting/paid-currency wording in product and stone-rate display fields, matching the site's stone-account-only policy.
- Request IDs now use UUIDs rather than timestamp-only identifiers.
- Video upload/read/delete helpers now perform an admin check before attempting Firestore access. Firestore rules remain the enforcement boundary.
- No product credentials, price history, private settings, requests, sequences, video metadata or video chunks are copied into public mirrors.

## Confirmed risks and release blockers

### Critical — public mirror refresh is not atomic
The current mirror builder writes multiple batches directly into the live public mirror collections and removes stale rows. A failure between batches can leave a mixed or partial public catalog. Mutation wrappers call this rebuild after the canonical write, so a successful canonical mutation followed by a failed rebuild can temporarily leave stale public content.

Required before production:
- Replace this with a staged/versioned generation and a single active-generation pointer, or another publication design with a single safe commit boundary.
- Ensure rules expose only the active generation, not staging generations.
- Verify the staged snapshot before switching the pointer.
- Retain the previous active generation for rollback until the new one is verified.

Do not run the current in-place rebuild against production and do not publish restrictive rules yet.

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

### High — security Rules tests are not yet automated
The repository currently has no Firebase emulator configuration or Rules unit-test dependency. A successful TypeScript/build workflow does not prove anonymous access is denied.

Required:
- Add Firebase Emulator + `@firebase/rules-unit-testing` tests.
- Test anonymous and admin reads/writes for every collection and subcollection.
- Test the named database configuration, not just the default database.
- Include request-schema abuse tests and cross-user admin-document tests.

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
| Security Rules emulator tests | Denied/allowed cases verified | Authorized cases verified | Not implemented |
| Public mirror atomic switch | Read active generation only | Publish staged generation | Not implemented |

## Release gates

1. Complete staged/versioned mirror publication and rollback.
2. Audit all Firestore reads/writes across the repository and all external/public routes.
3. Implement Rules emulator tests and pass them.
4. Verify admin identity, MFA, and recovery before changing legacy authorization fallbacks.
5. Configure App Check and observe valid traffic before enforcement.
6. Verify public product browsing and admin CRUD, video behavior, request intake, numbering, price history, logout/login, and error recovery.
7. Review security headers without changing the visual design.
8. Run the migration only after all previous gates pass.
9. Obtain separate approval before publishing rules to the exact named database or deploying the production Worker.

## Production safety

No production Worker deployment, Firebase Console Rules publication, live mirror migration, Firebase Storage/R2 enablement, paid-plan change, or canonical product/price/history/sequence mutation was performed as part of this review.
