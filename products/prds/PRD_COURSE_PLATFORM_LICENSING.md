# PRD: Course Platform & Software Licensing System

**Product Name**: Creator Tools Academy  
**Version**: 1.0  
**Status**: Planning  
**Priority**: HIGH  
**Purpose**: Unified platform for course delivery and software license management

---

## 1. Executive Summary

### Vision
Create a single platform where customers can:
1. Purchase software products with licenses
2. Access training courses for each product
3. Manage their subscriptions and usage
4. Get support and community access

### Why Build This?
- **Control**: Own the customer relationship and data
- **Bundle flexibility**: Create custom product bundles
- **Upsell path**: Course → Software → Support
- **Recurring revenue**: License renewals + subscriptions

---

## 2. Platform Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CREATOR TOOLS ACADEMY                            │
│                     https://creatortools.academy                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   STOREFRONT    │  │  COURSE PLAYER  │  │  LICENSE PORTAL │     │
│  │                 │  │                 │  │                 │     │
│  │ • Product pages │  │ • Video lessons │  │ • Activation    │     │
│  │ • Checkout      │  │ • Progress      │  │ • Usage stats   │     │
│  │ • Bundles       │  │ • Certificates  │  │ • Downloads     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│           │                   │                   │                 │
│           └───────────────────┼───────────────────┘                 │
│                               │                                     │
│                    ┌──────────▼──────────┐                         │
│                    │   USER DASHBOARD    │                         │
│                    │                     │                         │
│                    │ • My products       │                         │
│                    │ • My courses        │                         │
│                    │ • My licenses       │                         │
│                    │ • Billing           │                         │
│                    └─────────────────────┘                         │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                          BACKEND                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Supabase │  │  Stripe  │  │   Mux    │  │  Resend  │           │
│  │ Database │  │ Payments │  │  Video   │  │  Email   │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology | Reason |
|-----------|------------|--------|
| Frontend | Next.js 14 | Already using, App Router |
| Styling | TailwindCSS + shadcn/ui | Consistent with other projects |
| Database | Supabase | Already integrated |
| Auth | Supabase Auth | SSO across products |
| Payments | Stripe | Subscriptions + one-time |
| Video | Mux or Bunny.net | HLS streaming, DRM |
| Email | Resend | Transactional + marketing |
| License Server | Custom (Supabase Edge Functions) | Validation, activation |

---

## 3. Database Schema

### Core Tables

```sql
-- Products (software or course)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'software', 'course', 'bundle'
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'archived'
  features JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing (multiple prices per product)
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Starter', 'Pro', 'Agency'
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  billing_period TEXT, -- 'monthly', 'yearly', 'lifetime', NULL for one-time
  stripe_price_id TEXT,
  features JSONB DEFAULT '[]', -- tier-specific features
  limits JSONB DEFAULT '{}', -- usage limits
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bundles (product combinations)
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_percent INTEGER DEFAULT 0,
  products UUID[] NOT NULL, -- array of product IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  price_id UUID REFERENCES product_prices(id),
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'refunded'
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Licenses
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  license_key TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'perpetual', 'subscription', 'usage'
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'revoked', 'suspended'
  activations INTEGER DEFAULT 0,
  max_activations INTEGER DEFAULT 3,
  features JSONB DEFAULT '[]',
  usage JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_validated_at TIMESTAMPTZ
);

-- License Activations (devices/instances)
CREATE TABLE license_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  machine_id TEXT NOT NULL, -- hashed hardware ID
  machine_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  modules JSONB DEFAULT '[]', -- ordered list of module IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Modules
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  lessons JSONB DEFAULT '[]', -- ordered list of lesson IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Lessons
CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'video', 'text', 'quiz', 'download'
  content JSONB NOT NULL, -- video_url, text_content, quiz_data, etc.
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Progress
CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES course_lessons(id),
  completed BOOLEAN DEFAULT false,
  progress_percent INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Certificates
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);
```

---

## 4. License System

### License Key Format
```
PRODUCT-XXXX-XXXX-XXXX-XXXX
Example: AUTODM-A1B2-C3D4-E5F6-G7H8
```

### License Types

| Type | Description | Validation |
|------|-------------|------------|
| **Perpetual** | One-time purchase, never expires | Check activation count |
| **Subscription** | Monthly/yearly, expires | Check expiry + Stripe status |
| **Usage** | Pay-per-use, tracked | Check remaining credits |

### Validation Flow

```typescript
// License validation endpoint
// POST /api/v1/license/validate

interface ValidateLicenseRequest {
  licenseKey: string;
  machineId: string;
  productSlug: string;
}

interface ValidateLicenseResponse {
  valid: boolean;
  license?: {
    type: 'perpetual' | 'subscription' | 'usage';
    features: string[];
    expiresAt?: string;
    usage?: {
      current: number;
      limit: number;
    };
  };
  error?: string;
}

// Validation logic
async function validateLicense(req: ValidateLicenseRequest) {
  const license = await getLicenseByKey(req.licenseKey);
  
  if (!license) {
    return { valid: false, error: 'Invalid license key' };
  }
  
  if (license.status !== 'active') {
    return { valid: false, error: `License ${license.status}` };
  }
  
  if (license.type === 'subscription' && license.expires_at < new Date()) {
    return { valid: false, error: 'License expired' };
  }
  
  // Check/create activation
  const activation = await getOrCreateActivation(license.id, req.machineId);
  
  if (!activation && license.activations >= license.max_activations) {
    return { valid: false, error: 'Activation limit reached' };
  }
  
  return {
    valid: true,
    license: {
      type: license.type,
      features: license.features,
      expiresAt: license.expires_at?.toISOString(),
      usage: license.type === 'usage' ? license.usage : undefined,
    }
  };
}
```

### Offline Validation (for desktop apps)
```typescript
// Generate signed license token for offline use
function generateOfflineToken(license: License): string {
  const payload = {
    licenseKey: license.license_key,
    features: license.features,
    expiresAt: license.expires_at,
    offlineValidUntil: addDays(new Date(), 7), // 7 day offline grace
  };
  
  return jwt.sign(payload, process.env.LICENSE_SECRET);
}

// Desktop app validates locally, refreshes online periodically
function validateOffline(token: string): boolean {
  try {
    const payload = jwt.verify(token, publicKey);
    return new Date() < new Date(payload.offlineValidUntil);
  } catch {
    return false;
  }
}
```

---

## 5. Product Catalog

### Software Products

| Product | Slug | Type | Course Included |
|---------|------|------|-----------------|
| Auto Comment | `auto-comment` | SaaS | Yes |
| Auto DM | `auto-dm` | SaaS | Yes |
| Watermark Remover | `watermark-remover` | Perpetual + SaaS | Yes |
| Sora Video Tools | `sora-video` | Usage | Yes |
| TTS Studio | `tts-studio` | Credits | Yes |
| EverReach CRM | `everreach-crm` | SaaS | Yes |
| KaloData Scraper | `kalodata` | SaaS | Yes |
| Competitor Research | `competitor-research` | SaaS | Yes |

### Bundles

```typescript
const bundles = [
  {
    name: 'Social Automation Bundle',
    slug: 'social-bundle',
    products: ['auto-comment', 'auto-dm', 'competitor-research'],
    discount: 30, // 30% off combined price
    price: 209, // vs $299 if bought separately
  },
  {
    name: 'Content Creation Bundle',
    slug: 'content-bundle',
    products: ['sora-video', 'tts-studio', 'watermark-remover'],
    discount: 25,
    price: 149,
  },
  {
    name: 'Complete Creator Suite',
    slug: 'complete-suite',
    products: ['*'], // All products
    discount: 40,
    price: 399,
  },
];
```

---

## 6. Course Delivery

### Video Hosting Options

| Provider | Price | Pros | Cons |
|----------|-------|------|------|
| **Mux** | $0.05/min stored + $0.003/min delivered | Best quality, HLS | Cost at scale |
| **Bunny.net** | $5/TB + $0.01/1K requests | Cheap, good CDN | Less features |
| **Cloudflare Stream** | $5/1K min stored + $1/1K min delivered | Integrated | Limited analytics |

**Recommendation**: Start with Bunny.net for cost, migrate to Mux if needed.

### Progress Tracking

```typescript
// Track video progress
async function updateProgress(
  userId: string,
  lessonId: string,
  progressPercent: number,
  timeSpent: number
) {
  const existing = await getProgress(userId, lessonId);
  
  await upsertProgress({
    user_id: userId,
    lesson_id: lessonId,
    progress_percent: Math.max(existing?.progress_percent || 0, progressPercent),
    time_spent_seconds: (existing?.time_spent_seconds || 0) + timeSpent,
    completed: progressPercent >= 90,
    completed_at: progressPercent >= 90 ? new Date() : null,
  });
  
  // Check if module/course completed
  await checkAndAwardCertificate(userId, lessonId);
}
```

### Certificate Generation

```typescript
// Generate PDF certificate
async function generateCertificate(userId: string, courseId: string) {
  const user = await getUser(userId);
  const course = await getCourse(courseId);
  const certNumber = generateCertNumber();
  
  // Store certificate record
  await createCertificate({
    user_id: userId,
    course_id: courseId,
    certificate_number: certNumber,
  });
  
  // Generate PDF with puppeteer or react-pdf
  const pdfBuffer = await generatePDF({
    studentName: user.name,
    courseName: course.title,
    completionDate: new Date(),
    certificateNumber: certNumber,
  });
  
  // Store in Supabase Storage
  const url = await uploadCertificate(userId, courseId, pdfBuffer);
  
  return { certificateNumber: certNumber, downloadUrl: url };
}
```

---

## 7. Payment Integration

### Stripe Setup

```typescript
// Product creation in Stripe
const stripeProduct = await stripe.products.create({
  name: 'Auto Comment Pro',
  description: 'AI-powered comment automation for all platforms',
  metadata: {
    product_id: 'auto-comment',
    tier: 'pro',
  },
});

// Price creation
const monthlyPrice = await stripe.prices.create({
  product: stripeProduct.id,
  unit_amount: 4900, // $49.00
  currency: 'usd',
  recurring: { interval: 'month' },
});

const yearlyPrice = await stripe.prices.create({
  product: stripeProduct.id,
  unit_amount: 47000, // $470.00 (2 months free)
  currency: 'usd',
  recurring: { interval: 'year' },
});
```

### Webhook Handlers

```typescript
// Stripe webhook handler
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handlePurchaseComplete(event.data.object);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
}

async function handlePurchaseComplete(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const productId = session.metadata.product_id;
  const priceId = session.metadata.price_id;
  
  // Create purchase record
  const purchase = await createPurchase({
    user_id: userId,
    product_id: productId,
    price_id: priceId,
    stripe_payment_id: session.payment_intent,
    stripe_subscription_id: session.subscription,
    amount_cents: session.amount_total,
  });
  
  // Generate license
  const license = await createLicense({
    purchase_id: purchase.id,
    user_id: userId,
    product_id: productId,
    license_key: generateLicenseKey(productId),
    type: session.mode === 'subscription' ? 'subscription' : 'perpetual',
  });
  
  // Send welcome email with license key
  await sendWelcomeEmail(userId, productId, license.license_key);
}
```

---

## 8. User Dashboard

### Features

```
┌─────────────────────────────────────────────────────────────────────┐
│  Creator Tools Academy                      [User] ▼  [Settings]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MY PRODUCTS                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────┐  Auto Comment Pro          [Launch App]         │   │
│  │ │  🤖     │  License: AUTOC-A1B2-C3D4                       │   │
│  │ │         │  Status: Active | Renews: Mar 5, 2026            │   │
│  │ └─────────┘  Usage: 1,847 / 2,000 comments this month       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────┐  Sora Video Tools          [Launch App]         │   │
│  │ │  🎬     │  License: SORAV-E5F6-G7H8                       │   │
│  │ │         │  Status: Active | Credits: 127 remaining         │   │
│  │ └─────────┘  [Buy More Credits]                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  MY COURSES                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Auto Comment Mastery              ████████░░ 80%  [Continue]│   │
│  │ Sora Video Masterclass            ████░░░░░░ 40%  [Continue]│   │
│  │ Social Automation Fundamentals    ██████████ 100% [Certificate]│
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  AVAILABLE UPGRADES                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🚀 Upgrade to Complete Suite and save 40%!                 │   │
│  │  Add TTS Studio, Watermark Remover, and more for $199/mo    │   │
│  │                                            [Upgrade Now]     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Implementation Roadmap

### Phase 1: Core Platform (Week 1-2)
- [ ] Database schema migration
- [ ] User authentication (Supabase Auth)
- [ ] Product catalog pages
- [ ] Stripe checkout integration
- [ ] License key generation

### Phase 2: Course System (Week 3-4)
- [ ] Video hosting setup (Bunny.net)
- [ ] Course player component
- [ ] Progress tracking
- [ ] Certificate generation

### Phase 3: License Portal (Week 5-6)
- [ ] License validation API
- [ ] Activation management
- [ ] Usage tracking
- [ ] User dashboard

### Phase 4: Launch (Week 7-8)
- [ ] First course upload (Watermark Remover)
- [ ] Beta testing
- [ ] Marketing site
- [ ] Launch!

---

## 10. Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Platform launch | Complete | Week 8 |
| First paying customer | 10 | Week 9 |
| MRR | $5,000 | Month 3 |
| Course completion rate | >60% | Ongoing |
| License activation rate | >90% | Ongoing |
| Churn rate | <8%/mo | Month 6+ |

---

*Last Updated: February 5, 2026*
