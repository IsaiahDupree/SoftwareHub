-- Migration: Competitor Research Product & Course (CR-001 to CR-012)
-- Creates competitor research tool with social tracking and automated reporting

-- ============================================================
-- COMPETITOR RESEARCH PRODUCT
-- ============================================================

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
  'aaaa0007-0000-0000-0000-000000000001',
  'Competitor Research',
  'competitor-research',
  'Track any competitor across Instagram, TikTok, Twitter, and YouTube — get weekly digests on what is working for them.',
  'Competitor Research is an automated competitive intelligence tool that monitors your competitors across all major social platforms. Track posting patterns, content performance, hashtag strategies, and pricing changes. Get automated weekly digest emails so you always know what your competitors are doing — without spending hours manually checking their profiles.',
  'LOCAL_AGENT',
  false,
  NULL,
  '1.0.0',
  'prod_competitor_research',
  'price_competitor_research_starter',
  3900,
  '[
    {
      "tier": "starter",
      "price": 39,
      "billing": "monthly",
      "limits": {
        "competitors_tracked": 5,
        "platforms": ["instagram", "tiktok"],
        "history_days": 30,
        "reports_per_week": 1,
        "alerts": false
      },
      "features": [
        "Track up to 5 competitors",
        "Instagram and TikTok",
        "Weekly digest email",
        "Content performance analysis",
        "30-day history"
      ]
    },
    {
      "tier": "pro",
      "price": 79,
      "billing": "monthly",
      "limits": {
        "competitors_tracked": 20,
        "platforms": ["instagram", "tiktok", "twitter", "youtube"],
        "history_days": 90,
        "reports_per_week": 7,
        "alerts": true
      },
      "features": [
        "Track up to 20 competitors",
        "All 4 platforms",
        "Daily digest option",
        "Real-time alerts",
        "Hashtag and keyword monitoring",
        "Posting pattern analysis",
        "90-day history"
      ]
    },
    {
      "tier": "agency",
      "price": 199,
      "billing": "monthly",
      "limits": {
        "competitors_tracked": -1,
        "platforms": ["instagram", "tiktok", "twitter", "youtube"],
        "history_days": 365,
        "reports_per_week": -1,
        "alerts": true
      },
      "features": [
        "Unlimited competitors",
        "All platforms",
        "Custom report frequency",
        "Pricing change detection",
        "White-label reports",
        "API access",
        "1-year history"
      ]
    }
  ]'::jsonb,
  '{
    "min_macos": null,
    "min_windows": "10",
    "min_linux": "Ubuntu 20.04",
    "min_ram_gb": 4,
    "min_storage_gb": 1,
    "requires_internet": true
  }'::jsonb,
  true,
  false,
  60,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- ============================================================
-- COMPETITOR RESEARCH COURSE
-- ============================================================

INSERT INTO public.courses (id, title, slug, description, status, stripe_price_id)
VALUES (
  'cccc0007-0000-0000-0000-000000000001',
  'Competitor Research Mastery: Know Your Market Inside Out',
  'competitor-research-course',
  'Learn to systematically track and analyze competitors across social media platforms. This 2-hour course covers setting up tracking, analyzing posting patterns, hashtag strategies, content performance, pricing changes, and building automated competitive intelligence workflows.',
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
SET course_id = 'cccc0007-0000-0000-0000-000000000001'
WHERE slug = 'competitor-research';

-- ============================================================
-- MODULE 1: Foundation & Setup
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0071-0000-0000-0000-000000000001', 'cccc0007-0000-0000-0000-000000000001', 'Setting Up Competitor Tracking', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0711-0000-0000-0000-000000000001',
  'mmmm0071-0000-0000-0000-000000000001',
  'Choosing Which Competitors to Track',
  10,
  '<p>Effective competitor research starts with choosing the right competitors to track. This lesson covers how to build your competitor list strategically.</p>
<h3>Three Types of Competitors</h3>
<ul>
  <li><strong>Direct competitors:</strong> Same product/service, same target audience</li>
  <li><strong>Indirect competitors:</strong> Different product, same audience needs</li>
  <li><strong>Aspirational competitors:</strong> Brands you want to be like (larger, more established)</li>
</ul>
<h3>Building Your Competitor List</h3>
<ol>
  <li>Search your primary keywords on each platform</li>
  <li>Look at who appears in your target hashtags regularly</li>
  <li>Check who your target audience follows (audience overlap analysis)</li>
  <li>Look at who runs ads in your space</li>
</ol>
<h3>Prioritizing Your List</h3>
<p>With a Starter tier limit of 5 competitors, prioritize:</p>
<ol>
  <li>Your #1 direct competitor (same price range, same audience)</li>
  <li>The market leader in your niche (aspirational)</li>
  <li>A fast-growing newcomer (early-stage competitor)</li>
  <li>A brand doing something unique/innovative in your space</li>
  <li>Your most recent lost customer (went to whom?)</li>
</ol>'
),
(
  'llll0711-0000-0000-0000-000000000002',
  'mmmm0071-0000-0000-0000-000000000001',
  'Profile Tracking Across All Platforms',
  20,
  '<p>Set up tracking for competitors across Instagram, TikTok, Twitter/X, and YouTube.</p>
<h3>Adding a Competitor</h3>
<ol>
  <li>Go to Competitors → Add Competitor</li>
  <li>Enter the competitor name (your internal label)</li>
  <li>Add their handles for each platform:
    <ul>
      <li>Instagram: @username</li>
      <li>TikTok: @username</li>
      <li>Twitter/X: @username</li>
      <li>YouTube: channel URL or @handle</li>
    </ul>
  </li>
  <li>Click "Start Tracking" — initial data pull takes 2-5 minutes</li>
</ol>
<h3>What Gets Tracked Automatically</h3>
<ul>
  <li>Every new post/video (with caption, hashtags, engagement)</li>
  <li>Follower count changes (daily)</li>
  <li>Engagement rate trends</li>
  <li>Posting frequency and timing patterns</li>
  <li>Top-performing content (most likes, views, shares)</li>
</ul>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 2: Analysis Features
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0071-0000-0000-0000-000000000002', 'cccc0007-0000-0000-0000-000000000001', 'Content Performance & Pattern Analysis', 20)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0712-0000-0000-0000-000000000001',
  'mmmm0071-0000-0000-0000-000000000002',
  'Content Performance Analysis',
  10,
  '<p>Understand what content is working for your competitors so you can create better content.</p>
<h3>Performance Metrics Tracked</h3>
<ul>
  <li>Views, likes, comments, shares per post</li>
  <li>Engagement rate (relative to their follower count)</li>
  <li>View-to-follower ratio (virality indicator)</li>
  <li>Comment sentiment (positive, neutral, negative)</li>
  <li>Content format: video, image, carousel, reel, live</li>
</ul>
<h3>Finding Their Best Content</h3>
<ol>
  <li>Go to a competitor profile → Content tab</li>
  <li>Sort by: Most viewed, Highest engagement, Most shared</li>
  <li>Filter by: Date range, content type, platform</li>
  <li>Click any post to see full metrics and caption analysis</li>
</ol>
<h3>Content Gap Analysis</h3>
<p>Find topics your competitors are winning on that you have not covered:</p>
<ol>
  <li>Go to Analysis → Content Gaps</li>
  <li>Select your account and 2-3 competitors</li>
  <li>The tool identifies topics with high engagement for them that you have not posted about</li>
</ol>'
),
(
  'llll0712-0000-0000-0000-000000000002',
  'mmmm0071-0000-0000-0000-000000000002',
  'Posting Pattern Detection',
  20,
  '<p>Understanding when and how often competitors post helps you find optimal posting windows.</p>
<h3>Posting Pattern Data</h3>
<ul>
  <li><strong>Frequency:</strong> How many posts per day/week by platform</li>
  <li><strong>Timing:</strong> What hours and days they post most</li>
  <li><strong>Consistency:</strong> Regular schedule vs sporadic posting</li>
  <li><strong>Format distribution:</strong> % videos vs images vs carousels</li>
  <li><strong>Caption length patterns:</strong> Long-form vs short-form</li>
</ul>
<h3>Heatmap View</h3>
<p>The posting heatmap shows activity intensity by hour and day of week:</p>
<ul>
  <li>Darker cells = more posts at that time</li>
  <li>See if competitors are avoiding certain time slots</li>
  <li>Find posting windows with less competition</li>
</ul>
<h3>Correlation Analysis</h3>
<p>Does posting at certain times correlate with higher engagement?</p>
<ul>
  <li>Compare posting time vs average engagement for each competitor</li>
  <li>Their peak engagement window may differ from their peak posting window</li>
  <li>Use this to identify their most effective posting times</li>
</ul>'
),
(
  'llll0712-0000-0000-0000-000000000003',
  'mmmm0071-0000-0000-0000-000000000002',
  'Hashtag and Keyword Monitoring',
  30,
  '<p>Track which hashtags and keywords drive discovery for your competitors.</p>
<h3>Hashtag Analysis</h3>
<ul>
  <li>See all hashtags used by each competitor</li>
  <li>Ranked by frequency and by post performance</li>
  <li>Identify hidden niche hashtags with high engagement</li>
  <li>Compare hashtag strategy across competitors</li>
</ul>
<h3>Keyword Tracking</h3>
<p>Set up keyword alerts for any content mentioning your tracked terms:</p>
<ol>
  <li>Go to Keywords → Add Keyword</li>
  <li>Enter keywords relevant to your niche (product names, pain points, etc.)</li>
  <li>Choose platforms to monitor</li>
  <li>Receive alerts when competitors post content with those keywords</li>
</ol>
<h3>Pricing Change Detection (Agency)</h3>
<p>Monitor competitor pricing across platforms and websites:</p>
<ul>
  <li>Track product prices in their TikTok Shop</li>
  <li>Monitor website pricing (requires URL configuration)</li>
  <li>Get immediate alerts when prices change</li>
  <li>View price history with change log</li>
</ul>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 3: Reports & Alerts
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0071-0000-0000-0000-000000000003', 'cccc0007-0000-0000-0000-000000000001', 'Automated Reports & Alert System', 30)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0713-0000-0000-0000-000000000001',
  'mmmm0071-0000-0000-0000-000000000003',
  'Weekly Competitor Digest Email',
  10,
  '<p>The automated weekly digest saves you hours of manual monitoring by summarizing everything important in one email.</p>
<h3>Digest Email Contents</h3>
<ul>
  <li><strong>Top performer this week:</strong> Which competitor had the best week and why</li>
  <li><strong>Viral content:</strong> Any posts that outperformed normal benchmarks</li>
  <li><strong>New content themes:</strong> Topics they started posting about this week</li>
  <li><strong>Follower changes:</strong> Who gained or lost followers significantly</li>
  <li><strong>Alerts summary:</strong> Any keyword, pricing, or activity alerts triggered</li>
  <li><strong>Opportunities:</strong> Topics generating high engagement that you have not covered</li>
</ul>
<h3>Customizing Your Digest</h3>
<ol>
  <li>Go to Reports → Digest Settings</li>
  <li>Choose delivery day and time</li>
  <li>Select which competitors and metrics to include</li>
  <li>Add custom notes section for each competitor</li>
  <li>Preview the digest before saving settings</li>
</ol>
<h3>White-Label Reports (Agency)</h3>
<p>Generate branded reports to share with clients:</p>
<ul>
  <li>Add your agency logo and brand colors</li>
  <li>Customize which metrics to show</li>
  <li>Export as PDF or send directly to client email</li>
  <li>Schedule automated client reports monthly</li>
</ul>'
),
(
  'llll0713-0000-0000-0000-000000000002',
  'mmmm0071-0000-0000-0000-000000000003',
  'Alert System for Competitor Activity',
  20,
  '<p>Real-time alerts keep you informed of significant competitor actions the moment they happen.</p>
<h3>Alert Types</h3>
<ul>
  <li><strong>Viral content:</strong> A competitor post exceeds 10x their average engagement</li>
  <li><strong>Follower spike:</strong> A competitor gains 1000+ followers in 24 hours</li>
  <li><strong>New product launch:</strong> A new product appears in their TikTok Shop</li>
  <li><strong>Price change:</strong> A competitor changes pricing on any tracked product</li>
  <li><strong>Keyword mention:</strong> A competitor mentions your brand name or key terms</li>
  <li><strong>Posting gap:</strong> A competitor who normally posts daily stops suddenly</li>
</ul>
<h3>Configuring Alerts</h3>
<ol>
  <li>Go to Alerts → Create Alert</li>
  <li>Select competitor(s) to monitor</li>
  <li>Choose alert type and threshold</li>
  <li>Set notification: Email, SMS, or webhook</li>
</ol>
<h3>Responding to Alerts</h3>
<p>When you receive an alert, here is the framework for responding:</p>
<ol>
  <li>Review the alert details in the app</li>
  <li>Assess: Is this a threat, an opportunity, or just informational?</li>
  <li>Threat (price cut, viral campaign): Respond within 24-48 hours</li>
  <li>Opportunity (content gap, they stopped posting): Move fast</li>
</ol>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- Verify
DO $$
DECLARE v_module_count INT; v_lesson_count INT;
BEGIN
  SELECT COUNT(*) INTO v_module_count FROM public.modules WHERE course_id = 'cccc0007-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_lesson_count FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id WHERE m.course_id = 'cccc0007-0000-0000-0000-000000000001';
  RAISE NOTICE 'Competitor Research Course: % modules, % lessons', v_module_count, v_lesson_count;
END $$;
