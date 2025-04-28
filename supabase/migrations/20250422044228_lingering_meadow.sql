/*
  # Add service usage tracking

  1. New Tables
    - `service_usage`
      - `id` (uuid, primary key)
      - `service_id` (uuid, references services)
      - `user_id` (uuid, references users)
      - `document_id` (uuid, references personal_documents)
      - `created_at` (timestamp)
      - `custom_input` (text)
      - `status` (text)

  2. Security
    - Enable RLS on service_usage table
    - Allow users to read their own usage records
    - Allow users to create usage records
    - Allow admins full access
*/

-- Create service usage table
CREATE TABLE service_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES personal_documents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  custom_input text,
  status text DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE service_usage ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own usage records
CREATE POLICY "Users can read own service usage"
  ON service_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create usage records
CREATE POLICY "Users can create service usage records"
  ON service_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow admins full access
CREATE POLICY "Admins have full access to service usage"
  ON service_usage
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));