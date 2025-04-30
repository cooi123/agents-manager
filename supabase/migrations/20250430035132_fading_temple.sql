/*
  # Fix storage bucket configuration for personal documents

  1. Changes
    - Ensure personal bucket exists and is configured correctly
    - Update storage policies to use correct path structure
    - Add policies for document management
  
  2. Security
    - Maintain RLS security
    - Restrict access to authenticated users
    - Users can only access their own documents
*/

-- Ensure personal bucket exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'personal', 'personal', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'personal'
);

-- Drop existing policies
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
  auth.uid()::text = SPLIT_PART(name, '/', 2)
);

-- Create policy for uploading personal documents
CREATE POLICY "Users can upload personal documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personal' AND
  auth.uid()::text = SPLIT_PART(name, '/', 2)
);

-- Create policy for deleting personal documents
CREATE POLICY "Users can delete own personal documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'personal' AND
  auth.uid()::text = SPLIT_PART(name, '/', 2)
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