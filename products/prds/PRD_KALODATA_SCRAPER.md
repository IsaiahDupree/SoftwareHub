# PRD: KaloData Scraper

**Product Name**: KaloData Scraper  
**Version**: 1.0  
**Status**: Not Started  
**Priority**: LOW  
**Estimated Development**: 2-3 weeks

---

## 1. Executive Summary

### Problem Statement
TikTok Shop sellers and affiliate marketers need competitive intelligence to find winning products and top-performing affiliates. Existing solutions like KaloData charge $99-299/mo for full access, putting this data out of reach for small sellers.

### Solution
A lightweight scraper that extracts TikTok Shop creator and product data, enabling users to:
- Find winning products before they saturate
- Identify top affiliates to partner with
- Track competitor performance
- Build targeted outreach lists

### Target Users
- TikTok Shop sellers ($5K-100K/mo revenue)
- Affiliate marketers
- Agency researchers
- Product sourcers/dropshippers

---

## 2. Product Requirements

### 2.1 Core Features

#### Data Extraction
| Feature | Priority | Description |
|---------|----------|-------------|
| Shop scraping | P0 | Extract shop profile, products, metrics |
| Creator scraping | P0 | Extract creator stats, commission rates |
| Product data | P0 | Price, sales volume, reviews, trends |
| Revenue estimates | P1 | Calculate estimated revenue from metrics |
| Historical tracking | P2 | Track changes over time |

#### User Interface
| Feature | Priority | Description |
|---------|----------|-------------|
| CLI interface | P0 | Command-line for power users |
| Web dashboard | P1 | Visual interface for data exploration |
| Export options | P0 | CSV, JSON, API access |
| Saved searches | P1 | Save and rerun queries |
| Alerts | P2 | Notify on metric changes |

### 2.2 Technical Requirements

#### Stack
```
Frontend: Next.js + TailwindCSS
Backend: Node.js + TypeScript
Database: Supabase (PostgreSQL)
Scraping: Playwright + Chrome profiles
Queue: Redis (for job management)
```

#### Data Model
```typescript
interface Shop {
  id: string;
  name: string;
  url: string;
  category: string;
  productCount: number;
  followerCount: number;
  totalSales: number;
  averageRating: number;
  createdAt: Date;
  lastScraped: Date;
}

interface Product {
  id: string;
  shopId: string;
  name: string;
  price: number;
  originalPrice?: number;
  salesCount: number;
  reviewCount: number;
  rating: number;
  commission: number;
  category: string;
  imageUrl: string;
  trendScore: number;
}

interface Creator {
  id: string;
  username: string;
  followerCount: number;
  videoCount: number;
  avgViews: number;
  engagementRate: number;
  categories: string[];
  contactInfo?: string;
  shopAffiliations: string[];
  estimatedEarnings: number;
}

interface ScrapeJob {
  id: string;
  type: 'shop' | 'product' | 'creator';
  targetUrl: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
```

### 2.3 Anti-Detection Requirements

| Requirement | Implementation |
|-------------|----------------|
| Rate limiting | Max 100 requests/hour per profile |
| Profile rotation | Support 5+ Chrome profiles |
| Human-like delays | Random 2-10 second delays |
| Session persistence | Maintain logged-in sessions |
| Fingerprint randomization | Rotate user agents, viewport |

---

## 3. User Stories

### As a TikTok Shop Seller
1. I want to find products with high sales and low competition
2. I want to see which affiliates are driving sales for competitors
3. I want to track my competitors' pricing changes
4. I want to discover trending products early

### As an Affiliate Marketer
1. I want to find products with good commission rates
2. I want to see which products are converting well
3. I want to build a list of shops to pitch
4. I want to analyze top performer strategies

### As an Agency
1. I want to research potential clients' competitors
2. I want to build reports on market trends
3. I want to identify partnership opportunities
4. I want API access for custom integrations

---

## 4. Course Structure

### Module 1: Introduction (30 min)
- What is KaloData and why it matters
- Legal considerations and ethical use
- Setting up your environment

### Module 2: Basic Scraping (45 min)
- Installing and configuring the scraper
- Running your first shop scrape
- Understanding the data output

### Module 3: Finding Winning Products (60 min)
- Metrics that matter (sales velocity, margin, competition)
- Building product discovery queries
- Analyzing trend signals

### Module 4: Creator Research (45 min)
- Identifying top affiliates
- Analyzing creator performance
- Building outreach lists

### Module 5: Competitive Analysis (45 min)
- Tracking competitor shops
- Price monitoring strategies
- Market gap identification

### Module 6: Advanced Workflows (60 min)
- Batch processing
- Automated reporting
- API integration
- Connecting to CRM

### Module 7: Scaling Your Research (30 min)
- Multi-account setup
- Scheduling scrapes
- Data management best practices

---

## 5. Pricing Strategy

### Tier Structure

| Tier | Price | Limits | Features |
|------|-------|--------|----------|
| **Starter** | $29/mo | 100 shops, 500 products | CLI + CSV export |
| **Pro** | $79/mo | 1,000 shops, 5,000 products | Dashboard + API |
| **Agency** | $199/mo | Unlimited | Multi-user + white-label |

### One-time Option
- Lifetime deal: $299 (Pro tier, limited quantity)

---

## 6. Development Roadmap

### Week 1: Foundation
- [ ] Set up project structure
- [ ] Implement Playwright automation
- [ ] Build shop scraping logic
- [ ] Create basic CLI

### Week 2: Core Features
- [ ] Product data extraction
- [ ] Creator data extraction
- [ ] Database schema and storage
- [ ] Export functionality

### Week 3: Polish & Package
- [ ] Web dashboard (basic)
- [ ] Documentation
- [ ] Course recording
- [ ] License system integration

---

## 7. Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Beta users | 50 | Week 4 |
| Paid conversions | 20% | Week 6 |
| MRR | $2,000 | Month 2 |
| Course completions | 80% | Ongoing |

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| TikTok blocks scraping | High | Profile rotation, rate limiting |
| KaloData changes structure | Medium | Selector versioning, quick updates |
| Legal challenges | Medium | Clear ToS, educational positioning |
| Low demand | Low | Validate with lead forms first |

---

## 9. Competitive Analysis

| Competitor | Price | Pros | Cons |
|------------|-------|------|------|
| **KaloData** | $99-299/mo | Official data, reliable | Expensive, limited exports |
| **FastMoss** | $99+/mo | Good UI | Expensive, no API |
| **Manual research** | Free | No cost | Time-intensive |
| **Ours** | $29-199/mo | Affordable, exportable, course included | DIY setup |

---

## 10. Appendix: Technical Specifications

### Playwright Configuration
```typescript
const browserConfig = {
  headless: false, // Required for anti-detection
  channel: 'chrome',
  args: [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
  ],
};

const contextConfig = {
  viewport: { width: 1920, height: 1080 },
  userAgent: rotateUserAgent(),
  locale: 'en-US',
  timezoneId: 'America/New_York',
};
```

### Rate Limiting Strategy
```typescript
const rateLimiter = {
  requestsPerHour: 100,
  delayBetweenRequests: { min: 2000, max: 10000 },
  cooldownOnError: 300000, // 5 minutes
  maxRetries: 3,
};
```

---

*Last Updated: February 5, 2026*
