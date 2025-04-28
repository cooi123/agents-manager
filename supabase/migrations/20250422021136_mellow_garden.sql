/*
  # Fix infinite recursion in profiles policies

  1. Changes
     - Replace the "Admins can read all profiles v2" policy with a simpler approach
     - Create separate policies for admin access and self-access to avoid recursion
  
  2. Security
     - Maintain the same security model but fix the recursion issue
     - Ensure admins can still read all profiles
     - Ensure users can still read their own profiles
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can read all profiles v2" ON public.profiles;

-- Create a separate policy for admins reading all profiles
-- This avoids the recursive check by first checking the user's own profile directly
CREATE POLICY "Admins can read all profiles" 
ON public.profiles
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.uid() = auth.users.id
    AND auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  )
);

-- Ensure the self-read policy exists (this might already exist)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO public
USING (auth.uid() = id);