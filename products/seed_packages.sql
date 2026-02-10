-- SoftwareHub Product Seed Data
-- Apply AFTER packages table migration (sh-001)
-- This seeds the 11 software products from the product inventory

-- Note: UUIDs are generated as deterministic v5-style hashes for reproducibility
-- In production, let the database generate UUIDs

INSERT INTO packages (
  name, slug, type, description, short_description,
  features, requirements, status, price_cents, is_published
) VALUES

-- 1. Watermark Remover (BlankLogo) - 100% Complete
(
  'Watermark Remover (BlankLogo)',
  'watermark-remover',
  'LOCAL_AGENT',
  'AI-powered watermark detection and removal for images and videos. Uses advanced computer vision to automatically detect and cleanly remove watermarks, logos, and overlays from visual content.',
  'Remove watermarks from images and videos with AI',
  '["AI-powered watermark detection", "Image and video support", "Batch processing", "Multiple output formats", "Preview before export", "Drag and drop interface"]',
  '{"os": "macOS 12+", "ram": "8GB minimum", "storage": "5GB", "display": "1280x720 minimum"}',
  'operational',
  4900,
  true
),

-- 2. EverReach CRM - 100% Complete
(
  'EverReach CRM',
  'everreach-crm',
  'CLOUD_APP',
  'Full-featured CRM platform for managing customer relationships, tracking leads, and automating sales workflows. Built for creators and small businesses.',
  'Customer relationship management for creators',
  '["Contact management", "Lead tracking", "Sales pipeline", "Email integration", "Task automation", "Reporting dashboard"]',
  '{"browser": "Chrome, Firefox, Safari (latest)", "internet": "Broadband connection"}',
  'operational',
  2900,
  true
),

-- 3. Auto Comment - 95% Complete
(
  'Auto Comment',
  'auto-comment',
  'CLOUD_APP',
  'Context-aware AI comment generation across Instagram, TikTok, Twitter/X, and Threads. Matches your voice profile for authentic engagement. Includes hashtag targeting, account targeting, and niche discovery.',
  'AI-powered social media commenting across platforms',
  '["Multi-platform (Instagram, TikTok, Twitter, Threads)", "AI contextual comments", "Voice profile matching", "Hashtag and account targeting", "Rate limiting and anti-detection", "Analytics dashboard"]',
  '{"browser": "Chrome or Safari (latest)", "accounts": "Valid social media accounts"}',
  'operational',
  2900,
  true
),

-- 4. Auto DM - 80% Complete
(
  'Auto DM',
  'auto-dm',
  'CLOUD_APP',
  '24/7 AI-powered DM responses in your voice. Automated lead qualification, intent detection, payment link injection, and CRM sync. Works across Instagram, TikTok, and Twitter/X.',
  'AI-powered automated DM responses and lead qualification',
  '["24/7 AI DM responses", "Voice matching", "Lead qualification flows", "Intent detection", "Payment link injection", "CRM sync", "Calendar booking"]',
  '{"browser": "Chrome or Safari (latest)", "accounts": "Valid social media accounts"}',
  'maintenance',
  4900,
  false
),

-- 5. TTS Studio - 85% Complete
(
  'TTS Studio',
  'tts-studio',
  'LOCAL_AGENT',
  'Professional text-to-speech studio with multiple voice models including IndexTTS2, XTTS, Bark, and Tortoise. Clone voices from audio samples, control emotion and style, batch generate, and export to WAV/MP3.',
  'Professional text-to-speech with voice cloning',
  '["Multiple TTS models (IndexTTS2, XTTS, Bark, Tortoise)", "Voice cloning from audio", "Emotion and style controls", "Batch generation", "WAV and MP3 export", "Voice library management"]',
  '{"os": "macOS 12+", "ram": "16GB minimum", "storage": "10GB for models", "gpu": "Recommended for faster processing"}',
  'maintenance',
  2900,
  false
),

-- 6. Sora Video - 60% Complete
(
  'Sora Video',
  'sora-video',
  'LOCAL_AGENT',
  'Video generation and orchestration tool powered by AI. Create, edit, and enhance videos with automated workflows.',
  'AI video generation and orchestration',
  '["AI video generation", "Video editing", "Automated workflows", "Multiple output formats"]',
  '{"os": "macOS 12+", "ram": "16GB minimum", "storage": "20GB", "gpu": "Required"}',
  'maintenance',
  9900,
  false
),

-- 7. MediaPoster - 50% Complete
(
  'MediaPoster',
  'media-poster',
  'CLOUD_APP',
  'Social media content scheduling and posting tool. Plan, schedule, and automatically publish content across multiple platforms.',
  'Social media scheduling and auto-posting',
  '["Multi-platform posting", "Content scheduling", "Media library", "Analytics"]',
  '{"browser": "Modern browser (latest version)"}',
  'maintenance',
  1900,
  false
),

-- 8. WaitlistLab - 50% Complete
(
  'WaitlistLab',
  'waitlist-lab',
  'CLOUD_APP',
  'Launch waitlist management platform. Create beautiful waitlist pages, manage signups, and engage early adopters with referral mechanics.',
  'Waitlist management for product launches',
  '["Customizable waitlist pages", "Referral system", "Email notifications", "Analytics dashboard", "Embeddable widgets"]',
  '{"browser": "Modern browser (latest version)"}',
  'maintenance',
  1900,
  false
),

-- 9. AI Video Platform - 40% Complete
(
  'AI Video Platform',
  'ai-video',
  'CLOUD_APP',
  'End-to-end AI video creation platform. Generate scripts, voiceovers, visuals, and final video output with AI assistance.',
  'End-to-end AI video creation',
  '["Script generation", "AI voiceover", "Visual generation", "Video assembly", "Template library"]',
  '{"browser": "Chrome (latest)", "internet": "High-speed broadband"}',
  'maintenance',
  4900,
  false
),

-- 10. KaloData Scraper - 0% (Not Started)
(
  'KaloData Scraper',
  'kalodata-scraper',
  'CLOUD_APP',
  'Extract TikTok Shop data for competitive intelligence. Scrape shop profiles, creator data, product metrics, revenue estimates, and track historical trends.',
  'TikTok Shop data extraction and competitive intelligence',
  '["Shop profile scraping", "Creator data extraction", "Product metrics (price, sales, reviews)", "Revenue estimation", "Historical tracking", "Web dashboard and CLI"]',
  '{"browser": "Chrome (latest)", "node": "Node.js 18+ for CLI"}',
  'maintenance',
  2900,
  false
),

-- 11. Competitor Research - 0% (Not Started)
(
  'Competitor Research',
  'competitor-research',
  'CLOUD_APP',
  'Automated competitor monitoring across Instagram, TikTok, Twitter, YouTube, and Threads. Track growth, analyze content, monitor engagement, and generate trend reports.',
  'Multi-platform competitor monitoring and analysis',
  '["Account monitoring", "Growth tracking", "Content analysis", "Engagement metrics", "Trend reports", "Alert system", "PDF/CSV export"]',
  '{"browser": "Chrome (latest)"}',
  'maintenance',
  2900,
  false
);

-- Note: Only watermark-remover, everreach-crm, and auto-comment are published (is_published=true)
-- The rest are in development and hidden from the public catalog
