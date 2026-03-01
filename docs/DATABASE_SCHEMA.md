# Database Schema

## Core Tables

### users
Primary user table synced from Supabase Auth.
- `id` (uuid, PK) - Matches auth.users.id
- `email` (text)
- `role` (text) - admin, teacher, student
- `created_at` (timestamptz)

### courses
- `id` (uuid, PK)
- `title`, `description`, `slug`
- `published` (boolean)
- `price` (numeric)

### modules
- `id` (uuid, PK)
- `course_id` (FK -> courses)
- `title`, `position`

### lessons
- `id` (uuid, PK)
- `module_id` (FK -> modules)
- `title`, `description`, `video_url`

### orders
- `id` (uuid, PK)
- `user_id` (FK -> users)
- `amount`, `status`, `stripe_session_id`

### packages
- `id` (uuid, PK)
- `name`, `slug`, `description`
- `category`, `pricing_type`

### licenses
- `id` (uuid, PK)
- `user_id` (FK -> users)
- `package_id` (FK -> packages)
- `key`, `tier`, `status`

## Relationships
- users 1:N orders
- users 1:N lesson_progress
- users 1:N notifications
- courses 1:N modules 1:N lessons
- packages 1:N licenses
- packages 1:N package_releases
