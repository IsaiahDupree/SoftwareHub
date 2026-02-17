-- Migration: KaloData Scraper Product & Course (KD-001 to KD-012)
-- Creates the KaloData Scraper product listing and course content

-- ============================================================
-- KALODATA SCRAPER PRODUCT
-- ============================================================

-- Update the existing KaloData Scraper package if it exists, or insert
INSERT INTO public.packages (
  id,
  name,
  slug,
  tagline,
  description,
  type,
  requires_macos,
  min_os_version,
  current_version,
  stripe_product_id,
  stripe_price_id,
  price_cents,
  features,
  requirements,
  is_published,
  is_featured,
  sort_order,
  published_at
)
VALUES (
  'aaaa0006-0000-0000-0000-000000000001',
  'KaloData Scraper',
  'kalodata-scraper',
  'Extract TikTok Shop product data at scale — trending products, GMV, and competitor analysis in one click.',
  'KaloData Scraper gives TikTok Shop sellers and affiliates an unfair advantage. Extract product performance metrics, trending videos, top creators, and historical GMV data directly from KaloData.com. Find winning products before your competitors, track market trends, and export clean data for analysis.',
  'LOCAL_AGENT',
  false,
  NULL,
  '1.0.0',
  'prod_kalodata',
  'price_kalodata_starter',
  4900,
  '[
    {
      "tier": "starter",
      "price": 49,
      "billing": "monthly",
      "limits": {
        "products_per_day": 500,
        "exports_per_month": 10,
        "historical_days": 30,
        "scheduled_reports": 0
      },
      "features": [
        "Product performance metrics",
        "Trending product discovery",
        "CSV export",
        "30-day historical data",
        "Top 500 products/day"
      ]
    },
    {
      "tier": "pro",
      "price": 99,
      "billing": "monthly",
      "limits": {
        "products_per_day": 5000,
        "exports_per_month": 100,
        "historical_days": 180,
        "scheduled_reports": 5
      },
      "features": [
        "Everything in Starter",
        "5,000 products/day",
        "180-day historical data",
        "Supabase sync integration",
        "5 scheduled reports",
        "Data visualization dashboard",
        "Creator analytics"
      ]
    },
    {
      "tier": "agency",
      "price": 249,
      "billing": "monthly",
      "limits": {
        "products_per_day": -1,
        "exports_per_month": -1,
        "historical_days": 365,
        "scheduled_reports": -1
      },
      "features": [
        "Everything in Pro",
        "Unlimited products/day",
        "1-year historical data",
        "Unlimited scheduled reports",
        "API access",
        "Multi-client reporting",
        "Priority support"
      ]
    }
  ]'::jsonb,
  '{
    "min_macos": null,
    "min_windows": "10",
    "min_linux": "Ubuntu 20.04",
    "min_ram_gb": 4,
    "min_storage_gb": 2,
    "requires_internet": true,
    "requires_kalodata_subscription": false
  }'::jsonb,
  true,
  true,
  50,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_published = EXCLUDED.is_published,
  is_featured = EXCLUDED.is_featured,
  updated_at = NOW();

-- ============================================================
-- KALODATA SCRAPER COURSE
-- ============================================================

INSERT INTO public.courses (id, title, slug, description, status, stripe_price_id)
VALUES (
  'cccc0006-0000-0000-0000-000000000001',
  'KaloData Scraper: Find Winning TikTok Products',
  'kalodata-scraper-course',
  'Learn to use KaloData Scraper to find winning TikTok Shop products, track competitor performance, and build data-driven sourcing strategies. This 2-hour course covers data extraction, trend analysis, historical tracking, and building automated product research pipelines.',
  'published',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Link course to package
UPDATE public.packages
SET course_id = 'cccc0006-0000-0000-0000-000000000001'
WHERE slug = 'kalodata-scraper';

-- ============================================================
-- MODULE 1: Introduction & Setup
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0061-0000-0000-0000-000000000001', 'cccc0006-0000-0000-0000-000000000001', 'Introduction to TikTok Product Research', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0611-0000-0000-0000-000000000001',
  'mmmm0061-0000-0000-0000-000000000001',
  'Why KaloData is the Edge You Need',
  10,
  '<p>KaloData.com is the most comprehensive TikTok Shop analytics platform available. KaloData Scraper gives you programmatic access to all that data, allowing you to build research workflows that would take hours manually in minutes.</p>
<h3>What You Can Extract</h3>
<ul>
  <li><strong>Product performance:</strong> GMV, units sold, revenue, price history</li>
  <li><strong>Trending videos:</strong> Videos driving the most sales for any product</li>
  <li><strong>Creator analytics:</strong> Top creators promoting products in your niche</li>
  <li><strong>Category trends:</strong> Which niches are growing or declining</li>
  <li><strong>Competitor tracking:</strong> Monitor specific products or stores</li>
</ul>
<h3>Use Cases</h3>
<ul>
  <li><strong>TikTok Shop Affiliates:</strong> Find the highest-commission products to promote</li>
  <li><strong>Private Label Sellers:</strong> Validate demand before sourcing products</li>
  <li><strong>Content Creators:</strong> Discover products your audience will buy</li>
  <li><strong>E-commerce Agencies:</strong> Build product research systems for clients</li>
</ul>'
),
(
  'llll0611-0000-0000-0000-000000000002',
  'mmmm0061-0000-0000-0000-000000000001',
  'Installing and Configuring KaloData Scraper',
  20,
  '<p>Get KaloData Scraper running on your machine in under 5 minutes.</p>
<h3>Installation</h3>
<ol>
  <li>Download the installer from your SoftwareHub dashboard</li>
  <li>Run the installer (supports Windows 10+, macOS 12+, Ubuntu 20.04+)</li>
  <li>Launch the application and enter your license key</li>
</ol>
<h3>Initial Configuration</h3>
<ol>
  <li>Go to Settings → KaloData Account</li>
  <li>Enter your KaloData.com credentials (free account works for Starter, Pro account for more data)</li>
  <li>Configure the extraction rate (requests per minute) — default 30/min is safe</li>
  <li>Set your default export folder</li>
  <li>Test connection with "Verify Setup"</li>
</ol>
<h3>Proxy Configuration (Optional)</h3>
<p>For high-volume extraction, use a residential proxy:</p>
<ul>
  <li>Go to Settings → Proxy → Add Proxy</li>
  <li>Enter proxy host, port, username, password</li>
  <li>Use "Rotate" mode for best results with large extractions</li>
</ul>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 2: Data Extraction
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0061-0000-0000-0000-000000000002', 'cccc0006-0000-0000-0000-000000000001', 'Extracting Product & Performance Data', 20)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0612-0000-0000-0000-000000000001',
  'mmmm0061-0000-0000-0000-000000000002',
  'Product Performance Metrics Scraping',
  10,
  '<p>Extract detailed performance metrics for any product on KaloData.</p>
<h3>Metrics Available</h3>
<ul>
  <li>Gross Merchandise Value (GMV) — daily, weekly, monthly</li>
  <li>Units sold and revenue</li>
  <li>Average order value</li>
  <li>Number of active creators promoting the product</li>
  <li>Return rate (quality indicator)</li>
  <li>Price history and current price</li>
  <li>Category ranking</li>
</ul>
<h3>Extracting a Product</h3>
<ol>
  <li>Go to Extract → Product Details</li>
  <li>Enter the product URL or TikTok Shop product ID</li>
  <li>Select metrics to extract</li>
  <li>Choose date range (last 7, 30, 90, 180 days)</li>
  <li>Click "Extract" — data ready in seconds</li>
</ol>
<h3>Bulk Product Extraction</h3>
<p>Extract data for multiple products at once:</p>
<ol>
  <li>Go to Extract → Bulk Products</li>
  <li>Upload a CSV with product URLs or IDs</li>
  <li>Configure extraction settings</li>
  <li>Run the job — processes in queue with progress tracking</li>
  <li>Download results as a single CSV when complete</li>
</ol>'
),
(
  'llll0612-0000-0000-0000-000000000002',
  'mmmm0061-0000-0000-0000-000000000002',
  'Trending Product Discovery',
  20,
  '<p>Discover trending products before they peak using KaloData Scraper trend analysis.</p>
<h3>How Trend Detection Works</h3>
<p>KaloData Scraper tracks velocity — how fast a product is growing:</p>
<ul>
  <li><strong>Day-over-day growth rate:</strong> Products growing 20%+ daily</li>
  <li><strong>Creator adoption rate:</strong> How many new creators are starting to promote it</li>
  <li><strong>Search volume correlation:</strong> TikTok search interest matching sales growth</li>
</ul>
<h3>Trending Products Discovery</h3>
<ol>
  <li>Go to Discover → Trending Products</li>
  <li>Filter by: Category, Price range, Commission rate, GMV range</li>
  <li>Sort by: Growth rate, GMV, Creator count, New creators</li>
  <li>Click any product for full details</li>
  <li>Save to your tracked products list</li>
</ol>
<h3>Setting Up Trend Alerts</h3>
<p>Get notified when products in your niche start trending:</p>
<ol>
  <li>Go to Alerts → Trend Alerts → New Alert</li>
  <li>Set criteria: Category + minimum growth rate</li>
  <li>Choose notification: Email, in-app, or webhook</li>
  <li>Receive alerts daily with new trending products</li>
</ol>'
),
(
  'llll0612-0000-0000-0000-000000000003',
  'mmmm0061-0000-0000-0000-000000000002',
  'Historical Data Tracking',
  30,
  '<p>Historical data is essential for validating trends and avoiding products that have already peaked.</p>
<h3>Accessing Historical Data</h3>
<ul>
  <li>Starter: 30 days of history</li>
  <li>Pro: 180 days of history</li>
  <li>Agency: 365 days of history</li>
</ul>
<h3>Historical Analysis Workflow</h3>
<ol>
  <li>Open a product and go to the History tab</li>
  <li>Select date range for analysis</li>
  <li>View the GMV trend chart</li>
  <li>Look for: Is this a growing trend, peaked trend, or seasonal product?</li>
</ol>
<h3>Seasonal Product Detection</h3>
<p>Identify products with predictable seasonal patterns:</p>
<ul>
  <li>Holiday decorations: Peak Oct-Dec</li>
  <li>Summer products: Peak May-Aug</li>
  <li>Back-to-school: Peak Jul-Sep</li>
</ul>
<p>Plan your promotions 2-4 weeks before the seasonal peak for maximum revenue.</p>'
),
(
  'llll0612-0000-0000-0000-000000000004',
  'mmmm0061-0000-0000-0000-000000000002',
  'Export to CSV and JSON',
  40,
  '<p>Export your scraped data for analysis in your preferred tools.</p>
<h3>Export Formats</h3>
<ul>
  <li><strong>CSV:</strong> Best for Excel/Google Sheets analysis</li>
  <li><strong>JSON:</strong> Best for programmatic use and integrations</li>
  <li><strong>XLSX:</strong> Excel with multiple sheets and formatting</li>
</ul>
<h3>Export Options</h3>
<ol>
  <li>Select products in the product list (Ctrl+A for all)</li>
  <li>Click "Export" in the toolbar</li>
  <li>Choose format and fields to include</li>
  <li>Select date range for historical data</li>
  <li>Export — file saved to your configured export folder</li>
</ol>
<h3>Custom Export Templates</h3>
<p>Save your preferred export configuration as a template:</p>
<ul>
  <li>Define which fields to include/exclude</li>
  <li>Set field ordering and naming</li>
  <li>Save as "My Product Research Template"</li>
  <li>Apply to future exports with one click</li>
</ul>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 3: Integrations & Automation
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0061-0000-0000-0000-000000000003', 'cccc0006-0000-0000-0000-000000000001', 'Integrations, Automation & Scheduled Reports', 30)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0613-0000-0000-0000-000000000001',
  'mmmm0061-0000-0000-0000-000000000003',
  'Supabase Storage Integration',
  10,
  '<p>Pro users can sync scraped data directly to their Supabase database for custom dashboards and team sharing.</p>
<h3>Setting Up Supabase Sync</h3>
<ol>
  <li>Go to Settings → Integrations → Supabase</li>
  <li>Enter your Supabase project URL and Service Role key</li>
  <li>Click "Create Tables" — KaloData Scraper creates the required schema</li>
  <li>Enable "Auto-sync" to push data to Supabase after each extraction</li>
</ol>
<h3>Database Schema Created</h3>
<pre><code>kalodata_products (id, tiktok_product_id, name, price, category, gmv_30d, units_30d, creator_count, last_scraped_at)
kalodata_history (id, product_id, date, gmv, units, price, creator_count)
kalodata_creators (id, product_id, creator_username, platform, gmv_attributed, video_count)</code></pre>
<h3>Building a Custom Dashboard</h3>
<p>With data in Supabase, build dashboards in:</p>
<ul>
  <li>Retool or AppSmith (no-code dashboards)</li>
  <li>Metabase or Grafana (BI tools)</li>
  <li>Custom Next.js app using your Supabase data</li>
</ul>'
),
(
  'llll0613-0000-0000-0000-000000000002',
  'mmmm0061-0000-0000-0000-000000000003',
  'Scheduled Scraping with Cron Jobs',
  20,
  '<p>Automate your research by scheduling extractions to run at regular intervals.</p>
<h3>Setting Up a Scheduled Job</h3>
<ol>
  <li>Go to Schedules → Create New Schedule</li>
  <li>Define what to scrape: Trending products in a category, or a specific product list</li>
  <li>Set frequency: Daily, weekly, or custom cron expression</li>
  <li>Set notification: Email when complete with summary report</li>
  <li>Enable the schedule</li>
</ol>
<h3>Schedule Examples</h3>
<ul>
  <li><strong>Daily trending:</strong> Every day at 8am, extract top 100 trending products in your category</li>
  <li><strong>Weekly competitor check:</strong> Every Monday, check GMV of 50 competitor products</li>
  <li><strong>Monthly category audit:</strong> First of month, full category extraction for your niche</li>
</ul>
<h3>Schedule Management</h3>
<ul>
  <li>View last run time and status</li>
  <li>Download reports from schedule history</li>
  <li>Pause/resume schedules</li>
  <li>Get alerts if a schedule fails</li>
</ul>'
),
(
  'llll0613-0000-0000-0000-000000000003',
  'mmmm0061-0000-0000-0000-000000000003',
  'Data Visualization Dashboard',
  30,
  '<p>The built-in visualization dashboard (Pro/Agency) lets you analyze trends visually without exporting to spreadsheets.</p>
<h3>Dashboard Views</h3>
<ul>
  <li><strong>Market Overview:</strong> Top categories by GMV, growth rate, and product count</li>
  <li><strong>Trending Products:</strong> Visual trend lines for products you track</li>
  <li><strong>Creator Map:</strong> Which creators are dominating your niche</li>
  <li><strong>Price Analysis:</strong> Price distribution and sweet spots for your category</li>
</ul>
<h3>Custom Charts</h3>
<p>Build your own charts with the chart builder:</p>
<ol>
  <li>Go to Dashboard → New Chart</li>
  <li>Select data source (products, history, or creators)</li>
  <li>Choose chart type (line, bar, scatter, bubble)</li>
  <li>Set X and Y axes, grouping, and filters</li>
  <li>Save to your personal dashboard</li>
</ol>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- Verify
DO $$
DECLARE v_module_count INT; v_lesson_count INT;
BEGIN
  SELECT COUNT(*) INTO v_module_count FROM public.modules WHERE course_id = 'cccc0006-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_lesson_count FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id WHERE m.course_id = 'cccc0006-0000-0000-0000-000000000001';
  RAISE NOTICE 'KaloData Course: % modules, % lessons', v_module_count, v_lesson_count;
END $$;
