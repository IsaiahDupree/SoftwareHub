-- Migration: Watermark Remover Course Content (WR-003)
-- Creates course structure for the Watermark Remover product

-- ============================================================
-- WATERMARK REMOVER COURSE
-- ============================================================

INSERT INTO public.courses (id, title, slug, description, status, stripe_price_id)
VALUES (
  'cccc0002-0000-0000-0000-000000000001',
  'Mastering Watermark Removal: From Basics to Advanced',
  'watermark-remover-course',
  'Learn to remove watermarks professionally using AI-powered tools. This 3-hour course covers everything from basic watermark removal to advanced batch processing, AI region detection, and integration with your content creation workflow.',
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
SET course_id = 'cccc0002-0000-0000-0000-000000000001'
WHERE slug = 'watermark-remover'
  AND EXISTS (SELECT 1 FROM public.packages WHERE slug = 'watermark-remover');

-- ============================================================
-- MODULE 1: Introduction to Watermark Removal
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0021-0000-0000-0000-000000000001', 'cccc0002-0000-0000-0000-000000000001', 'Introduction to Watermark Removal', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0211-0000-0000-0000-000000000001',
  'mmmm0021-0000-0000-0000-000000000001',
  'Welcome & What You Will Learn',
  10,
  '<p>Welcome to the Watermark Remover course! In this course, you will master the BlankLogo AI-powered tool to remove watermarks from images and videos professionally.</p>
<h3>What You Will Learn</h3>
<ul>
  <li>Install and configure the Watermark Remover desktop application</li>
  <li>Understand how AI-powered inpainting works</li>
  <li>Process single images and videos efficiently</li>
  <li>Use batch mode for high-volume workflows</li>
  <li>Leverage AI region detection for hands-free operation</li>
  <li>Integrate with your content creation pipeline</li>
</ul>
<p>By the end of this course, you will be able to remove watermarks from any image or video with professional results.</p>'
),
(
  'llll0211-0000-0000-0000-000000000002',
  'mmmm0021-0000-0000-0000-000000000001',
  'Installing BlankLogo on macOS',
  20,
  '<p>Let us get BlankLogo installed on your Mac. The application requires macOS 12.0 Monterey or later.</p>
<h3>System Requirements</h3>
<ul>
  <li>macOS 12.0 Monterey or later</li>
  <li>8GB RAM minimum (16GB recommended for video processing)</li>
  <li>5GB free disk space</li>
  <li>Apple Silicon or Intel processor (M1/M2 optimized)</li>
</ul>
<h3>Installation Steps</h3>
<ol>
  <li>Download the .dmg installer from your SoftwareHub dashboard</li>
  <li>Open the .dmg file and drag BlankLogo to Applications</li>
  <li>Launch BlankLogo from Applications</li>
  <li>Enter your license key when prompted</li>
  <li>Complete the activation (requires internet connection)</li>
</ol>
<p>If you see a security warning, go to System Preferences → Security & Privacy and click "Open Anyway".</p>'
),
(
  'llll0211-0000-0000-0000-000000000003',
  'mmmm0021-0000-0000-0000-000000000001',
  'Understanding AI Inpainting Technology',
  30,
  '<p>BlankLogo uses deep learning inpainting to reconstruct the image content underneath watermarks. Understanding this technology helps you get better results.</p>
<h3>How Inpainting Works</h3>
<p>The AI model was trained on millions of images and learned to predict what should exist in any region of an image. When you mask a watermark:</p>
<ol>
  <li>The model analyzes the surrounding pixels</li>
  <li>It predicts the most likely content for the masked area</li>
  <li>It fills in the region with photorealistic content</li>
</ol>
<h3>Best Results Tips</h3>
<ul>
  <li>Higher resolution images produce better results</li>
  <li>Simple backgrounds (solid colors, gradients) are easiest</li>
  <li>Complex backgrounds (people, text, fine details) require manual refinement</li>
  <li>Semi-transparent watermarks are easier to remove than opaque ones</li>
</ul>
<p>The tool uses a tiered approach: fast preview mode for positioning, and high-quality render mode for final output.</p>'
),
(
  'llll0211-0000-0000-0000-000000000004',
  'mmmm0021-0000-0000-0000-000000000001',
  'License Tiers and Feature Overview',
  40,
  '<p>BlankLogo offers three license tiers with different capabilities:</p>
<h3>Personal ($49 one-time)</h3>
<ul>
  <li>Single image processing</li>
  <li>Up to 1080p resolution</li>
  <li>Manual watermark selection</li>
  <li>JPEG and PNG output</li>
</ul>
<h3>Pro ($99 one-time)</h3>
<ul>
  <li>Everything in Personal</li>
  <li>Batch processing (up to 100 images)</li>
  <li>4K resolution support</li>
  <li>Video watermark removal (up to 10 min)</li>
  <li>AI region detection (auto-detect watermarks)</li>
</ul>
<h3>Team ($249 one-time)</h3>
<ul>
  <li>Everything in Pro</li>
  <li>Unlimited batch processing</li>
  <li>8K resolution support</li>
  <li>Unlimited video length</li>
  <li>GPU acceleration for 10x faster processing</li>
  <li>Up to 3 device activations</li>
  <li>API access for automation</li>
</ul>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 2: Basic Watermark Removal
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0021-0000-0000-0000-000000000002', 'cccc0002-0000-0000-0000-000000000001', 'Basic Watermark Removal', 20)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0212-0000-0000-0000-000000000001',
  'mmmm0021-0000-0000-0000-000000000002',
  'Your First Watermark Removal',
  10,
  '<p>Let us walk through removing your first watermark step by step.</p>
<h3>Step-by-Step Process</h3>
<ol>
  <li><strong>Open an image:</strong> Click "Open Image" or drag and drop a file</li>
  <li><strong>Select the watermark:</strong> Use the brush or lasso tool to paint over the watermark</li>
  <li><strong>Preview the result:</strong> Click "Preview" to see a fast preview</li>
  <li><strong>Adjust if needed:</strong> Expand or refine your selection</li>
  <li><strong>Render:</strong> Click "Remove Watermark" for the final high-quality result</li>
  <li><strong>Export:</strong> Save as JPEG, PNG, or WEBP</li>
</ol>
<h3>Selection Tools</h3>
<ul>
  <li><strong>Brush:</strong> Paint over the watermark area</li>
  <li><strong>Lasso:</strong> Draw a precise outline around the watermark</li>
  <li><strong>Smart Select:</strong> Click on the watermark and it auto-selects based on color/contrast</li>
</ul>'
),
(
  'llll0212-0000-0000-0000-000000000002',
  'mmmm0021-0000-0000-0000-000000000002',
  'Working with Different Watermark Types',
  20,
  '<p>Watermarks come in many forms. Here is how to handle each type effectively.</p>
<h3>Text Watermarks</h3>
<p>The most common type. Usually placed in corners or diagonally across the image.</p>
<ul>
  <li>Use Smart Select for high-contrast text</li>
  <li>Use the brush for semi-transparent text</li>
  <li>For diagonal text, use the lasso tool for precision</li>
</ul>
<h3>Logo Watermarks</h3>
<p>Brand logos often have complex edges.</p>
<ul>
  <li>Use lasso for sharp logo edges</li>
  <li>Enable "Feather Edges" for soft blending</li>
  <li>For transparent logos, boost contrast first using Preview</li>
</ul>
<h3>Tiled Watermarks</h3>
<p>Some stock photos use repeating watermarks across the entire image.</p>
<ul>
  <li>Use "Auto-Select All Instances" to detect all tiles</li>
  <li>Process in sections if the tiling is dense</li>
</ul>
<h3>Semi-Transparent Overlays</h3>
<ul>
  <li>Use the "Opacity" slider to detect low-opacity watermarks</li>
  <li>Enable "Show Watermark Map" to visualize coverage</li>
</ul>'
),
(
  'llll0212-0000-0000-0000-000000000003',
  'mmmm0021-0000-0000-0000-000000000002',
  'Export Settings and Output Formats',
  30,
  '<p>Choosing the right export settings ensures the highest quality output for your use case.</p>
<h3>Format Guide</h3>
<ul>
  <li><strong>JPEG:</strong> Best for photos, smaller file size. Use 90-95% quality for professional work.</li>
  <li><strong>PNG:</strong> Best for graphics, logos, screenshots. Lossless, preserves transparency.</li>
  <li><strong>WEBP:</strong> Web-optimized, smaller than JPEG at same quality. Good for websites.</li>
  <li><strong>TIFF:</strong> Professional print quality. Large files but maximum fidelity.</li>
</ul>
<h3>Resolution Settings</h3>
<ul>
  <li>Output resolution matches input by default</li>
  <li>Enable "Upscale 2x" for small images (uses AI upscaling)</li>
  <li>Set DPI for print work (300 DPI for professional printing)</li>
</ul>
<h3>Batch Export</h3>
<p>When exporting multiple files:</p>
<ol>
  <li>Set the output folder</li>
  <li>Choose naming convention: original, original-clean, or custom prefix</li>
  <li>Set format and quality once, applies to all</li>
</ol>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 3: Advanced Features
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0021-0000-0000-0000-000000000003', 'cccc0002-0000-0000-0000-000000000001', 'Advanced Features & Batch Processing', 30)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0213-0000-0000-0000-000000000001',
  'mmmm0021-0000-0000-0000-000000000003',
  'Batch Processing Workflows',
  10,
  '<p>Batch processing is one of the most powerful features in BlankLogo Pro and Team. Process hundreds of images automatically.</p>
<h3>Setting Up a Batch Job</h3>
<ol>
  <li>Click "Batch Mode" in the toolbar</li>
  <li>Add images by folder or individual files</li>
  <li>Configure watermark detection settings</li>
  <li>Set output folder and naming convention</li>
  <li>Click "Start Batch" to begin processing</li>
</ol>
<h3>Batch Configuration Options</h3>
<ul>
  <li><strong>Auto-detect watermarks:</strong> Uses AI to find watermarks in each image automatically</li>
  <li><strong>Apply saved mask:</strong> Use a watermark mask you already created (works if all images have the same watermark in the same position)</li>
  <li><strong>Template matching:</strong> Provide a watermark sample, tool finds and removes it from all images</li>
</ul>
<h3>Processing Queue Management</h3>
<ul>
  <li>Pause and resume batch jobs</li>
  <li>Prioritize specific images</li>
  <li>Skip failed images and continue</li>
  <li>View real-time progress and ETA</li>
</ul>'
),
(
  'llll0213-0000-0000-0000-000000000002',
  'mmmm0021-0000-0000-0000-000000000003',
  'AI Region Detection',
  20,
  '<p>The AI Region Detection feature automatically identifies watermarks in images without any manual selection required.</p>
<h3>How AI Detection Works</h3>
<p>The detection model was trained to recognize:</p>
<ul>
  <li>Common stock photo watermarks (Getty, Shutterstock, Adobe Stock, etc.)</li>
  <li>Text overlays and copyright notices</li>
  <li>Logo patterns and brand marks</li>
  <li>Semi-transparent overlays and color casts</li>
</ul>
<h3>Using AI Detection</h3>
<ol>
  <li>Open an image</li>
  <li>Click "Auto-Detect Watermarks" button</li>
  <li>Review the highlighted regions</li>
  <li>Accept, reject, or fine-tune individual detections</li>
  <li>Proceed with removal</li>
</ol>
<h3>Detection Confidence Settings</h3>
<ul>
  <li><strong>High (0.9+):</strong> Only flags obvious watermarks, fewer false positives</li>
  <li><strong>Medium (0.7+):</strong> Balanced detection, recommended for most cases</li>
  <li><strong>Low (0.5+):</strong> Catches subtle watermarks, may include false positives</li>
</ul>
<h3>Training Custom Detectors</h3>
<p>For Team users: You can train a custom detector for specific watermarks you frequently encounter.</p>
<ol>
  <li>Go to Settings → AI Models → Custom Detectors</li>
  <li>Provide 20+ samples of the watermark</li>
  <li>Click "Train Detector" (takes 2-5 minutes)</li>
  <li>Your custom detector is now available in batch mode</li>
</ol>'
),
(
  'llll0213-0000-0000-0000-000000000003',
  'mmmm0021-0000-0000-0000-000000000003',
  'Video Watermark Removal',
  30,
  '<p>Pro and Team users can remove watermarks from videos. The process is frame-accurate and time-efficient.</p>
<h3>Supported Video Formats</h3>
<ul>
  <li>MP4 (H.264, H.265/HEVC)</li>
  <li>MOV (ProRes, H.264)</li>
  <li>AVI, MKV, WebM</li>
  <li>Maximum resolution: 4K (Pro), 8K (Team)</li>
</ul>
<h3>Video Processing Steps</h3>
<ol>
  <li>Open the video file</li>
  <li>Preview the first frame and detect the watermark</li>
  <li>BlankLogo tracks the watermark position across all frames</li>
  <li>For moving watermarks, use "Track & Remove" mode</li>
  <li>Set quality (Fast Preview / Balanced / Maximum Quality)</li>
  <li>Click "Process Video" — estimated time shown based on length</li>
</ol>
<h3>Processing Speed</h3>
<ul>
  <li>Without GPU: ~2-5 minutes per minute of footage</li>
  <li>With GPU (Team): ~20-30 seconds per minute of footage</li>
  <li>Apple Silicon M2 Max: ~15 seconds per minute</li>
</ul>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 4: Real-World Workflows
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0021-0000-0000-0000-000000000004', 'cccc0002-0000-0000-0000-000000000001', 'Real-World Workflows & Use Cases', 40)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0214-0000-0000-0000-000000000001',
  'mmmm0021-0000-0000-0000-000000000004',
  'Content Creation Workflow',
  10,
  '<p>Integrate BlankLogo into your content creation pipeline for seamless watermark removal at scale.</p>
<h3>Social Media Content Workflow</h3>
<ol>
  <li>Collect reference images from competitor research tools</li>
  <li>Drop into BlankLogo batch queue</li>
  <li>Run auto-detection to identify watermarks</li>
  <li>Process entire batch overnight</li>
  <li>Review results and approve clean images</li>
  <li>Export to Canva, Adobe Express, or your design tool</li>
</ol>
<h3>E-commerce Product Images</h3>
<p>When sourcing product images from suppliers who add watermarks:</p>
<ol>
  <li>Download all supplier product images</li>
  <li>Create a template mask if all watermarks are in the same position</li>
  <li>Run batch processing with the template mask</li>
  <li>Quality check the output folder</li>
  <li>Upload to your Shopify/WooCommerce store</li>
</ol>
<h3>Pro Tip: Watch Folder Automation</h3>
<p>Set up a watch folder to automatically process images as they are added:</p>
<ol>
  <li>Go to Settings → Automation → Watch Folder</li>
  <li>Set the input folder</li>
  <li>Configure processing settings</li>
  <li>BlankLogo runs in the background, processing new files automatically</li>
</ol>'
),
(
  'llll0214-0000-0000-0000-000000000002',
  'mmmm0021-0000-0000-0000-000000000004',
  'API Integration (Team Tier)',
  20,
  '<p>Team users can integrate BlankLogo into any application using the REST API.</p>
<h3>API Authentication</h3>
<pre><code>curl -X POST https://api.blanklgo.app/v1/remove \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@photo.jpg" \
  -F "auto_detect=true" \
  --output cleaned.jpg</code></pre>
<h3>API Endpoints</h3>
<ul>
  <li><strong>POST /v1/remove</strong> — Remove watermarks from a single image</li>
  <li><strong>POST /v1/batch</strong> — Submit a batch job (up to 100 images)</li>
  <li><strong>GET /v1/batch/:id</strong> — Check batch job status</li>
  <li><strong>GET /v1/usage</strong> — Check API usage and remaining credits</li>
</ul>
<h3>Integration Examples</h3>
<ul>
  <li>Make.com (Integromat) automation flows</li>
  <li>Zapier webhooks triggered on file upload</li>
  <li>Custom Python/Node.js scripts for bulk processing</li>
  <li>Shopify app for automatic product image cleaning</li>
</ul>
<p>API documentation is available at <code>https://blanklgo.app/docs/api</code></p>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- ============================================================
-- MODULE 5: Troubleshooting & Best Practices
-- ============================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES ('mmmm0021-0000-0000-0000-000000000005', 'cccc0002-0000-0000-0000-000000000001', 'Troubleshooting & Best Practices', 50)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

INSERT INTO public.lessons (id, module_id, title, sort_order, content_html) VALUES
(
  'llll0215-0000-0000-0000-000000000001',
  'mmmm0021-0000-0000-0000-000000000005',
  'Common Issues and Solutions',
  10,
  '<p>Here are the most common issues users encounter and how to solve them.</p>
<h3>Blurry or Smeared Output</h3>
<p><strong>Cause:</strong> Selection area too large or complex background</p>
<p><strong>Solution:</strong> Use a tighter selection, or break the removal into smaller regions</p>
<h3>Artifacts Around Removed Area</h3>
<p><strong>Cause:</strong> Sharp selection edges</p>
<p><strong>Solution:</strong> Enable "Feather Edges" (2-4px) for softer blending</p>
<h3>AI Detection Missing Watermarks</h3>
<p><strong>Cause:</strong> Unusual watermark style or very low opacity</p>
<p><strong>Solution:</strong> Lower the confidence threshold, or select manually</p>
<h3>Slow Processing Speed</h3>
<p><strong>Cause:</strong> Large images or CPU-only processing</p>
<p><strong>Solution:</strong> Enable GPU acceleration in Settings → Performance, or reduce image resolution</p>
<h3>License Activation Failing</h3>
<p><strong>Cause:</strong> Network connectivity or max activations reached</p>
<p><strong>Solution:</strong> Check internet connection, or deactivate from another device in SoftwareHub dashboard</p>'
),
(
  'llll0215-0000-0000-0000-000000000002',
  'mmmm0021-0000-0000-0000-000000000005',
  'Quality Best Practices',
  20,
  '<p>Follow these best practices for consistently professional results.</p>
<h3>Source Image Quality</h3>
<ul>
  <li>Use the highest resolution source available</li>
  <li>Avoid JPEG images that have been compressed multiple times</li>
  <li>PNG sources preserve more detail for better inpainting results</li>
</ul>
<h3>Selection Best Practices</h3>
<ul>
  <li>Select only the watermark area, not surrounding pixels</li>
  <li>For text watermarks, include a 2-3px border around each letter</li>
  <li>Use Smart Select for high-contrast watermarks on uniform backgrounds</li>
  <li>Manual selection with lasso for watermarks on complex backgrounds</li>
</ul>
<h3>Quality Assessment Checklist</h3>
<ol>
  <li>Zoom in to 200% and inspect the removal area</li>
  <li>Check for any repeated patterns (AI hallucinations)</li>
  <li>Verify edges blend naturally with the background</li>
  <li>Compare against original to ensure no unintended changes</li>
</ol>
<h3>Legal Notice</h3>
<p>Only remove watermarks from images you own or have explicit rights to modify. Removing watermarks from stock photos without a license may violate copyright law. Always ensure you have the legal right to use the original images before processing.</p>'
),
(
  'llll0215-0000-0000-0000-000000000003',
  'mmmm0021-0000-0000-0000-000000000005',
  'Next Steps & Resources',
  30,
  '<p>Congratulations on completing the Watermark Remover course! Here is where to go from here.</p>
<h3>What You Have Learned</h3>
<ul>
  <li>Install and activate BlankLogo</li>
  <li>Remove watermarks from images and videos</li>
  <li>Use AI auto-detection for hands-free processing</li>
  <li>Process files in bulk with batch mode</li>
  <li>Integrate into your content workflow</li>
  <li>Use the API for automation (Team)</li>
</ul>
<h3>Getting Help</h3>
<ul>
  <li><strong>Documentation:</strong> Visit your SoftwareHub dashboard for the full manual</li>
  <li><strong>Community:</strong> Join the SoftwareHub community to share workflows</li>
  <li><strong>Support:</strong> Open a ticket at support.softwarehub.app</li>
</ul>
<h3>What is Next</h3>
<p>Check out the other courses on SoftwareHub:</p>
<ul>
  <li>TTS Studio Course — Create professional voiceovers</li>
  <li>Auto Comment Course — Scale your social media engagement</li>
  <li>Auto DM Course — Build automated lead generation funnels</li>
</ul>
<p>Thank you for choosing BlankLogo and SoftwareHub!</p>'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, sort_order = EXCLUDED.sort_order;

-- Verify course creation
DO $$
DECLARE
  v_module_count INT;
  v_lesson_count INT;
BEGIN
  SELECT COUNT(*) INTO v_module_count FROM public.modules WHERE course_id = 'cccc0002-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_lesson_count FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id
    WHERE m.course_id = 'cccc0002-0000-0000-0000-000000000001';
  RAISE NOTICE 'Watermark Remover Course: % modules, % lessons', v_module_count, v_lesson_count;
END $$;
