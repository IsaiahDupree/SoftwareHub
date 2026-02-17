-- Migration: EverReach CRM Course Content (CRM-004, CRM-008)

INSERT INTO public.courses (id, title, slug, description, status, stripe_price_id)
VALUES (
  'cccc0005-0000-0000-0000-000000000001',
  'EverReach CRM: Build Warm Relationships at Scale',
  'everreach-crm-course',
  'Master EverReach CRM to build and maintain genuine relationships with your network. This 2-hour course covers contact management, warmth scoring, relationship health tracking, follow-up automation, and CRM integration with email and calendar.',
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
SET course_id = 'cccc0005-0000-0000-0000-000000000001'
WHERE slug = 'everreach-crm'
  AND EXISTS (SELECT 1 FROM public.packages WHERE slug = 'everreach-crm');

-- ============================================================
-- MODULE 1: Getting Started with EverReach CRM
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0051-0000-0000-0000-000000000001', 'cccc0005-0000-0000-0000-000000000001', 'Getting Started with EverReach CRM', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0511-0000-0000-0000-000000000001',
  'mmmm0051-0000-0000-0000-000000000001',
  'Welcome to EverReach CRM',
  10,
  '<p>EverReach CRM is built on one simple philosophy: relationships fade without attention. The CRM helps you track how warm your relationships are and reminds you to reconnect before connections go cold.</p>
<h3>Who This CRM Is For</h3>
<ul>
  <li><strong>Entrepreneurs and founders</strong> who need to stay connected with clients, investors, and partners</li>
  <li><strong>Sales professionals</strong> managing lead pipelines without a corporate CRM</li>
  <li><strong>Content creators</strong> managing brand partnerships and collaborators</li>
  <li><strong>Anyone</strong> who wants to maintain meaningful relationships intentionally</li>
</ul>
<h3>The Warmth Score System</h3>
<p>Every contact has a Warmth Score from 0-100:</p>
<ul>
  <li><strong>80-100:</strong> Hot — recently engaged, relationship active</li>
  <li><strong>50-79:</strong> Warm — some recent contact, maintain with occasional touchpoints</li>
  <li><strong>20-49:</strong> Cool — relationship fading, follow up soon</li>
  <li><strong>0-19:</strong> Cold — at risk of lost connection, re-engage now</li>
</ul>
<p>Scores decay over time automatically. A contact you have not reached out to in 2+ weeks loses points, reminding you to reconnect.</p>'
),
(
  'llll0511-0000-0000-0000-000000000002',
  'mmmm0051-0000-0000-0000-000000000001',
  'Setting Up Your Workspace',
  20,
  '<p>EverReach CRM works through your SoftwareHub account with a dedicated workspace for each use case.</p>
<h3>Creating Your Workspace</h3>
<ol>
  <li>Log in to your SoftwareHub account</li>
  <li>Go to My Products → EverReach CRM → Launch App</li>
  <li>You will be redirected to the CRM with your SoftwareHub SSO (no separate login needed)</li>
  <li>On first launch, create your workspace: choose a name (e.g., "My Business CRM")</li>
</ol>
<h3>Workspace Settings</h3>
<ul>
  <li><strong>Warmth Decay Rate:</strong> How fast scores decay when you do not reach out (default: 5 points/week)</li>
  <li><strong>Follow-up Threshold:</strong> Score below which you get a follow-up reminder (default: 40)</li>
  <li><strong>Weekly Digest:</strong> Email summary of contacts needing attention (default: every Monday)</li>
</ul>
<h3>Importing Existing Contacts</h3>
<p>Get started faster by importing your existing contacts:</p>
<ul>
  <li><strong>CSV Import:</strong> Upload a spreadsheet from Gmail, Outlook, or any other system</li>
  <li><strong>vCard Import:</strong> Import .vcf files from your phone contacts</li>
  <li><strong>Manual Entry:</strong> Add contacts one by one for high-value relationships</li>
</ul>'
),
(
  'llll0511-0000-0000-0000-000000000003',
  'mmmm0051-0000-0000-0000-000000000001',
  'Managing Contact Profiles',
  30,
  '<p>Each contact in EverReach CRM has a rich profile that captures everything you need to maintain a genuine relationship.</p>
<h3>Contact Profile Fields</h3>
<ul>
  <li>Basic: Name, email, phone, company, title</li>
  <li>Relationship: Source, warmth score, last contact date, next follow-up</li>
  <li>Tags: Categorize contacts (e.g., "investor", "client", "creator")</li>
  <li>Notes: Free-form notes about the relationship</li>
  <li>Custom Fields: Add any additional fields specific to your workflow</li>
</ul>
<h3>Interaction Log</h3>
<p>Record every meaningful interaction to maintain warmth score accuracy:</p>
<ul>
  <li>Emails sent and received</li>
  <li>Calls and meetings</li>
  <li>Coffee chats and in-person meetings</li>
  <li>Social media interactions (likes, comments, DMs)</li>
  <li>Referrals given or received</li>
</ul>
<p>Each interaction type has a different warmth score impact. A meeting adds 25 points; a quick email adds 5 points.</p>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 2: Relationship Analytics
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0051-0000-0000-0000-000000000002', 'cccc0005-0000-0000-0000-000000000001', 'Relationship Health & Analytics', 20)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0512-0000-0000-0000-000000000001',
  'mmmm0051-0000-0000-0000-000000000002',
  'CRM Analytics Dashboard',
  10,
  '<p>The analytics dashboard gives you a bird''s eye view of your entire relationship network health.</p>
<h3>Dashboard Metrics</h3>
<ul>
  <li><strong>Network Health Score:</strong> Average warmth score across all contacts</li>
  <li><strong>Relationships at Risk:</strong> Contacts below 40 warmth score</li>
  <li><strong>This Week''s Follow-ups:</strong> Contacts due for outreach</li>
  <li><strong>Top Relationships:</strong> Your warmest, most active contacts</li>
  <li><strong>New Connections:</strong> Contacts added in the last 30 days</li>
</ul>
<h3>Warmth Distribution Chart</h3>
<p>Visualize how your network is distributed across warmth tiers:</p>
<ul>
  <li>Are most of your contacts warm or cooling off?</li>
  <li>How many at-risk relationships do you have?</li>
  <li>Track improvement over time as you work the CRM regularly</li>
</ul>
<h3>Interaction Frequency Analysis</h3>
<p>See patterns in your relationship-building behavior:</p>
<ul>
  <li>Which days of the week do you connect with people?</li>
  <li>Which contact types receive the most attention?</li>
  <li>Are there categories of contacts you consistently neglect?</li>
</ul>'
),
(
  'llll0512-0000-0000-0000-000000000002',
  'mmmm0051-0000-0000-0000-000000000002',
  'Follow-up Automation and Reminders',
  20,
  '<p>Never let a relationship go cold again with automated follow-up reminders.</p>
<h3>Automated Reminder System</h3>
<ul>
  <li>EverReach CRM automatically generates follow-up tasks based on warmth scores</li>
  <li>When a contact drops below your threshold, they appear in your Follow-up Queue</li>
  <li>The queue is sorted by urgency: lowest warmth score first</li>
</ul>
<h3>Follow-up Queue</h3>
<p>Work through your follow-up queue efficiently:</p>
<ol>
  <li>Go to Follow-ups → Today''s Queue</li>
  <li>Review each contact: see their profile, last interaction, and warmth score</li>
  <li>Choose an action: Send email, Make a call, Schedule a meeting, Snooze (reschedule)</li>
  <li>Log the interaction — warmth score updates automatically</li>
</ol>
<h3>Snooze and Priority</h3>
<ul>
  <li>Snooze: Delay a follow-up by 1, 7, or 30 days</li>
  <li>Priority: Mark as high priority to always see them at the top of the queue</li>
  <li>Archive: Remove from active CRM (relationship intentionally ended)</li>
</ul>
<h3>Weekly Relationship Ritual</h3>
<p>Best practice: spend 30 minutes every Monday morning on your follow-up queue. With a well-maintained CRM, this keeps your entire network warm.</p>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- Verify
DO $$
DECLARE v_module_count INT; v_lesson_count INT;
BEGIN
  SELECT COUNT(*) INTO v_module_count FROM public.modules WHERE course_id = 'cccc0005-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_lesson_count FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id WHERE m.course_id = 'cccc0005-0000-0000-0000-000000000001';
  RAISE NOTICE 'EverReach CRM Course: % modules, % lessons', v_module_count, v_lesson_count;
END $$;
