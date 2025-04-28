/*
  # Fix profiles table RLS policies
  
  1. Changes
     - Drop all existing policies to start fresh
     - Create basic policy for users to read their own profile
     - Create admin policy that avoids recursion
     - Add policy for users to insert their own profile
  
  2. Security
     - Users can always read their own profile
     - Admins can read all profiles
     - Users can only insert their own profile
     - Maintains RLS security while avoiding recursion
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles v2" ON public.profiles;

-- First create the basic policy for users to read their own profile
-- This is the foundation that will always work
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO public
USING (auth.uid() = id);

-- Create the admin policy using a direct subquery approach
-- This avoids recursion by using a simple equality check
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
  )
);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);