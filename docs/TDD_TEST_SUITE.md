# SoftwareHub - TDD Test Suite Specifications

> **Project:** SoftwareHub v2.0
> **Created:** February 10, 2026
> **Total Test Specifications:** 120 (aligned with feature_list.json)

---

## Test ID Convention

Test IDs follow the format: `TEST-SH-XXX` where XXX corresponds to the feature `sh-XXX`.

Each feature in `feature_list.json` maps to one or more test specifications below.

---

## Phase 1: Database Foundation (sh-001 to sh-010)

### TEST-SH-001: Packages Table Migration
- **Feature:** sh-001 - Create packages table
- **Type:** Migration / Schema
- **Tests:**
  1. Migration applies without errors
  2. Table `packages` exists with columns: id, name, slug, type, description, short_description, icon_url, screenshots, features, requirements, status, status_message, status_check_url, price_cents, stripe_product_id, stripe_price_id, is_published, published_at, created_at, updated_at
  3. RLS enabled on table
  4. RLS policy: anyone can read published packages
  5. RLS policy: only admins can insert/update/delete
  6. Unique index on slug
  7. Index on type, status, is_published

### TEST-SH-002: Package Releases Table Migration
- **Feature:** sh-002 - Create package_releases table
- **Type:** Migration / Schema
- **Tests:**
  1. Migration applies without errors
  2. Table `package_releases` exists with columns: id, package_id, version, version_major, version_minor, version_patch, channel, release_notes, download_url, file_size_bytes, sha256_checksum, is_current, is_yanked, download_count, created_at
  3. FK constraint to packages(id) with CASCADE delete
  4. Unique constraint on (package_id, version)
  5. Index on (package_id, is_current)

### TEST-SH-003: Licenses Table Migration
- **Feature:** sh-003 - Create licenses table
- **Type:** Migration / Schema
- **Tests:**
  1. Migration applies without errors
  2. Table `licenses` exists with columns: id, user_id, package_id, license_key, license_key_hash, type, status, max_devices, active_devices, expires_at, created_at, updated_at
  3. FK to auth.users(id) and packages(id)
  4. Unique constraint on license_key
  5. Unique constraint on license_key_hash
  6. Index on (user_id, package_id)
  7. RLS: users can only see their own licenses

### TEST-SH-004: Device Activations Table Migration
- **Feature:** sh-004 - Create device_activations table
- **Type:** Migration / Schema
- **Tests:**
  1. Migration applies without errors
  2. Table `device_activations` exists with columns: id, license_id, device_id_hash, device_name, device_type, os_version, app_version, activation_token, is_active, activated_at, last_validated_at, deactivated_at
  3. FK to licenses(id) with CASCADE delete
  4. Unique constraint on (license_id, device_id_hash)
  5. RLS: users can see activations for their own licenses

### TEST-SH-005: Package Entitlements Table Migration
- **Feature:** sh-005 - Create package_entitlements table
- **Type:** Migration / Schema
- **Tests:**
  1. Migration applies without errors
  2. Table `package_entitlements` exists with columns: id, user_id, package_id, source, source_id, granted_at, expires_at, is_active
  3. FKs to auth.users and packages
  4. Unique constraint on (user_id, package_id)
  5. RLS: users can only see their own entitlements

### TEST-SH-006: Activity Feed Table Migration
- **Feature:** sh-006
- **Type:** Migration / Schema
- **Tests:**
  1. Table `activity_feed` exists with type enum (release, status_change, announcement, download, activation)
  2. Indexes on (type, created_at) and (package_id, created_at)
  3. RLS: public items visible to all, private items only to owner

### TEST-SH-007: Status Checks Table Migration
- **Feature:** sh-007
- **Type:** Migration / Schema
- **Tests:**
  1. Table `status_checks` with FK to packages
  2. Status enum (operational, degraded, down, maintenance)
  3. Index on checked_at

### TEST-SH-008: Download Logs Table Migration
- **Feature:** sh-008
- **Type:** Migration / Schema
- **Tests:**
  1. Table `download_logs` with FKs to users, packages, releases
  2. Indexes on user_id and package_id
  3. Tracks IP, user_agent, completed status

### TEST-SH-009: Database Helper Functions
- **Feature:** sh-009
- **Type:** Migration / Functions
- **Tests:**
  1. `generate_license_key()` returns XXXX-XXXX-XXXX-XXXX format
  2. `generate_license_key()` uses only valid characters (no 0, O, 1, I, L)
  3. `has_package_access(user_uuid, package_uuid)` returns true when entitlement exists
  4. `has_package_access(user_uuid, package_uuid)` returns false when no entitlement
  5. Functions are SECURITY DEFINER

### TEST-SH-010: Migration Verification
- **Feature:** sh-010
- **Type:** Integration
- **Tests:**
  1. `supabase db reset` completes without errors
  2. All 8 new tables are visible in schema
  3. All RLS policies are active
  4. All indexes exist

---

## Phase 2: Package APIs (sh-011 to sh-020)

### TEST-SH-011: TypeScript Types
- **Feature:** sh-011
- **Tests:**
  1. `Package` type exported with all required fields
  2. `PackageRelease` type exported
  3. `License` type exported
  4. `DeviceActivation` type exported
  5. `PackageEntitlement` type exported
  6. Types compile without errors

### TEST-SH-012: Zod Validation Schemas
- **Feature:** sh-012
- **Tests:**
  1. `CreatePackageSchema` validates required fields (name, slug, type)
  2. `CreatePackageSchema` rejects invalid type values
  3. `UpdatePackageSchema` allows partial updates
  4. `CreateReleaseSchema` validates version format (semver)
  5. Validation error messages are descriptive

### TEST-SH-013: GET /api/packages
- **Feature:** sh-013
- **Type:** API / Integration
- **Tests:**
  1. Returns 200 with array of published packages
  2. Does not include unpublished packages
  3. Supports `?type=LOCAL_AGENT` filter
  4. Supports pagination (`?page=1&limit=10`)
  5. Includes current version for each package

### TEST-SH-014: GET /api/packages/[slug]
- **Feature:** sh-014
- **Type:** API / Integration
- **Tests:**
  1. Returns 200 with full package details for valid slug
  2. Returns 404 for non-existent slug
  3. Returns 404 for unpublished package (non-admin)
  4. Includes user entitlement status when authenticated
  5. Returns features and requirements arrays

### TEST-SH-015: GET /api/packages/[slug]/releases
- **Feature:** sh-015
- **Type:** API / Integration
- **Tests:**
  1. Returns releases ordered by version DESC
  2. Excludes yanked releases
  3. Supports `?channel=stable` filter
  4. Includes release notes

### TEST-SH-016: POST /api/admin/packages
- **Feature:** sh-016
- **Type:** API / Integration
- **Tests:**
  1. Returns 201 with created package
  2. Returns 401 if not authenticated
  3. Returns 403 if not admin
  4. Returns 400 with validation errors for invalid data
  5. Creates Stripe product if pricing included

### TEST-SH-017: PUT /api/admin/packages/[id]
- **Feature:** sh-017
- **Type:** API / Integration
- **Tests:**
  1. Returns 200 with updated package
  2. Returns 401/403 for auth failures
  3. Sets published_at when publishing
  4. Validates update schema

### TEST-SH-018: DELETE /api/admin/packages/[id]
- **Feature:** sh-018
- **Tests:**
  1. Soft-deletes by setting is_published=false
  2. Returns 401/403 for auth failures
  3. Package data preserved

### TEST-SH-019: POST /api/admin/releases
- **Feature:** sh-019
- **Tests:**
  1. Creates release with valid version
  2. Sets is_current on new release
  3. Unsets is_current on previous release
  4. Creates activity_feed entry
  5. Returns 400 for duplicate version

### TEST-SH-020: POST /api/admin/releases/[id]/upload
- **Feature:** sh-020
- **Tests:**
  1. Accepts multipart form data
  2. Uploads to R2/S3 storage
  3. Calculates SHA256 checksum
  4. Updates release with download_url and file_size_bytes
  5. Returns 413 for files exceeding limit

---

## Phase 3: Admin UI (sh-021 to sh-027)

### TEST-SH-021: Admin Packages List Page
- **Feature:** sh-021
- **Type:** E2E
- **Tests:**
  1. Page loads at /admin/packages
  2. Shows all packages (published and unpublished)
  3. Displays type badge, status, version columns
  4. Edit button navigates to edit page
  5. Create button navigates to new page

### TEST-SH-022: Package Form Component
- **Feature:** sh-022
- **Type:** Component
- **Tests:**
  1. Renders all form fields
  2. Type selector shows LOCAL_AGENT and CLOUD_APP options
  3. Features array supports add/remove
  4. Form validates required fields

### TEST-SH-023-027: Admin Create/Edit/Release Pages
- **Features:** sh-023 through sh-027
- **Type:** E2E
- **Tests:**
  1. Create page submits to POST API
  2. Edit page loads existing data
  3. Releases page lists versions
  4. Upload form shows progress
  5. Image upload supports drag and drop

---

## Phase 4: Stripe Integration (sh-028 to sh-030)

### TEST-SH-028: Stripe Product Creation
- **Feature:** sh-028
- **Tests:**
  1. Creates Stripe product with package name
  2. Creates price with price_cents
  3. Links stripe_product_id to package record

### TEST-SH-029: Package Checkout Session
- **Feature:** sh-029
- **Tests:**
  1. Returns checkout URL for valid package
  2. Returns 401 if not authenticated
  3. Returns 400 if already entitled
  4. Includes package_id in metadata

### TEST-SH-030: Webhook Package Purchase Handler
- **Feature:** sh-030
- **Tests:**
  1. Creates package_entitlement on checkout.session.completed
  2. Creates license with generated key
  3. Sends confirmation email
  4. Ignores non-package purchases

---

## Phase 5: Licensing Core (sh-031 to sh-040)

### TEST-SH-031: License Key Generation
- **Feature:** sh-031
- **Type:** Unit
- **Tests:**
  1. Format matches XXXX-XXXX-XXXX-XXXX
  2. Only contains valid characters (A-Z, 2-9 excluding confusing chars)
  3. Each segment is 4 characters
  4. Generated keys are unique (test 1000 keys)
  5. Uses crypto.randomBytes for randomness

### TEST-SH-032: License Key Hashing
- **Feature:** sh-032
- **Type:** Unit
- **Tests:**
  1. Returns SHA256 hex string
  2. Same input produces same hash
  3. Different inputs produce different hashes
  4. Hash length is 64 characters

### TEST-SH-033: JWT Token Generation
- **Feature:** sh-033
- **Type:** Unit
- **Tests:**
  1. Returns valid JWT string
  2. Token contains license_id claim
  3. Token contains package_id claim
  4. Token contains device_id_hash claim
  5. Token expires in 30 days
  6. Token uses HS256 algorithm

### TEST-SH-034: JWT Token Validation
- **Feature:** sh-034
- **Type:** Unit
- **Tests:**
  1. Valid token returns decoded payload
  2. Expired token throws error
  3. Invalid signature throws error
  4. Malformed token throws error
  5. Token with wrong secret throws error

### TEST-SH-035: POST /api/licenses/activate
- **Feature:** sh-035
- **Type:** Integration
- **Tests:**
  1. Returns 200 with activation_token for valid request
  2. Returns 400 for missing license_key
  3. Returns 404 for invalid license key
  4. Returns 403 for suspended/revoked license
  5. Returns 409 for already-activated device
  6. Returns 429 when device limit exceeded
  7. Creates device_activation record
  8. Increments license.active_devices

### TEST-SH-036: POST /api/licenses/validate
- **Feature:** sh-036
- **Type:** Integration
- **Tests:**
  1. Returns 200 { valid: true } for valid token
  2. Returns 200 { valid: false, reason: "expired" } for expired token
  3. Returns 200 { valid: false, reason: "revoked" } for revoked license
  4. Returns 200 { valid: false, reason: "device_mismatch" } for wrong device
  5. Updates last_validated_at on success

### TEST-SH-037: POST /api/licenses/deactivate
- **Feature:** sh-037
- **Tests:**
  1. Marks device as inactive
  2. Decrements active_devices count
  3. Returns remaining device count
  4. Returns 404 for unknown device

### TEST-SH-038: GET /api/licenses
- **Feature:** sh-038
- **Tests:**
  1. Returns user's licenses with package info
  2. Masks license keys (XXXX-XXXX-XXXX-****)
  3. Returns 401 if not authenticated
  4. Includes device count per license

### TEST-SH-039: Rate Limiting
- **Feature:** sh-039
- **Tests:**
  1. Activate endpoint limited to 10/hour
  2. Validate endpoint limited to 100/hour
  3. Returns 429 with retry-after header
  4. Different license keys have independent limits

### TEST-SH-040: License Expiration
- **Feature:** sh-040
- **Tests:**
  1. Expired license returns { valid: false, reason: "expired" }
  2. Grace period of 7 days allows validation
  3. After grace period, returns expired with different code
  4. Non-expiring license always validates

---

## Phase 6-8: License Admin, User UI, Downloads (sh-041 to sh-053)

### TEST-SH-041-044: Admin License Management
- **Type:** Integration + E2E
- **Tests:**
  1. Admin can list all licenses with filters
  2. Admin can suspend a license
  3. Admin can revoke a license
  4. Admin can adjust max_devices
  5. License detail page shows activation history

### TEST-SH-045-048: User License UI
- **Type:** E2E
- **Tests:**
  1. User sees their licenses on /app/licenses
  2. License card shows package name, status, device count
  3. Device list shows active devices
  4. Can deactivate a device
  5. Can reveal full license key with confirmation
  6. Key auto-hides after 30 seconds

### TEST-SH-049-053: Downloads
- **Type:** Integration + E2E
- **Tests:**
  1. GET /api/packages/[slug]/download returns signed URL
  2. Returns 403 without entitlement
  3. Logs download attempt
  4. Downloads page shows available packages
  5. Download card shows version and file size
  6. Beta toggle shows beta channel releases
  7. Changelog page lists all releases

---

## Phase 9: Activity Feed (sh-054 to sh-059)

### TEST-SH-054-059: Activity System
- **Type:** Integration + E2E
- **Tests:**
  1. GET /api/activity returns public + user's private items
  2. Pagination with cursor works
  3. Filter by type works
  4. Activity auto-created on new release
  5. Activity auto-created on status change
  6. Admin can create announcements
  7. Pinned items appear first

---

## Phase 10: Status System (sh-060 to sh-064)

### TEST-SH-060-064: Status Monitoring
- **Type:** Integration + E2E
- **Tests:**
  1. GET /api/status returns all package statuses
  2. Status dashboard shows green/yellow/red indicators
  3. Dashboard shows owned packages status
  4. Admin can trigger manual status check
  5. Cron job checks all packages periodically

---

## Phase 11: User Dashboard (sh-065 to sh-069)

### TEST-SH-065-069: Dashboard & Products
- **Type:** E2E
- **Tests:**
  1. Dashboard shows welcome message and stats
  2. My Products page lists owned items
  3. Filter by type (Courses/Local Agents/Cloud Apps)
  4. Product cards show appropriate action buttons
  5. Package detail page shows full info with purchase CTA
  6. Navigation includes all new pages

---

## Phase 12: Cloud SSO (sh-070 to sh-073)

### TEST-SH-070-073: Cloud SSO
- **Type:** Integration
- **Tests:**
  1. SSO token generated with 5-min expiry
  2. Token contains user_id and entitlements
  3. Generate endpoint checks entitlement
  4. Verify endpoint validates token
  5. Token is one-time use
  6. Open Cloud App button redirects correctly

---

## Phase 13: Email Notifications (sh-074 to sh-077)

### TEST-SH-074-077: Emails
- **Type:** Integration
- **Tests:**
  1. Purchase email includes license key
  2. New release email sent to entitled users
  3. Expiration warning sent 7 days before
  4. Notification preferences respected

---

## Phase 14: Admin Analytics (sh-078 to sh-080)

### TEST-SH-078-080: Analytics
- **Type:** E2E
- **Tests:**
  1. Dashboard shows total downloads, active licenses, revenue
  2. Package detail shows download analytics
  3. License analytics show activation rates

---

## Phase 15: Testing (sh-081 to sh-087)

These are meta-tests that validate the test suite itself:
- sh-081: License key gen unit tests pass
- sh-082: JWT token unit tests pass
- sh-083: Activation integration tests pass
- sh-084: Validation integration tests pass
- sh-085: Package CRUD tests pass
- sh-086: E2E purchase flow passes
- sh-087: E2E activation flow passes

---

## Phase 16-19: Advanced Features, Integration, Polish, Deployment (sh-088 to sh-103)

### TEST-SH-088-092: Advanced Features
- Bundle purchase creates multiple entitlements
- Subscription grants all package access
- Trial mode creates time-limited license
- Promo codes apply discount
- Referral links track conversions

### TEST-SH-093-095: Package-Course Integration
- Packages link to related courses
- Course purchase grants software access
- Setup lessons generated for packages

### TEST-SH-096-099: Polish
- All pages responsive on mobile
- Page load under 2s
- SEO meta tags present
- WCAG 2.1 keyboard navigation

### TEST-SH-100-103: Deployment
- Vercel deployment succeeds
- Supabase production migrations apply
- R2 bucket accessible
- Stripe live mode webhook working

---

## Inherited Features (sh-104 to sh-115) - Already Passing

These features are inherited from Portal28 and marked as `passes: true`:

| Test ID | Feature | Status |
|---------|---------|--------|
| TEST-SH-104 | Course listing page | PASS |
| TEST-SH-105 | Course detail page | PASS |
| TEST-SH-106 | Lesson viewer with Mux video | PASS |
| TEST-SH-107 | Course progress tracking | PASS |
| TEST-SH-108 | Magic link authentication | PASS |
| TEST-SH-109 | Protected routes middleware | PASS |
| TEST-SH-110 | Stripe checkout integration | PASS |
| TEST-SH-111 | Course entitlement system | PASS |
| TEST-SH-112 | Admin course management | PASS |
| TEST-SH-113 | Admin dashboard basics | PASS |
| TEST-SH-114 | Resend email integration | PASS |
| TEST-SH-115 | Mux video hosting | PASS |

---

## Documentation (sh-116 to sh-120)

### TEST-SH-116-120: Documentation
- API documentation covers all endpoints
- Local agent integration guide is complete
- Cloud app integration guide is complete
- User help documentation exists
- Admin documentation exists

---

## Test Infrastructure

### Unit Tests (Jest)
```bash
npm run test                    # Run all unit tests
npm run test -- --verbose       # Verbose output
npm run test:coverage           # Coverage report
```

### E2E Tests (Playwright)
```bash
npm run test:e2e                # Run all E2E tests
npm run test:e2e:ui             # Interactive UI mode
```

### Test File Locations
- Unit/Integration: `__tests__/` (mirrors source structure)
- E2E: `e2e/` (feature-based specs)

### Coverage Targets
- **Overall:** 50% minimum
- **Critical paths (licensing, payments):** 80% minimum
- **API routes:** 70% minimum

---

*Last Updated: February 10, 2026*
