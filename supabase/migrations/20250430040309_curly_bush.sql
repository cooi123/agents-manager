/*
  # Add status column to transactions table

  1. Changes
    - Add status column to transactions table
    - Set default value to 'pending'
    - Add check constraint to ensure valid status values
  
  2. Security
    - No security changes needed
*/

-- Add status column with default value
ALTER TABLE transactions
ADD COLUMN status text DEFAULT 'pending'::text;

-- Add check constraint for valid status values
ALTER TABLE transactions
ADD CONSTRAINT transactions_status_check
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Add comment to explain the column
COMMENT ON COLUMN transactions.status IS 'Current status of the transaction (pending, processing, completed, failed)';