# Firestore privacy hardening migration plan

Status: design checkpoint only. This document does not change production Firestore rules or data.

## Goal
Prevent unauthenticated visitors from reading private product drafts, unlisted products, internal price history, inquiry records, sequence ledgers, admin settings, and admin records directly from Firestore. Publicly displayed catalog fields remain public by design.

## Confirmed current behavior
- The app connects to the named database configured in `firebase-applet-config.json`: `ai-studio-senaluxe-db843e7b-ccb6-43a4-9c9e-55c8dd6ab699`.
- Public listeners currently subscribe to `games`, `products`, `stoneRates`, and `settings/general`.
- The rules currently allow public reads of `games`, `products`, `stoneRates`, `productVideos` and its chunks, `settings`, and `test`.
- Product visibility and stone-rate visibility are filtered in the browser after the full collection has already been downloaded. Client-side filtering is not a security boundary.
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
1. Implement allowlisted public mirror builders and admin-only migration tooling. Do not change existing rules yet.
2. Update public website listeners to use only `publicGames`, `publicProducts`, `publicStoneRates`, and `publicSettings`.
3. Update admin dashboard listeners to read canonical collections only after admin authorization.
4. Update every create/edit/publish/unpublish/delete operation to maintain the mirror. Use batches/transactions where possible; handle Firestore batch limits and avoid silent local-only success.
5. Run a one-time admin migration that copies only eligible records. It must be idempotent and must not modify canonical records, prices, price histories, product numbers, or sequence ledgers.
6. Test anonymous reads and writes, admin reads/writes, and the public site against the exact named database.
7. Only after the public site and admin dashboard pass those tests, publish restrictive rules to the exact named database. Never publish to `(default)` by mistake.
8. Verify direct unauthenticated reads of canonical collections are denied, while public mirrors remain readable and the site continues to work.

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
