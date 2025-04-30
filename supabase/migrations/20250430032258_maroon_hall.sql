/*
  # Add service URL to transactions

  1. Changes
    - Add service_url column to transactions table
    - This column stores the URL of the service that was called
*/

ALTER TABLE transactions
ADD COLUMN service_url text;