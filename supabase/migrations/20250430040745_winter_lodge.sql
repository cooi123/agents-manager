/*
  # Fix storage policies for document access

  1. Changes
    - Drop all existing storage policies
    - Create new policies with unique names for document access
    - Enable proper access control for both personal and project documents
  
  2. Security
    - Maintain same security model but fix naming conflicts
    - Users can only access their own documents
    - Project owners can access project documents
    - Admins have full access
*/

-- Drop all existing document-related policies
DROP POLICY IF EXISTS "Users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access to documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents to storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents in storage" ON storage.objects;

-- Create policy for reading documents with unique name
CREATE POLICY "storage_read_documents_v1"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    -- Allow access to personal documents
    (SPLIT_PART(name, '/', 1) = 'personal' AND auth.uid()::text = SPLIT_PART(name, '/', 2))
    OR
    -- Allow access to project documents
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = SPLIT_PART(name, '/', 1)
      AND projects.user_id = auth.uid()
    )
  )
);

-- Create policy for uploading documents with unique name
CREATE POLICY "storage_upload_documents_v1"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (
    -- Allow upload to personal documents
    (SPLIT_PART(name, '/', 1) = 'personal' AND auth.uid()::text = SPLIT_PART(name, '/', 2))
    OR
    -- Allow upload to project documents
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = SPLIT_PART(name, '/', 1)
      AND projects.user_id = auth.uid()
    )
  )
);

-- Create policy for deleting documents with unique name
CREATE POLICY "storage_delete_documents_v1"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    -- Allow deletion of personal documents
    (SPLIT_PART(name, '/', 1) = 'personal' AND auth.uid()::text = SPLIT_PART(name, '/', 2))
    OR
    -- Allow deletion of project documents
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = SPLIT_PART(name, '/', 1)
      AND projects.user_id = auth.uid()
    )
  )
);

-- Create policy for admin access with unique name
CREATE POLICY "storage_admin_access_documents_v1"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);