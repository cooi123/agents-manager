/*
  # Fix storage bucket policies for personal documents

  1. Changes
    - Add storage bucket policies for personal documents
    - Enable authenticated users to read and write their own documents
    - Ensure users can only access their own documents in the personal folder

  2. Security
    - Add policies to restrict access to personal documents by user ID
    - Users can only access files in their own user ID folder
*/

-- Create storage bucket for personal documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'personal', 'personal', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'personal'
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own personal documents" ON storage.objects;

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