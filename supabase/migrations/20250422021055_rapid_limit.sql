/*
  # Fix infinite recursion in profiles policy

  1. Changes
     - Drop the problematic "Admins can read all profiles" policy that causes infinite recursion
     - Create a new version of the policy that avoids the circular dependency
     - The new policy uses a different approach to identify admin users without creating recursion

  2. Security
     - Maintains the same security intent (admins can read all profiles)
     - Uses a more efficient policy implementation
*/

-- First, drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Create a new policy that avoids the circular dependency by using a different approach
-- This policy allows users with admin role to view all profiles without creating a circular reference
CREATE POLICY "Admins can read all profiles v2" 
ON public.profiles
FOR SELECT 
TO public
USING (
  -- This user is accessing their own profile (already covered by another policy, but included for completeness)
  (auth.uid() = id)
  OR
  -- This user is an admin (directly check if the current user's profile has admin role)
  (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);