-- Migration: Auto Comment Course Content (AC-006, AC-011)
-- Creates full course structure for Auto Comment product

INSERT INTO public.courses (id, title, slug, description, status, stripe_price_id)
VALUES (
  'cccc0003-0000-0000-0000-000000000001',
  'Auto Comment Mastery: Scale Social Media Engagement',
  'auto-comment-course',
  'Master the Auto Comment tool to automate engagement across Instagram, TikTok, Twitter, and Threads. This 2-hour course covers setup, template creation, platform-specific strategies, analytics, and scaling to 100+ comments per hour.',
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
SET course_id = 'cccc0003-0000-0000-0000-000000000001'
WHERE slug = 'auto-comment'
  AND EXISTS (SELECT 1 FROM public.packages WHERE slug = 'auto-comment');

-- ============================================================
-- MODULE 1: Getting Started
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0031-0000-0000-0000-000000000001', 'cccc0003-0000-0000-0000-000000000001', 'Getting Started with Auto Comment', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0311-0000-0000-0000-000000000001',
  'mmmm0031-0000-0000-0000-000000000001',
  'Welcome & Platform Overview',
  10,
  '<p>Welcome to Auto Comment Mastery! This tool automates genuine, context-aware comments across your social media platforms to dramatically increase your reach and engagement.</p>
<h3>Supported Platforms</h3>
<ul>
  <li><strong>Instagram:</strong> Comment on posts, reels, and carousels</li>
  <li><strong>TikTok:</strong> Comment on videos in your niche</li>
  <li><strong>Twitter/X:</strong> Reply to tweets and threads</li>
  <li><strong>Threads:</strong> Engage with Instagram Threads posts</li>
</ul>
<h3>How It Works</h3>
<ol>
  <li>You define target accounts, hashtags, or keywords</li>
  <li>Auto Comment finds relevant content to engage with</li>
  <li>It posts comments from your pre-built template library</li>
  <li>Analytics track which comments drive follows and clicks</li>
</ol>
<p>Used correctly, this tool can generate 500+ new followers per month through organic engagement.</p>'
),
(
  'llll0311-0000-0000-0000-000000000002',
  'mmmm0031-0000-0000-0000-000000000001',
  'Installation and Account Setup',
  20,
  '<p>Setting up Auto Comment takes about 10 minutes. Follow these steps carefully to avoid account restrictions.</p>
<h3>Installation</h3>
<ol>
  <li>Download Auto Comment from your SoftwareHub dashboard</li>
  <li>Run the installer (macOS, Windows, or Linux)</li>
  <li>Enter your license key on first launch</li>
</ol>
<h3>Connecting Your Social Accounts</h3>
<ol>
  <li>Go to Settings → Accounts</li>
  <li>Click "Add Account" for each platform</li>
  <li>Log in via the embedded browser (your credentials are stored locally)</li>
  <li>Complete any 2FA challenges</li>
  <li>Test the connection with "Verify Login"</li>
</ol>
<h3>Safety Settings (IMPORTANT)</h3>
<p>Configure these settings before starting to protect your accounts:</p>
<ul>
  <li><strong>Daily Comment Limit:</strong> Start with 20-30/day, increase gradually</li>
  <li><strong>Delay Between Comments:</strong> 3-8 minutes (random) to appear human</li>
  <li><strong>Active Hours:</strong> Set to your timezone morning/evening hours</li>
  <li><strong>Rest Days:</strong> Take 1-2 days off per week</li>
</ul>'
),
(
  'llll0311-0000-0000-0000-000000000003',
  'mmmm0031-0000-0000-0000-000000000001',
  'Understanding Comment Templates',
  30,
  '<p>High-quality templates are the foundation of effective auto-commenting. This lesson covers how to write templates that convert.</p>
<h3>Template Variables</h3>
<p>Use variables to make comments feel personal:</p>
<ul>
  <li><code>{creator_name}</code> — The account owner name</li>
  <li><code>{platform}</code> — The platform name</li>
  <li><code>{post_topic}</code> — AI-detected topic (when AI tone adjustment is enabled)</li>
  <li><code>{random:option1,option2,option3}</code> — Randomly pick one option</li>
</ul>
<h3>Template Examples</h3>
<pre><code>This is gold, {creator_name}! Saving this one 🔥

{random:Love,Obsessed with,So inspired by} this content!

The part about {post_topic} is exactly what I needed today 💯

Following for more content like this!</code></pre>
<h3>Template Best Practices</h3>
<ul>
  <li>Mix short (1 sentence) and medium (2-3 sentences) templates</li>
  <li>Avoid generic phrases like "Great post!" alone</li>
  <li>Include relevant emojis (2-3 max) for higher engagement</li>
  <li>Add 1-2 conversation-starting templates per category</li>
  <li>Never include your own profile link in comments</li>
</ul>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 2: Template Library & Categories
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0031-0000-0000-0000-000000000002', 'cccc0003-0000-0000-0000-000000000001', 'Template Library & AI Tone Adjustment', 20)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0312-0000-0000-0000-000000000001',
  'mmmm0031-0000-0000-0000-000000000002',
  'Building Your Template Library',
  10,
  '<p>A well-organized template library is crucial for authentic-feeling automation at scale.</p>
<h3>Template Categories</h3>
<p>Organize templates by category for the right tone per context:</p>
<ul>
  <li><strong>Motivational:</strong> For inspirational and fitness content</li>
  <li><strong>Business:</strong> For entrepreneurship and marketing content</li>
  <li><strong>Educational:</strong> For tutorial and how-to content</li>
  <li><strong>Entertainment:</strong> For funny and lifestyle content</li>
  <li><strong>Niche-Specific:</strong> Custom categories for your industry</li>
</ul>
<h3>Recommended Library Size</h3>
<ul>
  <li>Minimum: 25 templates across 3+ categories</li>
  <li>Optimal: 75-100 templates across 5-7 categories</li>
  <li>Pro users: 200+ templates with full category coverage</li>
</ul>
<h3>Importing the Starter Pack</h3>
<p>Auto Comment includes a 50-template starter pack:</p>
<ol>
  <li>Go to Templates → Import</li>
  <li>Select "Starter Pack" from the dropdown</li>
  <li>Choose which categories to import</li>
  <li>Click Import — templates are added to your library</li>
  <li>Review and customize imported templates for your niche</li>
</ol>'
),
(
  'llll0312-0000-0000-0000-000000000002',
  'mmmm0031-0000-0000-0000-000000000002',
  'AI Tone Adjustment Per Platform',
  20,
  '<p>The AI Tone Adjustment feature (Pro/Agency) analyzes post content and selects or adapts your template to match the tone of each post.</p>
<h3>How AI Tone Works</h3>
<ol>
  <li>Before posting a comment, AI scans the post content</li>
  <li>It classifies the tone: Serious / Casual / Humorous / Inspirational</li>
  <li>It selects the best matching template from your library</li>
  <li>Optionally, it adapts the template wording to reference specific post details</li>
</ol>
<h3>Platform Tone Profiles</h3>
<ul>
  <li><strong>Instagram:</strong> Casual, emoji-heavy, visually reactive ("This aesthetic 😍")</li>
  <li><strong>TikTok:</strong> Playful, Gen-Z slang optional, short and punchy</li>
  <li><strong>Twitter/X:</strong> Conversational, can be more formal or political</li>
  <li><strong>Threads:</strong> Conversational, similar to Twitter but more community-focused</li>
</ul>
<h3>Configuring AI Tone</h3>
<ol>
  <li>Go to Settings → AI Features → Tone Adjustment</li>
  <li>Enable for desired platforms</li>
  <li>Set tone matching strength (Subtle / Moderate / Strong)</li>
  <li>Preview AI adjustments before running live</li>
</ol>'
),
(
  'llll0312-0000-0000-0000-000000000003',
  'mmmm0031-0000-0000-0000-000000000002',
  'Comment Analytics & Engagement Tracking',
  30,
  '<p>Analytics help you understand which comments drive real results and optimize your strategy.</p>
<h3>Key Metrics</h3>
<ul>
  <li><strong>Reply Rate:</strong> % of your comments that received a reply</li>
  <li><strong>Follow Rate:</strong> % of commented profiles that followed you back</li>
  <li><strong>Click Rate:</strong> % that visited your profile after your comment</li>
  <li><strong>Engagement Score:</strong> Combined metric of all interactions</li>
</ul>
<h3>Template Performance Analysis</h3>
<p>The analytics dashboard shows performance per template:</p>
<ul>
  <li>Sort templates by reply rate, follow rate, or engagement score</li>
  <li>Identify low performers to pause or edit</li>
  <li>A/B test two templates on the same target audience</li>
  <li>Track improvement over time as you refine templates</li>
</ul>
<h3>Platform Comparison</h3>
<p>Compare performance across platforms to allocate effort:</p>
<ul>
  <li>Which platform gives best follow-back rate for your niche?</li>
  <li>What time of day gets the most replies?</li>
  <li>Which template category drives the most profile visits?</li>
</ul>
<p>Export analytics as CSV for deeper analysis in Google Sheets or Excel.</p>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 3: Scaling & Load Testing
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0031-0000-0000-0000-000000000003', 'cccc0003-0000-0000-0000-000000000001', 'Scaling to 100+ Comments Per Hour', 30)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0313-0000-0000-0000-000000000001',
  'mmmm0031-0000-0000-0000-000000000003',
  'Safe Scaling Strategy',
  10,
  '<p>Scaling comment volume requires a careful warm-up period to avoid account restrictions.</p>
<h3>The 30-Day Warm-Up Plan</h3>
<ul>
  <li><strong>Days 1-7:</strong> 10-20 comments/day, manual review of each one</li>
  <li><strong>Days 8-14:</strong> 30-50 comments/day, spot-check 20%</li>
  <li><strong>Days 15-21:</strong> 60-80 comments/day, review analytics daily</li>
  <li><strong>Days 22-30:</strong> 100+ comments/day, full automation with monitoring</li>
</ul>
<h3>Warning Signs to Watch For</h3>
<ul>
  <li>Comments not appearing (shadow ban)</li>
  <li>Account login challenges or CAPTCHA</li>
  <li>Sudden drop in reply rates (low quality detection)</li>
  <li>Platform warning emails</li>
</ul>
<h3>If You Hit a Restriction</h3>
<ol>
  <li>Stop all automated activity immediately</li>
  <li>Log in manually and post/comment organically for 3-5 days</li>
  <li>Reduce daily limits by 50% when resuming</li>
  <li>Add more template variety to your library</li>
</ol>'
),
(
  'llll0313-0000-0000-0000-000000000002',
  'mmmm0031-0000-0000-0000-000000000003',
  'Multi-Account Management (Pro)',
  20,
  '<p>Pro and Agency users can manage multiple accounts simultaneously for agency-level operations.</p>
<h3>Adding Multiple Accounts</h3>
<ol>
  <li>Go to Settings → Accounts</li>
  <li>Click "Add Account" for each additional account</li>
  <li>Each account has its own settings, templates, and analytics</li>
  <li>Accounts can share template libraries or have separate ones</li>
</ol>
<h3>Agency Dashboard</h3>
<p>Manage all client accounts from a single view:</p>
<ul>
  <li>See all accounts, their daily activity, and status at a glance</li>
  <li>Pause/resume individual accounts or all at once</li>
  <li>Generate per-client reports for monthly reporting</li>
  <li>Set different comment limits per account</li>
</ul>
<h3>Billing for Agency Use</h3>
<p>Agency tier allows up to unlimited accounts. Contact support for volume pricing if managing 20+ accounts.</p>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- Verify
DO $$
DECLARE
  v_module_count INT;
  v_lesson_count INT;
BEGIN
  SELECT COUNT(*) INTO v_module_count FROM public.modules WHERE course_id = 'cccc0003-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_lesson_count FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id
    WHERE m.course_id = 'cccc0003-0000-0000-0000-000000000001';
  RAISE NOTICE 'Auto Comment Course: % modules, % lessons', v_module_count, v_lesson_count;
END $$;
