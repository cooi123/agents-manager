/*
  # Project and Document Management Schema

  1. New Tables
    - projects
      - id (uuid, primary key)
      - name (text)
      - description (text, nullable)
      - user_id (uuid, references auth.users)
      - created_at (timestamp with time zone)
    
    - documents
      - id (uuid, primary key)
      - filename (text)
      - filesize (integer)
      - mimetype (text)
      - path (text)
      - project_id (uuid, references projects)
      - user_id (uuid, references auth.users)
      - created_at (timestamp with time zone)

  2. Security
    - Enable RLS on both tables
    - Set up policies for user access control
    - Cascade deletion from projects to documents
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  filesize integer NOT NULL,
  mimetype text NOT NULL,
  path text NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Project policies
CREATE POLICY "Users can create own projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own projects"
ON projects
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON projects
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON projects
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Document policies
CREATE POLICY "Users can upload documents to own projects"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view documents in own projects"
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

CREATE POLICY "Users can delete own documents"
ON documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);