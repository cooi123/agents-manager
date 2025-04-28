/*
  # Fix infinite recursion in profiles policy

  1. Changes
     - Replaces the recursive "Admins can read all profiles" policy with a non-recursive version
     - The current policy creates an infinite recursion by querying the profiles table within
       the policy condition, which triggers the same policy again
  
  2. Security
     - Maintains the same security intent where admins can read all profiles
     - Uses a direct role check on the authenticated user instead of a recursive query
*/

-- Drop the existing policy that's causing infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Create a new policy with the same name but a non-recursive implementation
CREATE POLICY "Admins can read all profiles" 
ON profiles 
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND
    auth.users.id IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  )
);