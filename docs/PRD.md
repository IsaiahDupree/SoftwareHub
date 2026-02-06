# PRD: SoftwareHub - Course & Software Distribution Platform

> **Version:** 1.0  
> **Date:** February 2026  
> **Base:** Cloned from Portal28 Academy  

---

## Executive Summary

SoftwareHub is a course and software distribution platform that combines educational content with downloadable software packages and hosted cloud platforms. Users can purchase courses, download licensed local agents (macOS Safari automation tools), and access hosted cloud versions of the same tools.

---

## Problem Statement

Creators building Safari-based automation tools need a platform to:
1. **Distribute software** with proper licensing and device activation
2. **Provide courses** teaching users how to use the tools
3. **Offer both local and cloud versions** of automation agents
4. **Track activity and status** to prove tools are working
5. **Manage licenses** with device limits and activation

---

## Product Types

### A) Courses
Educational content with modules, lessons, downloads, and documentation.
- Video lessons (Mux)
- Text content
- Downloadable resources
- Progress tracking
- Certificates

### B) Local Agents (Downloadable Software)
macOS applications that run Safari automation scripts locally.
- **Requires:** macOS + Safari
- **Delivery:** Signed DMG/PKG download
- **Activation:** License key + device registration
- **Examples:** DM Automation Agent, Comment Bot Agent, Story Viewer Agent

### C) Cloud Platforms (Hosted Apps)
Web-accessible versions running on remote infrastructure.
- **Requires:** Browser only (any device)
- **Delivery:** Web app link
- **Activation:** Subscription/entitlement
- **Examples:** DM Automation Cloud, Commenter Cloud

---

## Site Map (Information Architecture)

### User Portal (Left Nav)
```
├── Dashboard (overview, recent activity, quick actions)
├── My Products (purchased courses, software, cloud apps)
├── Downloads (available software packages for download)
├── Courses (enrolled courses, progress)
├── Activity Feed (status updates, releases, announcements)
├── Licenses & Devices (manage activations)
├── Support / Docs (help center, documentation)
└── Account Settings
```

### Admin Portal
```
├── Dashboard (metrics, revenue, active users)
├── Packages (create/edit software packages)
├── Releases (upload binaries, release notes, channels)
├── Courses (course editor, inherited from Portal28)
├── Status Checks (heartbeat monitoring, CI status)
├── Users (entitlements, licenses, support)
├── Analytics (downloads, activations, usage)
└── Settings (integrations, webhooks)
```

---

## Core User Flows

### Flow 1: Purchase → Access
1. User lands on product page (course or software)
2. User purchases via Stripe checkout
3. Account created (Supabase Auth)
4. Entitlement granted automatically
5. "My Products" shows access to:
   - Course content (if course)
   - Download button (if local agent)
   - "Open Web App" button (if cloud platform)

### Flow 2: Download → Activate → Run (Local Agent)
1. User downloads latest signed installer from Downloads page
2. User installs app on macOS
3. On first launch: app prompts for license key or login
4. App calls License API → validates and gets activation token
5. App registers device (stores in Keychain)
6. App runs with full functionality
7. Periodic re-check (with offline grace period)

### Flow 3: Access Cloud Platform
1. User clicks "Open Web App" from My Products
2. Redirected to hosted platform with SSO token
3. Platform validates entitlement via API
4. User accesses full cloud functionality

### Flow 4: Status & Activity Feed
1. User visits Activity page
2. Sees real-time status of all packages (operational/degraded/down)
3. Sees recent releases and changelogs
4. Gets notified of new versions available
5. Can see their own usage/activity logs

---

## Database Schema

### New Tables (additions to Portal28 base)

```sql
-- =============================================
-- SOFTWARE PACKAGES
-- =============================================

CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Type
  type TEXT NOT NULL CHECK (type IN ('LOCAL_AGENT', 'CLOUD_APP')),
  requires_macos BOOLEAN DEFAULT false,
  
  -- Delivery
  download_url TEXT,
  web_app_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'down', 'maintenance')),
  status_message TEXT,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Release info
  current_version TEXT,
  release_channel TEXT DEFAULT 'stable',
  min_os_version TEXT,
  
  -- Pricing
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  price_cents INT,
  
  -- Metadata
  icon_url TEXT,
  screenshots JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '{}',
  
  -- Relations
  related_course_id UUID REFERENCES courses(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PACKAGE RELEASES
-- =============================================

CREATE TABLE package_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  
  version TEXT NOT NULL,
  channel TEXT DEFAULT 'stable' CHECK (channel IN ('stable', 'beta', 'alpha')),
  
  -- Files
  download_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  checksum_sha256 TEXT,
  signature TEXT,
  
  -- Notes
  release_notes TEXT,
  breaking_changes TEXT[],
  
  -- Status
  is_current BOOLEAN DEFAULT false,
  downloads_count INT DEFAULT 0,
  
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(package_id, version)
);

-- =============================================
-- LICENSE KEYS
-- =============================================

CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  
  license_key TEXT UNIQUE NOT NULL,
  
  -- Limits
  max_devices INT DEFAULT 2,
  active_devices INT DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'expired')),
  
  -- Dates
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, package_id)
);

-- =============================================
-- DEVICE ACTIVATIONS
-- =============================================

CREATE TABLE device_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  
  -- Device info
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  os_version TEXT,
  app_version TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Tokens
  activation_token TEXT UNIQUE NOT NULL,
  last_validated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Dates
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(license_id, device_id)
);

-- =============================================
-- PACKAGE ENTITLEMENTS
-- =============================================

CREATE TABLE package_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  
  -- Source
  source TEXT NOT NULL CHECK (source IN ('purchase', 'subscription', 'gift', 'admin', 'bundle')),
  source_id TEXT,
  
  -- Access
  has_access BOOLEAN DEFAULT true,
  access_level TEXT DEFAULT 'full',
  
  -- Dates
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, package_id)
);

-- =============================================
-- ACTIVITY FEED
-- =============================================

CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type
  type TEXT NOT NULL CHECK (type IN (
    'release', 'status_change', 'announcement', 
    'maintenance', 'download', 'activation'
  )),
  
  -- Target
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Visibility
  is_public BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STATUS CHECKS
-- =============================================

CREATE TABLE status_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  
  -- Check result
  status TEXT NOT NULL,
  response_time_ms INT,
  error_message TEXT,
  
  -- Source
  check_type TEXT DEFAULT 'heartbeat',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOWNLOAD LOGS
-- =============================================

CREATE TABLE download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  release_id UUID REFERENCES package_releases(id) ON DELETE SET NULL,
  
  -- Request info
  ip_address INET,
  user_agent TEXT,
  
  -- Download info
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  bytes_downloaded BIGINT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Packages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | List all packages |
| GET | `/api/packages/:slug` | Get package details |
| GET | `/api/packages/:slug/releases` | Get release history |
| GET | `/api/packages/:slug/download` | Get download URL (auth required) |

### Licenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/licenses` | Get user's licenses |
| POST | `/api/licenses/activate` | Activate license on device |
| POST | `/api/licenses/validate` | Validate activation token |
| POST | `/api/licenses/deactivate` | Deactivate a device |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity` | Get activity feed |
| GET | `/api/status` | Get all package statuses |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/packages` | Create package |
| PUT | `/api/admin/packages/:id` | Update package |
| POST | `/api/admin/releases` | Create release |
| POST | `/api/admin/status-check` | Trigger status check |

---

## License Activation Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Local App   │───▶│   API Call   │───▶│   Database   │
│              │    │   /activate  │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │
       │ 1. Send:          │ 2. Validate:      │ 3. Store:
       │ - license_key     │ - Key exists      │ - device_id
       │ - device_id       │ - Not expired     │ - activation
       │ - device_name     │ - Under limit     │   token
       │ - os_version      │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────┐
│ Response: { success, activation_token, expires_at }  │
└──────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│ Store token  │
│ in Keychain  │
│ Run app      │
└──────────────┘
```

### Validation (Periodic)
- App calls `/api/licenses/validate` with activation_token
- Returns: valid/invalid + remaining time
- Offline grace period: 7 days
- On failure: prompt user to re-authenticate

---

## Pricing Model

### Tiers
1. **Individual Packages** - One-time purchase per package
2. **Bundles** - Multiple packages at discount
3. **Subscriptions** - Access to all packages + cloud platforms
4. **Courses** - Separate or bundled with software

### Example Pricing
| Product | Type | Price |
|---------|------|-------|
| DM Automation Agent | Local | $49 one-time |
| DM Automation Cloud | Cloud | $29/month |
| Safari Automation Course | Course | $99 |
| Complete Bundle | All | $199 |

---

## Security

### License Key Format
```
XXXX-XXXX-XXXX-XXXX (16 chars, base32)
```

### Activation Token
- JWT with 30-day expiry
- Contains: license_id, device_id, package_id
- Signed with server secret

### Device Fingerprinting
- Hardware UUID
- OS version
- App version
- Stored securely in macOS Keychain

### Rate Limiting
- Activation: 10/hour per license
- Validation: 100/hour per device
- Download: 5/hour per user

---

## Integration Points

### Existing (from Portal28)
- Stripe (payments, subscriptions)
- Supabase (auth, database)
- Mux (video hosting)
- Resend (email)

### New
- Cloudflare R2 (binary storage)
- GitHub Releases API (optional)
- UptimeRobot / Better Uptime (status monitoring)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Download completion rate | >95% |
| Activation success rate | >99% |
| License validation uptime | 99.9% |
| Avg downloads per user | 1.5+ |
| Cloud app MAU | Growing MoM |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database migrations for new tables
- [ ] Package CRUD (admin)
- [ ] Download/release management
- [ ] Basic entitlement system

### Phase 2: Licensing (Week 3-4)
- [ ] License key generation
- [ ] Device activation API
- [ ] Validation endpoints
- [ ] Device management UI

### Phase 3: User Experience (Week 5-6)
- [ ] My Products page
- [ ] Downloads page
- [ ] Activity feed
- [ ] Status dashboard

### Phase 4: Cloud Integration (Week 7-8)
- [ ] SSO for cloud apps
- [ ] Cloud entitlement sync
- [ ] Usage tracking
- [ ] Cross-platform linking

### Phase 5: Polish (Week 9-10)
- [ ] Admin analytics
- [ ] Automated status checks
- [ ] Email notifications
- [ ] Documentation

---

## Notes

- Base platform (courses, auth, payments) inherited from Portal28
- Focus on software distribution as the differentiator
- Local agents use Safari automation scripts already built
- Cloud versions can be linked to separate deployed platforms

---

*Last Updated: February 2026*
