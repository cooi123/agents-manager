/*
  # Create transactions table

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `service_id` (uuid, references services)
      - `user_id` (uuid, references auth.users)
      - `document_id` (uuid)
      - `custom_input` (text)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `project_id` (uuid, references projects)
      - `result` (jsonb)

  2. Security
    - Enable RLS
    - Users can read their own transactions
    - Users can create transactions
    - Admins have full access
*/

-- Create function to check document existence
CREATE OR REPLACE FUNCTION check_transaction_document_exists(doc_id uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM documents WHERE id = doc_id
    UNION
    SELECT 1 FROM personal_documents WHERE id = doc_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id uuid,
  custom_input text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  result jsonb,
  CONSTRAINT check_document_exists CHECK (
    document_id IS NULL OR 
    check_transaction_document_exists(document_id)
  )
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_project_id ON transactions(project_id);

-- RLS Policies

-- Users can read their own transactions
CREATE POLICY "Users can read own transactions"
ON transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create transactions
CREATE POLICY "Users can create transactions"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins have full access
CREATE POLICY "Admins have full access to transactions"
ON transactions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);