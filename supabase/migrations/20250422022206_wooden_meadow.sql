/*
  # Fix Documents RLS Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Re-create policies with correct permissions
    - Ensure users can upload and access documents appropriately

  2. Security
    - Enable RLS on documents table
    - Add policies for document management
    - Restrict access based on project ownership
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents to own projects" ON documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow users to insert documents to their own projects
CREATE POLICY "Users can insert documents to own projects"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = documents.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Allow users to read documents they own or in projects they own
CREATE POLICY "Users can read own documents"
ON documents
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = documents.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Allow admins to manage all documents
CREATE POLICY "Admins can manage all documents"
ON documents
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);