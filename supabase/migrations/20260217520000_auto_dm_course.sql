-- Migration: Auto DM Course Content (DM-009, DM-012)
-- Creates full course structure for Auto DM product

INSERT INTO public.courses (id, title, slug, description, status, stripe_price_id)
VALUES (
  'cccc0004-0000-0000-0000-000000000001',
  'Auto DM Mastery: Build Automated Lead Generation Funnels',
  'auto-dm-course',
  'Master Auto DM to build powerful lead generation funnels across Instagram and TikTok. This 2.5-hour course covers multi-account management, conversation threading, nurture sequences, advanced lead scoring, and scaling to 50+ DMs per day.',
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
SET course_id = 'cccc0004-0000-0000-0000-000000000001'
WHERE slug = 'auto-dm'
  AND EXISTS (SELECT 1 FROM public.packages WHERE slug = 'auto-dm');

-- ============================================================
-- MODULE 1: Foundation
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0041-0000-0000-0000-000000000001', 'cccc0004-0000-0000-0000-000000000001', 'Auto DM Foundation & Setup', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0411-0000-0000-0000-000000000001',
  'mmmm0041-0000-0000-0000-000000000001',
  'Welcome to Auto DM',
  10,
  '<p>Auto DM is a powerful tool for building automated direct message sequences that generate leads, nurture prospects, and drive sales — without manual effort.</p>
<h3>What You Will Build</h3>
<ul>
  <li>Automated welcome sequences for new followers</li>
  <li>Lead qualification funnels via DM conversation</li>
  <li>Scheduled nurture sequences over days/weeks</li>
  <li>Re-engagement campaigns for cold leads</li>
</ul>
<h3>Supported Platforms</h3>
<ul>
  <li><strong>Instagram:</strong> DM new followers, story viewers, post engagers</li>
  <li><strong>TikTok:</strong> DM followers and video commenters</li>
</ul>
<h3>Results You Can Expect</h3>
<ul>
  <li>20-40% DM open rates (vs 15-25% for email)</li>
  <li>5-15% conversion to booked calls or sales</li>
  <li>Consistent lead flow without daily manual outreach</li>
</ul>'
),
(
  'llll0411-0000-0000-0000-000000000002',
  'mmmm0041-0000-0000-0000-000000000001',
  'Initial Setup & Account Configuration',
  20,
  '<p>Proper setup is essential for safe, effective automation.</p>
<h3>Installation</h3>
<ol>
  <li>Download and install Auto DM from your SoftwareHub dashboard</li>
  <li>Activate with your license key</li>
  <li>Connect your Instagram and/or TikTok accounts</li>
</ol>
<h3>Account Safety Settings</h3>
<p>These settings protect your accounts from restrictions:</p>
<ul>
  <li><strong>Daily DM Limit:</strong> Start at 10-15/day for new accounts, 30-50 for established accounts (6+ months old)</li>
  <li><strong>Delay Between DMs:</strong> 8-20 minutes randomly</li>
  <li><strong>Active Hours:</strong> Business hours in your target timezone</li>
  <li><strong>Weekend Reduction:</strong> Reduce volume by 50% on weekends</li>
</ul>
<h3>Multi-Account Setup (Pro)</h3>
<p>Managing multiple accounts for clients or multiple niches:</p>
<ol>
  <li>Go to Accounts → Add Account for each profile</li>
  <li>Each account has independent settings and sequences</li>
  <li>Accounts can share scripts or have unique ones</li>
  <li>Monitor all accounts from the unified dashboard</li>
</ol>'
),
(
  'llll0411-0000-0000-0000-000000000003',
  'mmmm0041-0000-0000-0000-000000000001',
  'Understanding Multi-Account Session Handling',
  30,
  '<p>When managing multiple accounts, session management prevents conflicts and account flags.</p>
<h3>How Sessions Work</h3>
<p>Auto DM maintains separate browser sessions for each account:</p>
<ul>
  <li>Each account has its own cookies, local storage, and browser fingerprint</li>
  <li>Sessions are rotated and renewed automatically</li>
  <li>Accounts are never active simultaneously from the same IP</li>
</ul>
<h3>IP Rotation</h3>
<p>For Pro users with multiple accounts:</p>
<ul>
  <li>Each account can be assigned a different proxy (residential proxies recommended)</li>
  <li>Go to Settings → Proxies to add proxy configurations</li>
  <li>Auto DM validates proxies before use</li>
  <li>Recommended: 1 unique residential proxy per account</li>
</ul>
<h3>Session Recovery</h3>
<p>Auto DM handles session expiry gracefully:</p>
<ul>
  <li>Detects when sessions expire (login challenges, CAPTCHA)</li>
  <li>Pauses the account and sends you a notification</li>
  <li>You re-authenticate manually once, session resumes</li>
</ul>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 2: Conversation Sequences
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0041-0000-0000-0000-000000000002', 'cccc0004-0000-0000-0000-000000000001', 'Building Conversation Sequences', 20)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0412-0000-0000-0000-000000000001',
  'mmmm0041-0000-0000-0000-000000000002',
  'Designing Your Welcome Sequence',
  10,
  '<p>The welcome sequence is the first thing new followers or engagers see. Make it count.</p>
<h3>The 3-Message Welcome Framework</h3>
<ol>
  <li><strong>Message 1 (Immediate):</strong> Warm welcome + value hook<br>Example: "Hey {first_name}! Thanks for following. I share daily tips on growing a 6-figure brand. What are you working on right now?"</li>
  <li><strong>Message 2 (Day 2, if no reply):</strong> Free resource offer<br>Example: "Wanted to send you this — my free PDF on the 5 posts that got me 10K followers in 30 days. Want me to send it?"</li>
  <li><strong>Message 3 (Day 4, if interested):</strong> Soft pitch<br>Example: "Here is the PDF: [link]. If you want to go deeper, I have a free 15-min strategy call this week. Grab a spot here: [link]"</li>
</ol>
<h3>Conversation Threading</h3>
<p>Auto DM tracks conversations and adjusts follow-up timing:</p>
<ul>
  <li>If someone replies, the sequence pauses and waits for your manual response</li>
  <li>Set up auto-responses for common replies (Yes/No/Maybe)</li>
  <li>Mark leads as "Hot", "Warm", or "Cold" for prioritization</li>
</ul>'
),
(
  'llll0412-0000-0000-0000-000000000002',
  'mmmm0041-0000-0000-0000-000000000002',
  'Scheduled Nurture Sequences',
  20,
  '<p>Nurture sequences build trust over time with contacts who have not converted yet.</p>
<h3>Setting Up a Nurture Sequence</h3>
<ol>
  <li>Go to Sequences → Create New → Nurture Sequence</li>
  <li>Define the trigger: No purchase after 7 days</li>
  <li>Add messages spaced over 2-4 weeks</li>
  <li>Each message provides value, with a soft CTA at the end</li>
</ol>
<h3>Example 4-Week Nurture Sequence</h3>
<ul>
  <li><strong>Week 1:</strong> Share a relevant tip or insight</li>
  <li><strong>Week 2:</strong> Ask a qualifying question</li>
  <li><strong>Week 3:</strong> Share a case study or testimonial</li>
  <li><strong>Week 4:</strong> Limited-time offer or urgency message</li>
</ul>
<h3>Media Handling in DMs</h3>
<p>Enhance your DMs with images and videos:</p>
<ul>
  <li>Attach images (PNG, JPEG, GIF) to any message</li>
  <li>Supported: PDF links, video links (hosted externally)</li>
  <li>Instagram allows video DMs up to 60 seconds</li>
  <li>Use images sparingly — text-only DMs often feel more personal</li>
</ul>'
),
(
  'llll0412-0000-0000-0000-000000000003',
  'mmmm0041-0000-0000-0000-000000000002',
  'Advanced Lead Scoring',
  30,
  '<p>Lead scoring helps you focus manual effort on the highest-potential prospects.</p>
<h3>Lead Score Factors</h3>
<p>Auto DM calculates a lead score (0-100) based on:</p>
<ul>
  <li><strong>Reply behavior:</strong> Replied within 24h = +20 points</li>
  <li><strong>Engagement history:</strong> Liked/commented on your posts = +15 points</li>
  <li><strong>Profile quality:</strong> Complete bio, real photo, active posting = +15 points</li>
  <li><strong>Follower count:</strong> Within your target range = +10 points</li>
  <li><strong>Link clicks:</strong> Clicked a link in your DM = +25 points</li>
  <li><strong>Sequence completion:</strong> Opened all messages = +15 points</li>
</ul>
<h3>Using Lead Scores</h3>
<ul>
  <li><strong>80-100 (Hot):</strong> Priority for manual follow-up, call booking</li>
  <li><strong>50-79 (Warm):</strong> Add to nurture sequence, send valuable content</li>
  <li><strong>0-49 (Cold):</strong> Automated sequence only, low manual effort</li>
</ul>
<h3>Error Recovery</h3>
<p>Auto DM handles errors gracefully:</p>
<ul>
  <li>Failed DMs are automatically retried after 30 minutes</li>
  <li>After 3 failures, the contact is flagged for review</li>
  <li>Rate limit errors cause automatic cooldown and retry</li>
</ul>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 3: Analytics & Optimization
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0041-0000-0000-0000-000000000003', 'cccc0004-0000-0000-0000-000000000001', 'Analytics, Optimization & Scale', 30)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0413-0000-0000-0000-000000000001',
  'mmmm0041-0000-0000-0000-000000000003',
  'DM Response Analytics Dashboard',
  10,
  '<p>Track every aspect of your DM funnel performance with the built-in analytics dashboard.</p>
<h3>Key Dashboard Metrics</h3>
<ul>
  <li><strong>Send Rate:</strong> DMs sent vs your daily limit</li>
  <li><strong>Open Rate:</strong> % of DMs that were opened</li>
  <li><strong>Reply Rate:</strong> % of DMs that received a reply</li>
  <li><strong>Conversion Rate:</strong> % that converted to your goal (link click, call booked)</li>
  <li><strong>Lead Score Distribution:</strong> Breakdown of Hot/Warm/Cold leads</li>
</ul>
<h3>Funnel Analysis</h3>
<p>View your complete DM funnel:</p>
<ul>
  <li>Message 1 → Message 2 drop-off rate</li>
  <li>Where in the sequence do most conversions happen?</li>
  <li>Which trigger source (new follower, story viewer, etc.) converts best?</li>
</ul>
<h3>Weekly Reports</h3>
<p>Auto DM sends you a weekly email summary with:</p>
<ul>
  <li>Total DMs sent and reply rate this week vs last week</li>
  <li>Hot leads requiring your attention</li>
  <li>Sequence performance rankings</li>
  <li>Revenue attributed to Auto DM (if using payment tracking)</li>
</ul>'
),
(
  'llll0413-0000-0000-0000-000000000002',
  'mmmm0041-0000-0000-0000-000000000003',
  'Scaling to 50+ DMs Per Day Safely',
  20,
  '<p>Scaling high-volume DM outreach requires careful account management.</p>
<h3>Volume Testing Protocol</h3>
<ol>
  <li>Week 1: 10-15 DMs/day, monitor account health</li>
  <li>Week 2: 20-25 DMs/day, track reply rates</li>
  <li>Week 3: 35-40 DMs/day, check for restrictions</li>
  <li>Week 4+: 50+ DMs/day on healthy accounts</li>
</ol>
<h3>Account Health Indicators</h3>
<ul>
  <li>Green: No restrictions, all DMs delivering</li>
  <li>Yellow: 10-20% DMs not delivering, reduce volume</li>
  <li>Red: DMs blocked or account restricted, stop immediately</li>
</ul>
<h3>High-Volume Strategy for Agencies</h3>
<p>For 50+ DMs/day across multiple client accounts:</p>
<ul>
  <li>Spread volume across 3-5 accounts (10-15 each) rather than pushing one account hard</li>
  <li>Use residential proxies for each account</li>
  <li>Vary message timing — some morning, some evening</li>
  <li>A/B test scripts across accounts to find winners</li>
</ul>
<p>Congratulations! You now have the knowledge to build a profitable automated DM business. Start small, test carefully, and scale what works.</p>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- Verify
DO $$
DECLARE
  v_module_count INT;
  v_lesson_count INT;
BEGIN
  SELECT COUNT(*) INTO v_module_count FROM public.modules WHERE course_id = 'cccc0004-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_lesson_count FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id
    WHERE m.course_id = 'cccc0004-0000-0000-0000-000000000001';
  RAISE NOTICE 'Auto DM Course: % modules, % lessons', v_module_count, v_lesson_count;
END $$;
