/*
  # Fix recursive profiles RLS policy

  1. Changes
    - Drop the recursive admin policy that was causing infinite recursion
    - Create a new admin policy that checks the role directly without recursion
  
  2. Security
    - Maintains RLS security by ensuring admins can still read all profiles
    - Preserves existing user-specific policies
*/

-- Drop the problematic policy that was causing recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Create new policy that checks role directly without recursion
CREATE POLICY "Admins can read all profiles" 
ON profiles
FOR SELECT
TO public
USING (
  auth.jwt() ->> 'role' = 'admin'
);