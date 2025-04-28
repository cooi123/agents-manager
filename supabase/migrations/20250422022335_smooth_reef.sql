/*
  # Fix Documents RLS Policies

  1. Changes
    - Drop existing RLS policies for documents table
    - Create new comprehensive RLS policies for:
      - Document creation
      - Document reading
      - Document deletion
      - Admin access
  
  2. Security
    - Ensures proper access control for documents
    - Maintains data isolation between users
    - Provides admin override capabilities
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Enable delete for document owners and project owners" ON documents;
DROP POLICY IF EXISTS "Enable full access for admins" ON documents;
DROP POLICY IF EXISTS "Enable insert for own documents in owned projects" ON documents;
DROP POLICY IF EXISTS "Enable read access for document owners and project owners" ON documents;
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents to own projects" ON documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;

-- Create new policies with proper access controls
CREATE POLICY "Enable insert for document owners"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Enable read for document owners and project owners"
ON documents
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Enable delete for document owners and project owners"
ON documents
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Enable admin access"
ON documents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);