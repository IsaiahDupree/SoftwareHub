# SoftwareHub API Documentation

> Base URL: `https://yourdomain.com` (production) or `http://localhost:2828` (development)

---

## Authentication

Most endpoints require a Supabase Auth session cookie. Admin endpoints additionally require `role = 'admin'` in the `users` table.

Public endpoints (no auth required) are marked with **Public**.

---

## License System

### POST /api/licenses/activate

Activate a license key on a device. Returns a JWT activation token valid for 30 days.

**Public** (no session required — called from desktop apps)

**Request:**
```json
{
  "license_key": "ABCD-EFGH-JKLM-NPQR",
  "device_id": "unique-device-identifier",
  "device_name": "MacBook Pro",
  "device_type": "desktop",
  "os_name": "macOS",
  "os_version": "15.0",
  "app_version": "1.2.0",
  "hardware_model": "MacBookPro18,1"
}
```

**Response (200):**
```json
{
  "activation_token": "eyJhbGci...",
  "expires_at": "2026-04-11T00:00:00.000Z",
  "device_id": "unique-device-identifier",
  "license_id": "uuid",
  "package_id": "uuid"
}
```

**Error Codes:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | — | Invalid license key |
| 403 | `LICENSE_INACTIVE` | License is suspended/revoked |
| 403 | `LICENSE_EXPIRED` | License has expired |
| 403 | `DEVICE_LIMIT` | Max devices reached |

**Rate Limit:** 10 requests/hour per license key

---

### POST /api/licenses/validate

Validate an activation token. Called periodically by desktop apps to confirm license is still valid.

**Public**

**Request:**
```json
{
  "activation_token": "eyJhbGci...",
  "device_id": "unique-device-identifier"
}
```

**Response (200):**
```json
{
  "valid": true,
  "license_id": "uuid",
  "package_id": "uuid",
  "license_type": "perpetual",
  "expires_at": "2026-04-11T00:00:00.000Z"
}
```

**Grace Period Response (license expired within last 7 days):**
```json
{
  "valid": true,
  "grace_period": true,
  "expires_at": "2026-03-01T00:00:00.000Z",
  "grace_period_ends": "2026-03-08T00:00:00.000Z",
  "license_id": "uuid",
  "package_id": "uuid"
}
```

**Error Codes:**
| Status | Code | Description |
|--------|------|-------------|
| 401 | `TOKEN_INVALID` | Invalid or expired token |
| 403 | `DEVICE_MISMATCH` | Token device doesn't match |
| 404 | `LICENSE_NOT_FOUND` | License deleted |
| 403 | `LICENSE_REVOKED` | License revoked by admin |
| 403 | `LICENSE_SUSPENDED` | License suspended |
| 403 | `LICENSE_EXPIRED` | Expired beyond grace period |

**Rate Limit:** 100 requests/hour per device

---

### POST /api/licenses/deactivate

Deactivate a device. Frees up a device slot.

**Public**

**Request (option A — token-based):**
```json
{
  "activation_token": "eyJhbGci..."
}
```

**Request (option B — explicit):**
```json
{
  "license_id": "uuid",
  "device_id": "unique-device-identifier"
}
```

**Response (200):**
```json
{
  "deactivated": true,
  "remaining_devices": 1
}
```

---

### GET /api/licenses

List authenticated user's licenses. **Requires auth session.**

**Response (200):**
```json
{
  "licenses": [
    {
      "id": "uuid",
      "package_id": "uuid",
      "license_key": "****-****-****-NPQR",
      "license_type": "perpetual",
      "max_devices": 2,
      "active_devices": 1,
      "status": "active",
      "created_at": "2026-01-15T...",
      "expires_at": null,
      "source": "purchase",
      "packages": {
        "id": "uuid",
        "name": "App Name",
        "slug": "app-name",
        "type": "DESKTOP_APP",
        "icon_url": "https://...",
        "current_version": "1.2.0"
      }
    }
  ]
}
```

---

### POST /api/licenses/{id}/reveal

Reveal the full (unmasked) license key. **Requires auth session.** User must own the license or be admin.

**Response (200):**
```json
{
  "license_key": "ABCD-EFGH-JKLM-NPQR"
}
```

---

## Cloud SSO

### POST /api/cloud-sso/generate

Generate a single-use SSO token for a cloud application. **Requires auth session.**

**Request:**
```json
{
  "package_id": "uuid"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGci...",
  "redirect_url": "https://cloudapp.example.com?sso_token=eyJhbGci..."
}
```

**Errors:** 401 (no auth), 403 (no access), 404 (not found), 400 (not a cloud app)

---

### POST /api/cloud-sso/verify

Verify an SSO token (called by the cloud application server). **Public.**

**Request:**
```json
{
  "token": "eyJhbGci..."
}
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "avatar_url": "https://..."
  },
  "package_id": "uuid",
  "entitlements": ["uuid-1", "uuid-2"]
}
```

**Errors:** 401 `TOKEN_INVALID` | `ALREADY_USED`

---

## Packages

### GET /api/packages

List published packages. **Public.**

**Query params:** `?type=DESKTOP_APP` (optional filter)

**Response (200):**
```json
{
  "packages": [
    {
      "id": "uuid",
      "name": "App Name",
      "slug": "app-name",
      "tagline": "Short description",
      "icon_url": "https://...",
      "price_cents": 4999,
      "type": "DESKTOP_APP",
      "status": "operational"
    }
  ]
}
```

---

### GET /api/packages/{slug}

Get package details. **Public.**

---

### GET /api/packages/{slug}/releases

Get release history. **Public.**

---

### POST /api/packages/{slug}/checkout

Create a Stripe checkout session for a package purchase. **Requires auth session.**

Accepts form POST or JSON.

**Request:**
```json
{
  "promo_code": "SAVE10"
}
```

**Response:** Redirects to Stripe Checkout (form) or returns `{ url: "..." }` (JSON).

---

### GET /api/packages/{slug}/download

Download the latest release binary. **Requires auth session + entitlement.**

Returns a signed download URL (redirect).

---

### POST /api/packages/{slug}/trial

Start a free trial. **Requires auth session.**

**Response (200):**
```json
{
  "trial": {
    "id": "uuid",
    "expires_at": "2026-02-25T...",
    "license_key": "XXXX-XXXX-XXXX-XXXX"
  }
}
```

---

### GET /api/packages/{slug}/trial

Check trial availability. **Requires auth session.**

**Response (200):**
```json
{
  "available": true,
  "trial_days": 14
}
```

---

## Package Bundles

### POST /api/package-bundles/{slug}/checkout

Create Stripe checkout for a bundle. **Requires auth session.**

---

## Package Subscriptions

### GET /api/package-subscriptions/tiers

List published subscription tiers. **Public.**

### POST /api/package-subscriptions/checkout

Create a Stripe subscription checkout. **Requires auth session.**

**Request:**
```json
{
  "tierSlug": "pro-monthly",
  "billingPeriod": "monthly"
}
```

---

## Referrals

### GET /api/referrals

Get user's referral code, stats, and balance. **Requires auth session.**

### POST /api/referrals

Create a referral code. **Requires auth session.**

### POST /api/referrals/track

Validate a referral code. **Public.**

**Request:**
```json
{
  "referral_code": "ABC123"
}
```

---

## Stripe

### POST /api/stripe/webhook

Stripe webhook handler. Validates `stripe-signature` header.

**Events handled:**
- `checkout.session.completed` — grants entitlements, licenses, processes referrals
- `customer.subscription.created` — activates subscription entitlements
- `customer.subscription.updated` — handles upgrades/downgrades
- `customer.subscription.deleted` — revokes subscription entitlements

---

### POST /api/stripe/course-checkout

Create checkout for a course purchase. **Requires auth session.**

### POST /api/stripe/membership-checkout

Create checkout for a membership subscription. **Requires auth session.**

### POST /api/stripe/customer-portal

Redirect to Stripe Customer Portal. **Requires auth session.**

---

## Courses & Progress

### GET /api/progress

Get user's course progress. **Requires auth session.**

### POST /api/progress/lesson

Mark a lesson as complete. **Requires auth session.**

**Request:**
```json
{
  "lesson_id": "uuid",
  "course_id": "uuid"
}
```

### POST /api/video-progress

Save video watch position. **Requires auth session.**

---

## Comments

### GET /api/comments?lesson_id={id}

Get comments for a lesson. **Requires auth session.**

### POST /api/comments

Create a comment. **Requires auth session.**

### DELETE /api/comments/{id}

Delete a comment. **Requires auth session (owner or admin).**

### POST /api/comments/{id}/like

Toggle like. **Requires auth session.**

### POST /api/comments/{id}/replies

Add a reply. **Requires auth session.**

---

## User Profile

### GET /api/profile

Get user profile. **Requires auth session.**

### PATCH /api/profile

Update user profile. **Requires auth session.**

### POST /api/profile/avatar

Get presigned URL for avatar upload. **Requires auth session.**

### DELETE /api/profile/avatar

Remove avatar. **Requires auth session.**

---

## Notifications

### GET /api/notifications

List user notifications. **Requires auth session.**

### POST /api/notifications/{id}/read

Mark a notification as read. **Requires auth session.**

---

## File Storage (R2/S3)

### POST /api/r2/upload-url

Get presigned upload URL. **Requires auth session.**

**Request:**
```json
{
  "lessonId": "uuid",
  "filename": "document.pdf",
  "contentType": "application/pdf",
  "expiresIn": 3600
}
```

### GET /api/r2/download-url?key={key}

Get presigned download URL. **Requires auth session + lesson access.**

---

## Search

### GET /api/search?q={query}

Full-text search across courses and lessons. **Requires auth session.**

---

## Certificates

### GET /api/certificates

List user's certificates. **Requires auth session.**

### GET /api/certificates/{id}/download

Download certificate PDF. **Requires auth session.**

---

## Newsletter

### POST /api/newsletter/subscribe

Subscribe to newsletter. **Public.**

**Request:**
```json
{
  "email": "user@example.com"
}
```

---

## Health

### GET /api/health (also /healthz)

Health check. **Public.**

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T...",
  "version": "abc1234"
}
```

---

## Cron Jobs

All cron endpoints require `Authorization: Bearer {CRON_SECRET}` header.

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `GET /api/cron/automation-scheduler` | Every hour | Process email automations |
| `GET /api/cron/send-certificate-emails` | Daily 9am | Send pending certificate emails |
| `GET /api/cron/license-expiration` | Daily 8am | Notify users of expiring licenses |
| `GET /api/cron/status-check` | Every 15 min | Check package status URLs |

---

## Admin Endpoints

All admin endpoints require auth session with `role = 'admin'`.

### Packages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/packages` | List all packages |
| POST | `/api/admin/packages` | Create package |
| GET | `/api/admin/packages/{id}` | Get package details |
| PATCH | `/api/admin/packages/{id}` | Update package |
| DELETE | `/api/admin/packages/{id}` | Delete package |
| POST | `/api/admin/packages/{id}/generate-lessons` | Auto-generate setup lessons |

### Package Bundles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/package-bundles` | List bundles |
| POST | `/api/admin/package-bundles` | Create bundle |
| PATCH | `/api/admin/package-bundles/{id}` | Update bundle |
| DELETE | `/api/admin/package-bundles/{id}` | Delete bundle |

### Package Subscription Tiers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/package-subscription-tiers` | List tiers |
| POST | `/api/admin/package-subscription-tiers` | Create tier |
| PATCH | `/api/admin/package-subscription-tiers/{id}` | Update tier |
| DELETE | `/api/admin/package-subscription-tiers/{id}` | Delete tier |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/courses` | List courses |
| POST | `/api/admin/courses` | Create course |
| PATCH | `/api/admin/courses/{id}` | Update course |
| DELETE | `/api/admin/courses/{id}` | Delete course |

### Modules & Lessons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/courses/{id}/modules` | Add module |
| PUT | `/api/admin/courses/{id}/modules/reorder` | Reorder modules |
| PATCH | `/api/admin/modules/{id}` | Update module |
| DELETE | `/api/admin/modules/{id}` | Delete module |
| POST | `/api/admin/modules/{id}/lessons` | Add lesson |
| PUT | `/api/admin/modules/{id}/lessons/reorder` | Reorder lessons |
| PATCH | `/api/admin/lessons/{id}` | Update lesson |
| DELETE | `/api/admin/lessons/{id}` | Delete lesson |

### Community
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/community/spaces` | Manage spaces |
| GET/POST | `/api/admin/community/announcements` | Manage announcements |
| PATCH/DELETE | `/api/admin/community/threads/{id}` | Moderate threads |
| GET/POST | `/api/admin/chat-channels` | Manage chat channels |
| GET/POST | `/api/admin/forum-categories` | Manage forum categories |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/email-automations` | Manage automations |
| POST | `/api/admin/email-automations/{id}/activate` | Toggle automation |
| POST | `/api/admin/email-automations/{id}/enroll` | Enroll users |
| GET/POST | `/api/admin/email-programs` | Manage email programs |
| POST | `/api/admin/email-programs/{id}/test` | Send test email |
| POST | `/api/admin/email-programs/{id}/approve` | Approve program |

### Other Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/quizzes` | Manage quizzes |
| GET/POST | `/api/admin/widgets` | Manage widgets |
| GET/POST | `/api/admin/offers/upsert` | Manage offers |
| GET/POST | `/api/admin/placements` | Manage placements |
| POST | `/api/admin/analytics/export` | Export analytics |
| GET/POST | `/api/admin/moderation` | Moderation actions |
| POST | `/api/admin/ai-analyze` | AI content analysis |

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

Standard HTTP status codes are used:
- **400** — Bad request / validation error
- **401** — Not authenticated
- **403** — Not authorized / forbidden
- **404** — Resource not found
- **500** — Internal server error
