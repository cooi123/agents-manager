/*
  # Add document_url column to transactions table

  1. Changes
    - Add document_url column to store the URL of the document being processed
    - Make it nullable since some transactions might not have a document URL
  
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE transactions
ADD COLUMN document_url text;