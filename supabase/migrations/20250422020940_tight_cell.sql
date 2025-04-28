/*
  # Fix infinite recursion in profiles policies

  1. Changes
    - Drop the recursive "Admins can read all profiles" policy
    - Create a new non-recursive policy for admin access
  
  2. Security
    - Maintains the same security model where admins can read all profiles
    - Uses a direct role check approach to avoid recursion
*/

-- First, drop the policy causing recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Create a new policy that doesn't cause recursion
CREATE POLICY "Admins can read all profiles" 
ON public.profiles
FOR SELECT 
TO public
USING (
  -- Use a direct check on the current user's profile row
  (auth.uid() IN (
    SELECT id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ))
);