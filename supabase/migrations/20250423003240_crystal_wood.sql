/*
  # Fix service usage relationships and add result field

  1. Changes
    - Add result field to store service response
    - Fix foreign key relationship with profiles table
    - Add indexes for better query performance
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add result field if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_usage' 
    AND column_name = 'result'
  ) THEN
    ALTER TABLE service_usage ADD COLUMN result jsonb;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'service_usage_user_id_fkey'
  ) THEN
    ALTER TABLE service_usage 
    ADD CONSTRAINT service_usage_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on user_id for better join performance
CREATE INDEX IF NOT EXISTS idx_service_usage_user_id ON service_usage(user_id);

-- Create index on created_at for better sorting performance
CREATE INDEX IF NOT EXISTS idx_service_usage_created_at ON service_usage(created_at);