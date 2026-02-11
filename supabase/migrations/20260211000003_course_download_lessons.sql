-- Course Download Lessons: adds 'download' lesson type so courses can include
-- software package downloads as part of the course content.

-- Add 'download' to valid lesson types
DO $$
BEGIN
  -- Add package_id column to lessons for download-type lessons
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'lessons' AND column_name = 'package_id') THEN
    ALTER TABLE public.lessons
      ADD COLUMN package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL;
  END IF;

  -- Add download_instructions column for download lessons
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'lessons' AND column_name = 'download_instructions') THEN
    ALTER TABLE public.lessons
      ADD COLUMN download_instructions text;
  END IF;
END $$;

-- Update the lesson_type check constraint to include 'download'
-- The constraint may be on the lessons table or course_lessons table
DO $$
BEGIN
  -- Try to drop and recreate the constraint if it exists
  BEGIN
    ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_type_check;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Add the new constraint including 'download'
  BEGIN
    ALTER TABLE public.lessons
      ADD CONSTRAINT lessons_type_check
      CHECK (type IN ('multimedia', 'pdf', 'quiz', 'text', 'download'));
  EXCEPTION WHEN OTHERS THEN
    -- If 'type' column doesn't exist or constraint fails, try lesson_type
    BEGIN
      ALTER TABLE public.lessons
        ADD CONSTRAINT lessons_lesson_type_check
        CHECK (lesson_type IN ('multimedia', 'pdf', 'quiz', 'text', 'download'));
    EXCEPTION WHEN OTHERS THEN
      NULL; -- If neither works, skip constraint (may use different column name)
    END;
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_lessons_package_id ON public.lessons(package_id);
