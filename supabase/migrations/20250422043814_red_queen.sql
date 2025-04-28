/*
  # Add storage policies for personal documents

  1. Security Changes
    - Add storage bucket policies for the `documents` bucket
    - Enable access to personal documents for authenticated users
    - Restrict access to only files owned by the user
    - Allow users to read and write their own documents

  2. Changes
    - Create storage bucket policies for personal document access
    - Ensure users can only access their own files in the personal/ directory
*/

-- Create policy to allow users to read their own documents
CREATE POLICY "Users can read own documents in storage"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (auth.uid())::text = (SPLIT_PART(name, '/', 2))::text AND
  SPLIT_PART(name, '/', 1) = 'personal'
);

-- Create policy to allow users to insert their own documents
CREATE POLICY "Users can upload own documents to storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (auth.uid())::text = (SPLIT_PART(name, '/', 2))::text AND
  SPLIT_PART(name, '/', 1) = 'personal'
);

-- Create policy to allow users to update their own documents
CREATE POLICY "Users can update own documents in storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (auth.uid())::text = (SPLIT_PART(name, '/', 2))::text AND
  SPLIT_PART(name, '/', 1) = 'personal'
);

-- Create policy to allow users to delete their own documents
CREATE POLICY "Users can delete own documents in storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (auth.uid())::text = (SPLIT_PART(name, '/', 2))::text AND
  SPLIT_PART(name, '/', 1) = 'personal'
);