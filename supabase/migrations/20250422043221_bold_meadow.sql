/*
  # Add personal documents table and policies

  1. New Tables
    - `personal_documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `filename` (text)
      - `filesize` (integer)
      - `mimetype` (text)
      - `path` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Users can only access their own documents
    - Full CRUD access for document owners
*/

CREATE TABLE personal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  filesize integer NOT NULL,
  mimetype text NOT NULL,
  path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE personal_documents ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own documents
CREATE POLICY "Users can read own documents"
  ON personal_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own documents
CREATE POLICY "Users can insert own documents"
  ON personal_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own documents
CREATE POLICY "Users can update own documents"
  ON personal_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own documents
CREATE POLICY "Users can delete own documents"
  ON personal_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);