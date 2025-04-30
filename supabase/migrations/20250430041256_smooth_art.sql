/*
  # Remove risk policy from transactions table

  1. Changes
    - Drop the risk policy from transactions table
    - Keep other policies intact
  
  2. Security
    - Maintain existing RLS security model
    - Users can still read their own transactions
    - Admins retain full access
*/

-- Drop the risk policy
DROP POLICY IF EXISTS "Risk policy" ON transactions;

-- Ensure other policies exist
DO $$ 
BEGIN
  -- Check and recreate user read policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transactions' 
    AND policyname = 'Users can read own transactions'
  ) THEN
    CREATE POLICY "Users can read own transactions"
    ON transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  -- Check and recreate user create policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transactions' 
    AND policyname = 'Users can create transactions'
  ) THEN
    CREATE POLICY "Users can create transactions"
    ON transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and recreate admin policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transactions' 
    AND policyname = 'Admins have full access to transactions'
  ) THEN
    CREATE POLICY "Admins have full access to transactions"
    ON transactions
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;