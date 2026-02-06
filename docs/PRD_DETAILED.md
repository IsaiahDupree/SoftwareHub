# PRD: SoftwareHub - Detailed Technical Specification

> **Version:** 2.0 | **Date:** February 5, 2026 | **Base:** Portal28 Academy

---

## 1. Executive Summary

SoftwareHub is a course and software distribution platform combining:
- **Courses** - Video lessons, progress tracking (inherited from Portal28)
- **Local Agents** - Licensed macOS Safari automation apps
- **Cloud Platforms** - Web-accessible hosted versions
- **Licensing** - Device activation, key management
- **Activity Feed** - Real-time status, releases, announcements

### What Portal28 Provides (Inherited)
✅ Next.js 14 App Router | ✅ Supabase Auth | ✅ Stripe Payments | ✅ Course System | ✅ Mux Video | ✅ Admin Dashboard | ✅ 33 migrations | ✅ RLS Policies

### What We're Adding
| Feature | Priority | Complexity |
|---------|----------|------------|
| Software Packages | Critical | High |
| Package Releases | Critical | Medium |
| License Keys | Critical | High |
| Device Activation | Critical | High |
| Activity Feed | High | Medium |
| Status Monitoring | High | Medium |
| Cloud App SSO | High | High |

---

## 2. Product Types

### A. Courses (Inherited)
```
Course → Modules → Lessons (Video/Text) → Progress → Certificates
```

### B. Local Agents (NEW)
```
Package Metadata → Releases (versioned DMGs) → License → Device Activations
```
- Requires macOS + Safari
- Delivery: Signed DMG/PKG download
- Activation: License key + device registration

### C. Cloud Platforms (NEW)
```
Package Metadata → Web App URL → SSO Token → Entitlement Verification
```
- Browser only (any device)
- SSO from SoftwareHub to cloud app

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOFTWAREHUB (Next.js 14)                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend: Dashboard | Downloads | Licenses | Activity      │
│  API: /packages | /licenses | /activity | /status | /admin  │
│  Database: Supabase (PostgreSQL + RLS)                      │
│  Storage: Cloudflare R2 (binaries)                          │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   Local Agent           Cloud App            External
   (macOS App)           (Web App)            Services
   - Activate            - SSO Login          - Stripe
   - Validate            - Verify             - Mux
   - Run Scripts           Entitlement        - Resend
```

---

## 4. Database Schema (New Tables)

See `docs/DATABASE_SCHEMA.sql` for complete SQL.

### Tables Overview:
1. **packages** - Software package metadata
2. **package_releases** - Version history with binaries
3. **licenses** - License keys per user/package
4. **device_activations** - Activated devices per license
5. **package_entitlements** - Access grants
6. **activity_feed** - Public/private activity items
7. **status_checks** - Health check logs
8. **download_logs** - Download tracking

### Key Relationships:
```
users ──┬── licenses ────── device_activations
        │        │
        ├── package_entitlements
        │        │
        └────────┴── packages ─── package_releases
                          │
                     activity_feed
                     status_checks
                     download_logs
```

---

## 5. API Specifications

### Package APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | List published packages |
| GET | `/api/packages/:slug` | Package details |
| GET | `/api/packages/:slug/releases` | Release history |
| GET | `/api/packages/:slug/download` | Get signed download URL |

### License APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/licenses` | User's licenses |
| POST | `/api/licenses/activate` | Activate on device |
| POST | `/api/licenses/validate` | Validate token |
| POST | `/api/licenses/deactivate` | Deactivate device |

### Activity APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity` | Activity feed |
| GET | `/api/status` | All package statuses |

### Admin APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/packages` | Create package |
| PUT | `/api/admin/packages/:id` | Update package |
| POST | `/api/admin/releases` | Create release |
| POST | `/api/admin/releases/:id/upload` | Upload binary |

---

## 6. Licensing System

### License Key Format
```
XXXX-XXXX-XXXX-XXXX
Characters: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no confusing chars)
```

### Activation Token (JWT)
```json
{
  "lid": "license_id",
  "pid": "package_id", 
  "did": "device_id_hash",
  "uid": "user_id",
  "exp": 1237159890
}
```
- 30-day expiry
- Signed with HS256

### Activation Flow
1. App sends license_key + device_info to `/api/licenses/activate`
2. API validates key, checks device limit
3. API creates device_activation, returns JWT
4. App stores JWT in Keychain
5. App periodically calls `/api/licenses/validate`

### Device Limits
| Type | Devices |
|------|---------|
| Trial | 1 |
| Standard | 2 |
| Pro | 5 |
| Enterprise | Unlimited |

---

## 7. Activity Feed System

### Activity Types
| Type | Visibility | Trigger |
|------|------------|---------|
| release | Public | New version published |
| status_change | Public | Package status changes |
| announcement | Public | Admin creates |
| download | Private | User downloads |
| activation | Private | Device activated |

---

## 8. User Interface

### Navigation
- Dashboard - Overview, quick actions
- My Products - Owned courses, software, cloud apps
- Downloads - Available downloads with versions
- Courses - Enrolled courses (inherited)
- Activity - Feed with filters
- Licenses & Devices - Manage activations
- Support / Settings

### Admin
- Packages - CRUD for software packages
- Releases - Upload binaries, release notes
- Licenses - Search, suspend, revoke
- Activity - Create announcements

---

## 9. Security

### Requirements
- RLS on all tables
- License keys hashed
- Device IDs hashed  
- JWT tokens with limited scope
- Signed download URLs (1hr expiry)
- Rate limiting on all endpoints

### Rate Limits
| Endpoint | Limit |
|----------|-------|
| /licenses/activate | 10/hour per license |
| /licenses/validate | 100/hour per device |
| /packages/download | 5/hour per user |

---

## 10. Implementation Phases

### Phase 1: Foundation (1-2 weeks)
- Database migrations (8 tables)
- Package CRUD APIs
- Release management
- Admin UI for packages

### Phase 2: Licensing (1-2 weeks)
- License key generation
- Activation/validation APIs
- Device management
- User licenses page

### Phase 3: User Experience (1-2 weeks)
- Dashboard, My Products, Downloads pages
- Activity feed
- Status dashboard
- Package detail pages

### Phase 4: Cloud Integration (1 week)
- SSO token generation
- Entitlement verification API
- Cloud app webhooks

### Phase 5: Polish (1 week)
- Admin analytics
- Email notifications
- Performance optimization
- Testing

---

*See additional docs: DATABASE_SCHEMA.sql, API_SPECS.md, IMPLEMENTATION_GUIDE.md*
