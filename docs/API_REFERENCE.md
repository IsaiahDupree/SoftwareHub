# API Reference

## Authentication
All `/app/*` and `/admin/*` routes require authentication via Supabase session.
Admin routes require `admin` or `teacher` role.

## Public Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/og | Dynamic OG image |
| POST | /api/auth/callback | Auth callback |

## Protected Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/notifications | User notifications |
| PUT | /api/notifications/preferences | Update preferences |
| GET | /api/user/data-export | Export user data |
| DELETE | /api/user/data-delete | Delete user data |
| POST | /api/feedback | Submit feedback |
| GET | /api/progress/* | Course progress |

## Admin Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/admin/metrics | Dashboard metrics |
| * | /api/admin/packages/* | Package CRUD |
| * | /api/admin/licenses/* | License management |
| * | /api/admin/offers/* | Offer management |
| * | /api/studio/* | Course management |

## Webhook Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/stripe/webhook | Stripe events |
| POST | /api/webhooks/mux | Mux video events |
| POST | /api/resend/webhook | Email events |

## Checkout Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/stripe/checkout | Generic checkout |
| POST | /api/stripe/course-checkout | Course purchase |
| POST | /api/stripe/membership-checkout | Membership |
| POST | /api/stripe/offer-checkout | Offer/upsell |
