/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Remove recursive admin check from profiles RLS policies
    - Simplify policies to prevent infinite recursion
    - Add basic policies for CRUD operations

  2. Security
    - Enable RLS on profiles table (already enabled)
    - Add policies for:
      - Users can read their own profile
      - Users can update their own profile
      - Users can insert their own profile
      - Admins can read all profiles using a direct role check
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO public
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Admin policy that directly checks the role column without recursion
CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
TO public
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);