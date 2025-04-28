/*
  # Add storage bucket policies for personal documents

  1. Changes
    - Create storage bucket for personal documents if it doesn't exist
    - Add RLS policies for personal documents storage bucket
      - Allow users to read their own documents
      - Allow users to write to their own personal directory
      - Allow admins full access

  2. Security
    - Enable RLS on storage bucket
    - Restrict access to authenticated users only
    - Users can only access their own documents in personal/{user_id}/ path
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'personal'
  ) THEN
    INSERT INTO storage.buckets (id, name)
    VALUES ('personal', 'personal');
  END IF;
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the personal bucket
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own personal documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload personal documents" ON storage.objects;
  DROP POLICY IF EXISTS "Admins have full access to personal documents" ON storage.objects;
END $$;

-- Allow users to read their own documents
CREATE POLICY "Users can read own personal documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'personal' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to upload their own documents
CREATE POLICY "Users can upload personal documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personal' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins full access
CREATE POLICY "Admins have full access to personal documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'personal' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'personal' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);