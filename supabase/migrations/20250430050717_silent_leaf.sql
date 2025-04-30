/*
  # Remove status check constraint from transactions table

  1. Changes
    - Drop the status check constraint from transactions table
    - Keep the status column and its default value
*/

-- Drop the status check constraint
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_status_check;