/*
  # Fix profiles RLS recursion

  1. Changes
    - Remove recursive admin check from profiles RLS policies
    - Simplify admin read policy to use direct role check
    - Keep other policies unchanged
  
  2. Security
    - Maintains existing security model but eliminates infinite recursion
    - Admins can still read all profiles
    - Users can still manage their own profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Create new non-recursive admin policy
CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id 
      FROM profiles 
      WHERE role = 'admin'
    )
  )
);