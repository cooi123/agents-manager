/*
  # Fix storage configuration for document uploads

  1. Changes
    - Create storage bucket for personal documents if not exists
    - Set up proper RLS policies for document access
    - Fix storage paths and permissions

  2. Security
    - Ensure proper access control for uploaded files
    - Maintain data isolation between users
*/

-- Create storage bucket for personal documents
INSERT INTO storage.buckets (id, name, public)
SELECT 'personal', 'personal', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'personal'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access to personal documents" ON storage.objects;

-- Create policy for reading personal documents
CREATE POLICY "Users can read own personal documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'personal' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Create policy for uploading personal documents
CREATE POLICY "Users can upload personal documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personal' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Create policy for deleting personal documents
CREATE POLICY "Users can delete own personal documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'personal' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Create policy for admin access
CREATE POLICY "Admins have full access to personal documents"
ON storage.objects
FOR ALL
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