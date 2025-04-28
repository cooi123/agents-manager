/*
  # Fix Documents RLS Policies

  1. Changes
    - Drop existing RLS policies for documents table
    - Add new RLS policies that properly handle:
      - Document owners can manage their documents
      - Users can access documents in projects they own
      - Admins can manage all documents
  
  2. Security
    - Ensures proper access control for documents
    - Maintains admin access
    - Protects documents based on project ownership
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;
DROP POLICY IF EXISTS "Admins can read all documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents to own projects" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can upload documents to own projects" ON documents;
DROP POLICY IF EXISTS "Users can view documents in own projects" ON documents;

-- Create new consolidated policies
CREATE POLICY "Enable full access for admins"
ON documents
AS PERMISSIVE
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

CREATE POLICY "Enable read access for document owners and project owners"
ON documents
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = documents.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Enable insert for own documents in owned projects"
ON documents
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = documents.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Enable delete for document owners and project owners"
ON documents
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = documents.project_id
    AND projects.user_id = auth.uid()
  )
);