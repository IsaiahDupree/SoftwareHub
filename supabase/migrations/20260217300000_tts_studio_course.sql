-- =============================================================================
-- TTS Studio Course Content (TTS-007, TTS-012)
-- Seeds the TTS Studio Mastery course with modules and lessons
-- Course covers: voice cloning, script optimization, use cases (3 hours)
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. Insert the TTS Studio Mastery course
-- -----------------------------------------------------------------------
INSERT INTO public.courses (
  id,
  title,
  slug,
  description,
  status,
  stripe_price_id
) VALUES (
  'cccc0001-0000-0000-0000-000000000001',
  'TTS Studio Mastery',
  'tts-studio-mastery',
  'Learn professional text-to-speech production with AI voice cloning. This 3-hour course covers everything from basic TTS generation to advanced voice cloning, SSML scripting, and real-world production workflows for podcasts, audiobooks, and content creation.',
  'published',
  NULL -- Bundled free with TTS Studio license
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Link course to the tts-studio package
-- (package_id linkage handled via entitlements when user purchases the package)

-- -----------------------------------------------------------------------
-- 2. Module 1: Getting Started with TTS Studio
-- -----------------------------------------------------------------------
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES
  ('dddd0001-0000-0000-0000-000000000001', 'cccc0001-0000-0000-0000-000000000001', 'Getting Started with TTS Studio', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
  (
    'eeee0001-0000-0000-0000-000000000001',
    'dddd0001-0000-0000-0000-000000000001',
    'Welcome & Course Overview',
    10,
    '<p>Welcome to TTS Studio Mastery! In this course, you''ll learn to create professional-quality voice content using AI-powered text-to-speech and voice cloning technology.</p><p><strong>What you''ll learn:</strong></p><ul><li>How to use TTS Studio''s built-in voice library</li><li>Voice cloning from a 30-second sample</li><li>SSML scripting for natural-sounding output</li><li>Production workflows for podcasts, audiobooks, and videos</li></ul>'
  ),
  (
    'eeee0002-0000-0000-0000-000000000002',
    'dddd0001-0000-0000-0000-000000000001',
    'Installation & Setup',
    20,
    '<p>Getting TTS Studio installed and configured on your Mac.</p><p><strong>Requirements:</strong></p><ul><li>macOS 12.0 or later</li><li>8GB RAM recommended</li><li>5GB free disk space for voice models</li><li>Apple Silicon preferred for best performance</li></ul><p>After installation, TTS Studio will automatically download the base voice models on first launch (approximately 2-3GB).</p>'
  ),
  (
    'eeee0003-0000-0000-0000-000000000003',
    'dddd0001-0000-0000-0000-000000000001',
    'Your First Voice Generation',
    30,
    '<p>In this lesson, we''ll generate your first piece of audio using one of TTS Studio''s built-in voices.</p><ol><li>Open TTS Studio and enter your license key</li><li>Select a voice from the library (we recommend starting with "Emma - Natural" for English)</li><li>Type or paste your text into the editor</li><li>Click Generate and preview the audio</li><li>Export as MP3</li></ol><p>Tip: Keep your first test script short — one or two sentences is perfect for getting familiar with the interface.</p>'
  ),
  (
    'eeee0004-0000-0000-0000-000000000004',
    'dddd0001-0000-0000-0000-000000000001',
    'Understanding Voice Quality Settings',
    40,
    '<p>TTS Studio offers several quality settings that affect the realism and processing time of your audio output.</p><p><strong>Quality Levels:</strong></p><ul><li><strong>Draft (Fast):</strong> Quick preview, lower quality. Good for long scripts where you''re checking content flow.</li><li><strong>Standard:</strong> Balanced quality and speed. Use for most production work.</li><li><strong>High Quality:</strong> Maximum realism. Use for final exports and professional deliverables.</li></ul><p>Recommendation: Generate in Standard mode, then switch to High Quality for your final export.</p>'
  )
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, content_html = EXCLUDED.content_html;

-- -----------------------------------------------------------------------
-- 3. Module 2: Voice Cloning Tutorial
-- -----------------------------------------------------------------------
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES
  ('dddd0002-0000-0000-0000-000000000002', 'cccc0001-0000-0000-0000-000000000001', 'Voice Cloning', 20)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
  (
    'eeee0005-0000-0000-0000-000000000005',
    'dddd0002-0000-0000-0000-000000000002',
    'How Voice Cloning Works',
    10,
    '<p>Voice cloning uses machine learning to capture the unique characteristics of a voice from a short audio sample — pitch, cadence, accent, tone, and speaking style — and applies them to new text.</p><p><strong>TTS Studio''s cloning process:</strong></p><ol><li>Record or upload a 30–60 second audio sample</li><li>The model analyzes acoustic features (takes 2–5 minutes)</li><li>A voice profile is created and saved locally</li><li>Generate unlimited text with your cloned voice</li></ol><p>Important: You must have the legal right to clone a voice. Cloning your own voice or voices you have explicit permission to use is required.</p>'
  ),
  (
    'eeee0006-0000-0000-0000-000000000006',
    'dddd0002-0000-0000-0000-000000000002',
    'Recording Your Voice Sample',
    20,
    '<p>A high-quality recording sample is the most important factor in getting a great voice clone. Here''s how to record the best possible sample.</p><p><strong>Recording Setup:</strong></p><ul><li>Use a USB condenser microphone (Blue Yeti, AT2020, or similar)</li><li>Record in a quiet room with soft furnishings (reduces echo)</li><li>Maintain 6–8 inches from the microphone</li><li>Speak at your natural pace — do not slow down or over-enunciate</li></ul><p><strong>Sample Script:</strong> Read a neutral passage of 100–150 words. Avoid scripts with extreme emotion or unusual words. The goal is to capture your everyday speaking voice.</p><p>Export your recording as a WAV file (44.1kHz, 16-bit) before importing to TTS Studio.</p>'
  ),
  (
    'eeee0007-0000-0000-0000-000000000007',
    'dddd0002-0000-0000-0000-000000000002',
    'Cloning Your Voice in TTS Studio',
    30,
    '<p>Now that you have your recording, let''s create your voice clone in TTS Studio.</p><ol><li>Open TTS Studio and go to <strong>Voices → Clone Voice</strong></li><li>Click "Import Sample" and select your WAV file</li><li>Enter a name for your voice (e.g., "My Voice - Casual")</li><li>Click <strong>Start Cloning</strong> — this takes 2–5 minutes</li><li>Once complete, preview your clone with a short test sentence</li><li>If satisfied, click <strong>Save to Library</strong></li></ol><p>Your cloned voice is now available in your voice library for all future projects. The voice profile is stored locally and never uploaded to the cloud.</p>'
  ),
  (
    'eeee0008-0000-0000-0000-000000000008',
    'dddd0002-0000-0000-0000-000000000002',
    'Improving Clone Quality',
    40,
    '<p>If your voice clone doesn''t sound quite right, here are techniques to improve quality.</p><p><strong>Common Issues and Fixes:</strong></p><ul><li><strong>Robotic or unnatural sound:</strong> Your sample may have too much background noise. Re-record in a quieter environment.</li><li><strong>Wrong pitch:</strong> The sample was too short or included too many pauses. Record a full 60 seconds of continuous speech.</li><li><strong>Accent not captured:</strong> Include more varied sentence structures in your sample. Avoid reading lists — use conversational sentences.</li></ul><p><strong>Advanced Tip:</strong> Create multiple clones from different sample recordings (formal speech, casual conversation) and use the best one for each project type.</p>'
  ),
  (
    'eeee0009-0000-0000-0000-000000000009',
    'dddd0002-0000-0000-0000-000000000002',
    'Voice Cloning Ethics and Legal Considerations',
    50,
    '<p>Voice cloning is a powerful technology that comes with important ethical and legal responsibilities.</p><p><strong>Legal Requirements:</strong></p><ul><li>Only clone voices you own or have explicit written permission to clone</li><li>Never create audio intended to deceive or impersonate</li><li>Disclose AI-generated content when required by platform rules or law</li><li>Different jurisdictions have different regulations — consult legal counsel if in doubt</li></ul><p><strong>Ethical Guidelines:</strong></p><ul><li>Label AI-generated audio as such in published content</li><li>Do not use voice clones to spread misinformation</li><li>Respect the likeness rights of public figures</li></ul>'
  )
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, content_html = EXCLUDED.content_html;

-- -----------------------------------------------------------------------
-- 4. Module 3: Script Optimization
-- -----------------------------------------------------------------------
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES
  ('dddd0003-0000-0000-0000-000000000003', 'cccc0001-0000-0000-0000-000000000001', 'Script Optimization for TTS', 30)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
  (
    'eeee0010-0000-0000-0000-000000000010',
    'dddd0003-0000-0000-0000-000000000003',
    'Writing Scripts That Sound Natural',
    10,
    '<p>TTS engines perform best when the input text is formatted for speech, not reading. Here are key principles for writing TTS-optimized scripts.</p><p><strong>Do:</strong></p><ul><li>Write in a conversational tone</li><li>Use contractions (don''t, can''t, you''ll) for natural flow</li><li>Spell out numbers when they should be spoken ("twenty-five" not "25")</li><li>Add commas to control pacing</li><li>Break long sentences into shorter ones</li></ul><p><strong>Avoid:</strong></p><ul><li>Abbreviations (write "Doctor" not "Dr.")</li><li>Symbols that may be spoken literally (use "percent" not "%")</li><li>Long lists without natural breaks</li><li>Technical jargon without phonetic spellings</li></ul>'
  ),
  (
    'eeee0011-0000-0000-0000-000000000011',
    'dddd0003-0000-0000-0000-000000000003',
    'Using SSML for Advanced Control',
    20,
    '<p>SSML (Speech Synthesis Markup Language) gives you fine-grained control over how TTS Studio reads your text.</p><p><strong>Essential SSML Tags:</strong></p><pre><code>&lt;break time="500ms"/&gt;  -- Add a 500ms pause\n&lt;emphasis level="strong"&gt;very important&lt;/emphasis&gt;\n&lt;prosody rate="slow"&gt;Take your time here.&lt;/prosody&gt;\n&lt;say-as interpret-as="characters"&gt;API&lt;/say-as&gt;</code></pre><p>Enable SSML mode in TTS Studio by toggling the "SSML" switch in the editor toolbar. In SSML mode, special characters in your text are escaped automatically.</p><p>SSML is available on Pro and Studio tiers.</p>'
  ),
  (
    'eeee0012-0000-0000-0000-000000000012',
    'dddd0003-0000-0000-0000-000000000003',
    'Batch Processing Long Scripts',
    30,
    '<p>For long-form content like audiobooks or podcast series, TTS Studio''s batch processing lets you generate multiple files efficiently.</p><ol><li>Organize your content into separate text files (one per chapter or episode)</li><li>Open TTS Studio and go to <strong>File → Batch Process</strong></li><li>Add your text files to the queue</li><li>Select your voice and quality settings (these apply to all files)</li><li>Set your output folder</li><li>Click <strong>Generate All</strong></li></ol><p>Batch processing runs in the background — you can continue other work while TTS Studio generates your files. You''ll receive a macOS notification when complete.</p><p>Pro tip: Name your files with numeric prefixes (01_chapter1.txt, 02_chapter2.txt) to keep output files organized.</p>'
  )
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, content_html = EXCLUDED.content_html;

-- -----------------------------------------------------------------------
-- 5. Module 4: Real-World Use Cases
-- -----------------------------------------------------------------------
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES
  ('dddd0004-0000-0000-0000-000000000004', 'cccc0001-0000-0000-0000-000000000001', 'Real-World Use Cases', 40)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
  (
    'eeee0013-0000-0000-0000-000000000013',
    'dddd0004-0000-0000-0000-000000000004',
    'Podcast Production with TTS',
    10,
    '<p>TTS Studio is ideal for producing podcast episodes at scale — especially for solo creators, newsletter-to-audio conversion, and educational content.</p><p><strong>Podcast Workflow:</strong></p><ol><li>Write your episode script in your editor of choice</li><li>Optimize for speech (contractions, short sentences)</li><li>Generate audio in TTS Studio (use your cloned voice or a premium built-in voice)</li><li>Import the MP3 into your DAW (GarageBand, Logic Pro, Audacity)</li><li>Add intro/outro music, normalize levels to -14 LUFS</li><li>Export and upload to your podcast host</li></ol><p><strong>Recommended Settings:</strong> Export at 192 kbps MP3, 44.1kHz stereo for podcast distribution.</p>'
  ),
  (
    'eeee0014-0000-0000-0000-000000000014',
    'dddd0004-0000-0000-0000-000000000004',
    'Audiobook Creation',
    20,
    '<p>Converting written books or guides into professional audiobooks is one of the highest-value use cases for TTS Studio.</p><p><strong>Audiobook Production Tips:</strong></p><ul><li>Use one consistent voice throughout (your cloned voice works beautifully here)</li><li>Generate chapter by chapter using batch processing</li><li>For dialogue, consider switching voices between characters (Pro tier allows multiple voice clones)</li><li>Export as AAC at 128 kbps for Audible/ACX compliance</li><li>Include a 5-second silence at the start of each chapter file</li></ul><p><strong>ACX Requirements:</strong> Audible requires -23 LUFS RMS, -3 dB peak, and less than -60 dB noise floor. TTS Studio''s output meets these requirements with the "Audiobook" export preset.</p>'
  ),
  (
    'eeee0015-0000-0000-0000-000000000015',
    'dddd0004-0000-0000-0000-000000000004',
    'Video Voiceovers and YouTube Content',
    30,
    '<p>Using TTS Studio for YouTube video voiceovers lets you produce content faster and more consistently than recording yourself.</p><p><strong>Workflow for YouTube:</strong></p><ol><li>Write your video script</li><li>Generate audio in TTS Studio (use WAV export for best quality in video editing)</li><li>Import audio into your video editor (Final Cut Pro, DaVinci Resolve, Premiere)</li><li>Sync your screen recording or B-roll to the voiceover</li><li>Add captions (most editors auto-generate from audio)</li></ol><p><strong>Content Disclosure:</strong> YouTube''s policy requires disclosure of AI-generated content. Use the description or pinned comment to note that voiceover was AI-generated. Some creators also add a brief visual overlay.</p>'
  ),
  (
    'eeee0016-0000-0000-0000-000000000016',
    'dddd0004-0000-0000-0000-000000000004',
    'Course and E-Learning Content',
    40,
    '<p>TTS Studio is a powerful tool for e-learning creators who want to produce high-quality instructional audio without recording studio time.</p><p><strong>E-Learning Production Tips:</strong></p><ul><li>Write scripts at a 10th-grade reading level for broad accessibility</li><li>Keep lessons under 10 minutes of audio (matches typical lesson length)</li><li>Use SSML breaks to add natural pauses between concepts</li><li>Generate a "chapter summary" audio for each module</li><li>Add downloadable transcripts alongside audio (accessibility requirement)</li></ul><p><strong>Integration with SoftwareHub Courses:</strong> Upload your TTS-generated MP3 or WAV to Mux via the course editor, and it will be transcoded for streaming automatically.</p>'
  )
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, content_html = EXCLUDED.content_html;

-- -----------------------------------------------------------------------
-- 6. Module 5: Advanced Techniques & Next Steps
-- -----------------------------------------------------------------------
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES
  ('dddd0005-0000-0000-0000-000000000005', 'cccc0001-0000-0000-0000-000000000001', 'Advanced Techniques & Next Steps', 50)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
  (
    'eeee0017-0000-0000-0000-000000000017',
    'dddd0005-0000-0000-0000-000000000005',
    'Using the TTS Studio API',
    10,
    '<p>TTS Studio Studio tier includes API access for integrating voice generation into your own applications and workflows.</p><p><strong>API Quick Start:</strong></p><pre><code>POST https://api.tts-studio.app/v1/generate\nAuthorization: Bearer &lt;your-api-key&gt;\nContent-Type: application/json\n\n{\n  "text": "Hello, world!",\n  "voice_id": "emma-natural",\n  "quality": "high",\n  "format": "mp3"\n}</code></pre><p>The API returns a download URL for your generated audio file. Files are stored for 24 hours then deleted for privacy.</p><p>Get your API key from TTS Studio → Preferences → API Access.</p>'
  ),
  (
    'eeee0018-0000-0000-0000-000000000018',
    'dddd0005-0000-0000-0000-000000000005',
    'Automating Your Workflow',
    20,
    '<p>Combine TTS Studio''s API with automation tools like Make (formerly Integromat) or Zapier to create fully automated content production pipelines.</p><p><strong>Example Automation: Newsletter to Podcast</strong></p><ol><li>New newsletter published (trigger in Beehiiv or Substack webhook)</li><li>Make fetches the newsletter content via their API</li><li>Make sends the content to TTS Studio API</li><li>TTS Studio generates the audio file</li><li>Make uploads the MP3 to your podcast host (Buzzsprout, Transistor)</li><li>Episode publishes automatically</li></ol><p>This workflow can convert a written newsletter into a published podcast episode in under 10 minutes with zero manual work.</p>'
  ),
  (
    'eeee0019-0000-0000-0000-000000000019',
    'dddd0005-0000-0000-0000-000000000005',
    'Course Completion & Next Steps',
    30,
    '<p>Congratulations on completing TTS Studio Mastery! You now have the skills to produce professional voice content at scale.</p><p><strong>What you''ve learned:</strong></p><ul><li>Setting up TTS Studio and generating your first audio</li><li>Cloning your own voice from a 30-second sample</li><li>Writing and optimizing scripts for TTS output</li><li>Using SSML for advanced speech control</li><li>Real-world production workflows for podcasts, audiobooks, videos, and courses</li><li>Automating content production with the TTS Studio API</li></ul><p><strong>Next Steps:</strong></p><ul><li>Start your first project — use your cloned voice on a real piece of content</li><li>Join the SoftwareHub community to share your work and get feedback</li><li>Explore the TTS Studio API if you''re on Studio tier</li></ul><p>Happy creating!</p>'
  )
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, content_html = EXCLUDED.content_html;

-- -----------------------------------------------------------------------
-- 7. Link TTS Studio course to the tts-studio package
--    Update the package to reference this course slug
-- -----------------------------------------------------------------------
UPDATE public.packages
SET
  updated_at = NOW()
WHERE slug = 'tts-studio';

-- Verification comment:
-- SELECT c.title, c.slug, c.status,
--        count(distinct m.id) as modules,
--        count(distinct l.id) as lessons
-- FROM public.courses c
-- LEFT JOIN public.modules m ON m.course_id = c.id
-- LEFT JOIN public.lessons l ON l.module_id = m.id
-- WHERE c.slug = 'tts-studio-mastery'
-- GROUP BY c.id, c.title, c.slug, c.status;
-- Expected: 5 modules, 19 lessons
