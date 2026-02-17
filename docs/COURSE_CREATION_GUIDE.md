# Course Creation Guide

> **For:** SoftwareHub Instructors & Admins
> **Purpose:** Step-by-step guide for creating and publishing video courses on SoftwareHub

---

## Overview

SoftwareHub uses Mux for video hosting (adaptive HLS streaming) and a modular course structure with lessons, quizzes, and certificates. This guide walks through the full process from recording to publishing.

---

## Video Specifications

### Recording Recommendations

| Setting | Specification |
|---------|--------------|
| **Resolution** | 1920×1080 (1080p minimum) |
| **Frame Rate** | 30fps or 60fps |
| **Format** | MP4 (H.264) before upload |
| **Audio** | 48kHz stereo, -14 LUFS |
| **Bitrate** | 8–20 Mbps (Mux transcodes automatically) |
| **Max file size** | 5GB per video |
| **Recommended length** | 5–15 min per lesson |

### Screen Recording Tips

- Use 1920×1080 display resolution or record at that resolution
- Recommended tools: Loom, Camtasia, OBS, QuickTime
- For coding demos: use a high-contrast theme, 16–18pt font
- Record in a quiet environment with a USB microphone

---

## Course Structure

```
Course
├── Module 1: Getting Started
│   ├── Lesson 1-1: Introduction (video + text)
│   ├── Lesson 1-2: Installation (video)
│   └── Lesson 1-3: Quiz (auto-graded)
├── Module 2: Core Features
│   ├── Lesson 2-1: Basic Usage (video)
│   └── Lesson 2-2: Advanced Settings (video)
└── Module 3: Real-World Examples
    ├── Lesson 3-1: Case Study (video)
    └── Certificate of Completion (auto-generated)
```

Each course should have:
- **3–6 modules** (logical groupings)
- **2–5 lessons per module** (5–15 min each)
- **At least 1 quiz** per course (for certificate eligibility)
- **Total duration:** 2–4 hours recommended

---

## Step-by-Step: Creating a Course

### Step 1: Create the Course Record

1. Navigate to **Admin → Courses → New Course**
2. Fill in:
   - **Title:** Clear, benefit-focused (e.g., "Mastering Auto Comment for TikTok Growth")
   - **Slug:** Auto-generated from title (e.g., `mastering-auto-comment`)
   - **Description:** 2–3 paragraphs explaining what students will learn
   - **Thumbnail:** 16:9 ratio, 1280×720px minimum
   - **Price:** Set to $0 if bundled with a software license
3. Click **Save Draft** — don't publish yet

### Step 2: Add Modules

1. In the course editor, click **Add Module**
2. Give each module a descriptive title
3. Set the module order (drag to reorder)
4. Optionally add a module description

### Step 3: Add Lessons to Each Module

1. Click **Add Lesson** inside a module
2. Set lesson title and position
3. Select lesson type: **Video**, **Text**, or **Quiz**
4. For video lessons, upload via the video upload section (see Step 4)

### Step 4: Upload Videos to Mux

#### Via Admin UI (Recommended)

1. Open the lesson editor
2. Click **Upload Video**
3. Select your MP4 file (up to 5GB)
4. Wait for upload to complete — Mux processes in the background (typically 1–5 min)
5. Once processed, the playback ID is automatically saved to the lesson

#### Via API (Bulk Upload)

```bash
# Create a direct upload URL
curl -X POST https://your-app.com/api/admin/lessons/[id]/upload \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"

# Response includes an upload URL
# Use PUT to upload directly to Mux:
curl -X PUT "<upload_url>" \
  -H "Content-Type: video/mp4" \
  --data-binary @lesson.mp4
```

#### Upload Status

Mux sends a webhook when processing is complete. The lesson status will update automatically:
- `pending` → uploading
- `preparing` → Mux processing
- `ready` → available for playback

### Step 5: Configure Drip Schedule (Optional)

If you want to release content gradually (drip):

1. In the lesson editor, set **Release Schedule**:
   - **Immediate** (default): available on enrollment
   - **Days after enrollment**: unlock X days after student enrolls
   - **Fixed date**: unlock on a specific date

2. Students receive an email when a new lesson unlocks

### Step 6: Add Quizzes

1. Add a **Quiz** lesson type in the appropriate module
2. In the quiz editor:
   - Set **Minimum passing score** (default: 70%)
   - Toggle **Allow retakes**
   - Set **Max attempts** (0 = unlimited)
3. Add questions:
   - **Multiple Choice** (single answer)
   - **Multiple Select** (multiple correct answers)
   - **Free Text** (manual grading — use sparingly)
4. Set the correct answer and optional explanation for each question

### Step 7: Configure Certificate

Certificates are auto-generated when a student completes all required lessons.

By default:
- All lessons marked as **required** must be completed
- The certificate uses the course title and student name
- A unique verification link is generated (e.g., `/verify-certificate/[token]`)
- Certificate is available as a PDF download

To customize the certificate template, contact your admin.

### Step 8: Link to a Product (Software License)

To tie course access to a software purchase:

1. In the course settings, set **Product Link** to the package slug
2. Students who purchase the software automatically get course access
3. The course appears in the student's dashboard under their purchased product

### Step 9: Publish

1. Review all lessons have videos uploaded and are marked **ready**
2. Check quiz questions have correct answers set
3. Click **Publish Course**
4. Verify the course appears on the public catalog

---

## Lesson Types Reference

### Video Lesson
- Upload MP4 → auto-transcodes to HLS via Mux
- Playback via MuxPlayer component (adaptive bitrate)
- Students can set playback speed (0.5x–2x)
- Progress is tracked (resume from last position)

### Text Lesson
- Rich text content (markdown supported)
- Can include images, code blocks, links
- Progress tracked when student scrolls to bottom

### Quiz Lesson
- Multiple choice / multi-select / free text
- Auto-graded (except free text)
- Configurable pass score and retake policy
- Score shown immediately after submission

---

## Downloadable Resources

Students can download supplementary files (PDFs, code, templates):

1. In the lesson editor, click **Add Resource**
2. Upload the file (stored in Cloudflare R2)
3. Set a display name

Students see a **Downloads** section below the video player.

---

## Course Preview Checklist

Before publishing, verify:

- [ ] Course thumbnail uploaded (1280×720)
- [ ] All modules have at least one lesson
- [ ] All video lessons have processed (status: ready)
- [ ] Quiz has questions with correct answers
- [ ] Certificate trigger is configured
- [ ] Course is linked to the correct product/package
- [ ] Description clearly explains what students will learn
- [ ] Pricing is set correctly ($0 for license bundles)

---

## Updating Existing Courses

### Adding a New Lesson
1. Navigate to Admin → Courses → [Course]
2. Click **Add Lesson** in the appropriate module
3. Upload video and publish the lesson
4. Students are notified via activity feed

### Replacing a Video
1. Open the lesson editor
2. Click **Replace Video** (uploads a new Mux asset)
3. Old asset is archived

### Editing Quiz Questions
- Published quizzes can have questions edited, but student attempt history is preserved
- Changing correct answers affects new attempts only

---

## Troubleshooting

### Video Not Playing
1. Check Mux asset status in Admin → Lessons
2. Ensure `mux_playback_id` is set on the lesson
3. Check browser console for CORS or playback errors
4. Verify Mux API keys are set in `.env.local`

### Upload Fails
1. Check file size is under 5GB
2. Ensure format is MP4 (H.264)
3. Check Mux webhook is configured in Mux dashboard
4. Look for errors in server logs

### Certificate Not Generated
1. Check all required lessons are marked complete
2. Verify the `NEXT_PUBLIC_SITE_URL` env var is set (used in certificate links)
3. Check the `certificates` table in Supabase Studio

---

## API Reference

```typescript
// Create a course (admin)
POST /api/admin/courses
Body: { title, slug, description, thumbnail_url, price_cents }

// Add a module
POST /api/admin/courses/[id]/modules
Body: { title, position }

// Add a lesson
POST /api/admin/courses/[id]/lessons
Body: { module_id, title, type, position, is_required }

// Get upload URL for video
POST /api/admin/lessons/[id]/upload
Returns: { upload_url, asset_id }

// Get drip schedule for a course (student)
GET /api/courses/[id]/drip-schedule
Returns: { lessons: [{ id, title, unlocked, unlocks_at }] }

// Submit quiz attempt
POST /api/quizzes/attempts/[attemptId]/submit
Body: { answers: [{ question_id, answer }] }
Returns: { score, passed, correct_count, total_count }
```

---

*Last Updated: February 17, 2026*
