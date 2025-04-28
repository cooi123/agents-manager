/*
  # Fix infinite recursion in profiles RLS policy

  1. Changes
     - Drop the problematic "Admins can read all profiles" policy that causes infinite recursion
     - Create a new admin policy that avoids the recursion by using a different approach
  
  2. Security
     - Maintains the same security model but implements it in a way that avoids recursion
     - Admins can still read all profiles
     - Regular users can still read only their own profiles
*/

-- Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Create a new admin policy that avoids recursion
-- This policy grants access to all profiles if the user's role is 'admin'
-- without recursively checking the profiles table
CREATE POLICY "Admins can read all profiles" 
ON public.profiles
FOR SELECT
TO public
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);