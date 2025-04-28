/*
  # Fix storage policies for personal documents

  1. Changes
    - Create storage bucket for personal documents
    - Set up RLS policies for personal documents
    - Ensure users can only access their own documents
    - Enable admin access to all documents

  2. Security
    - Bucket is private by default
    - Users can only access their own folder
    - Admins have full access to all documents
*/

-- Create storage bucket for personal documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'personal', 'personal', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'personal'
);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access to personal documents" ON storage.objects;

-- Create policy to allow authenticated users to read their own documents
CREATE POLICY "Users can read own personal documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'personal' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to insert their own documents
CREATE POLICY "Users can upload personal documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personal'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to update their own documents
CREATE POLICY "Users can update own personal documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'personal'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'personal'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to delete their own documents
CREATE POLICY "Users can delete own personal documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'personal'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow admins full access to all documents
CREATE POLICY "Admins have full access to personal documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'personal'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'personal'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);