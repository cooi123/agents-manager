/*
  # Update service usage foreign key constraints

  1. Changes
    - Drop existing foreign key constraint that only references personal_documents
    - Add new foreign key constraint that allows referencing either documents or personal_documents
    - Add check constraint to ensure document_id references a valid document in either table

  2. Security
    - Maintain existing RLS policies
*/

-- Drop the existing foreign key constraint
ALTER TABLE service_usage
DROP CONSTRAINT IF EXISTS service_usage_document_id_fkey;

-- Add a function to validate document existence
CREATE OR REPLACE FUNCTION check_document_exists(doc_id uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM personal_documents WHERE id = doc_id
    UNION
    SELECT 1 FROM documents WHERE id = doc_id
  );
END;
$$ LANGUAGE plpgsql;

-- Add a check constraint using the function
ALTER TABLE service_usage
ADD CONSTRAINT check_document_exists
CHECK (
  document_id IS NULL OR 
  check_document_exists(document_id)
);