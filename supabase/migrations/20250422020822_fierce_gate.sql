/*
  # Fix profiles table RLS policies

  1. Changes
     - Add policy to allow authenticated users to insert their own profile record
     - This fixes the registration flow where new users need to create their profile

  2. Security
     - Maintains existing RLS on the profiles table
     - Only allows users to insert their own profile (matching their auth.uid)
*/

-- Add policy to allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);