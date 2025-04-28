/*
  # Initial Schema for Document Management System

  1. New Tables
    - `profiles` - Stores user profile information including their role
    - `projects` - Stores project information
    - `documents` - Stores document metadata
  
  2. Security
    - Enable RLS on all tables
    - Set up policies for each table based on user role and ownership
*/

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Create profiles table for users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  filename TEXT NOT NULL,
  filesize INTEGER NOT NULL,
  mimetype TEXT NOT NULL,
  path TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Projects policies
CREATE POLICY "Users can read own projects"
  ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all projects"
  ON projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Documents policies
CREATE POLICY "Users can read own documents"
  ON documents
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own documents"
  ON documents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all documents"
  ON documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Storage policies
CREATE POLICY "Users can upload documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can download own documents"
  ON storage.objects
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    bucket_id = 'documents' AND
    (
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can access all documents"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );