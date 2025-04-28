/*
  # Update services table policies

  1. Changes
    - Add policy to allow all users to read services
    - Keep admin-only write access

  2. Security
    - Enable read access for all authenticated users
    - Maintain admin-only access for create/update/delete operations
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Enable admin access to services" ON services;

-- Create read policy for all authenticated users
CREATE POLICY "Enable read access to services for all users"
  ON services
  FOR SELECT
  TO authenticated
  USING (true);

-- Create admin-only write policy
CREATE POLICY "Enable admin write access to services"
  ON services
  FOR ALL
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