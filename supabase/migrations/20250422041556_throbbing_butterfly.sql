/*
  # Add Services Management
  
  1. New Tables
    - `services`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `url` (text, required)
      - `description` (text)
      - `instructions` (text)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)
  
  2. Security
    - Enable RLS on services table
    - Add policies for admin access
*/

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  description text,
  instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable admin access to services"
  ON services
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));