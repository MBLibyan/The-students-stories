-- ============================================================================
-- Storybook Flipbook - Initial Database Schema, RLS & Storage Policies
-- Run this script once in Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT NOT NULL DEFAULT '',
  pdf_url TEXT NOT NULL CHECK (char_length(trim(pdf_url)) > 0),
  audio_url TEXT,
  cover_front_url TEXT,
  cover_back_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'multiple_choice'
    CHECK (type IN ('multiple_choice', 'inference')),
  question TEXT NOT NULL CHECK (char_length(trim(question)) > 0),
  options JSONB NOT NULL
    CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4),
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0)
);

-- Helpful indexes for public library listing, teacher dashboard, and ordered quiz loading
CREATE INDEX IF NOT EXISTS idx_books_owner_created
  ON public.books (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_books_created
  ON public.books (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_book_position
  ON public.questions (book_id, position ASC);

-- ----------------------------------------------------------------------------
-- 2. Row Level Security (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Books: anyone can read; only owner can insert/update/delete
DROP POLICY IF EXISTS "Public read access for books" ON public.books;
CREATE POLICY "Public read access for books"
  ON public.books
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can insert own books" ON public.books;
CREATE POLICY "Teachers can insert own books"
  ON public.books
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Teachers can update own books" ON public.books;
CREATE POLICY "Teachers can update own books"
  ON public.books
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Teachers can delete own books" ON public.books;
CREATE POLICY "Teachers can delete own books"
  ON public.books
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Questions: anyone can read; only owner of the parent book can insert/update/delete
DROP POLICY IF EXISTS "Public read access for questions" ON public.questions;
CREATE POLICY "Public read access for questions"
  ON public.questions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can insert questions for own books" ON public.questions;
CREATE POLICY "Teachers can insert questions for own books"
  ON public.questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can update questions for own books" ON public.questions;
CREATE POLICY "Teachers can update questions for own books"
  ON public.questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can delete questions for own books" ON public.questions;
CREATE POLICY "Teachers can delete questions for own books"
  ON public.questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND b.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Storage Buckets & Policies (Public Read, Authenticated Owner Write)
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('story-pdfs', 'story-pdfs', true, 52428800, ARRAY['application/pdf']),
  ('story-audio', 'story-audio', true, 52428800, NULL),
  ('story-covers', 'story-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access for all storybook buckets
DROP POLICY IF EXISTS "Public read storybook storage" ON storage.objects;
CREATE POLICY "Public read storybook storage"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id IN ('story-pdfs', 'story-audio', 'story-covers'));

-- Authenticated teachers can upload into their own user-ID folder: <uid>/<filename>
DROP POLICY IF EXISTS "Authenticated upload own storybook files" ON storage.objects;
CREATE POLICY "Authenticated upload own storybook files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('story-pdfs', 'story-audio', 'story-covers')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated teachers can update their own uploaded files
DROP POLICY IF EXISTS "Authenticated update own storybook files" ON storage.objects;
CREATE POLICY "Authenticated update own storybook files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('story-pdfs', 'story-audio', 'story-covers')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('story-pdfs', 'story-audio', 'story-covers')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated teachers can delete their own uploaded files
DROP POLICY IF EXISTS "Authenticated delete own storybook files" ON storage.objects;
CREATE POLICY "Authenticated delete own storybook files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('story-pdfs', 'story-audio', 'story-covers')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
