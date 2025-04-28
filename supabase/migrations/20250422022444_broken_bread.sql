/*
  # Fix Documents RLS Policies

  1. Changes
    - Create comprehensive RLS policies for documents table
    - Enable proper access control for document operations
    - Fix permission issues causing 403 errors

  2. Security
    - Ensure users can only access their own documents
    - Allow project owners to access project documents
    - Grant admin users full access
*/

-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for document insertion
CREATE POLICY "Enable document creation for project owners"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND projects.user_id = auth.uid()
  )
);

-- Create policy for document reading
CREATE POLICY "Enable document access for owners and project owners"
ON documents
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND projects.user_id = auth.uid()
  )
);

-- Create policy for document deletion
CREATE POLICY "Enable document deletion for owners and project owners"
ON documents
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND projects.user_id = auth.uid()
  )
);

-- Create policy for admin access
CREATE POLICY "Enable admin access to documents"
ON documents
FOR ALL
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