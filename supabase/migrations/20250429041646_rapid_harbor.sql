/*
  # Align document tables schema

  1. Changes
    - Add description column to both tables
    - Add performance indexes
    - Add table and column documentation
  
  2. Security
    - No security changes
*/

-- Add description column to both tables
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE personal_documents
ADD COLUMN IF NOT EXISTS description text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_created_at 
ON documents(created_at);

CREATE INDEX IF NOT EXISTS idx_documents_user_id 
ON documents(user_id);

CREATE INDEX IF NOT EXISTS idx_personal_documents_created_at 
ON personal_documents(created_at);

CREATE INDEX IF NOT EXISTS idx_personal_documents_user_id 
ON personal_documents(user_id);

-- Add comments to document both tables' structures
COMMENT ON TABLE documents IS 'Project-related documents uploaded by users';
COMMENT ON TABLE personal_documents IS 'Personal documents uploaded by users';

-- Add column comments
COMMENT ON COLUMN documents.id IS 'Unique identifier for the document';
COMMENT ON COLUMN documents.created_at IS 'Timestamp when the document was created';
COMMENT ON COLUMN documents.filename IS 'Original filename of the uploaded document';
COMMENT ON COLUMN documents.filesize IS 'Size of the document in bytes';
COMMENT ON COLUMN documents.mimetype IS 'MIME type of the document';
COMMENT ON COLUMN documents.path IS 'Storage path where the document is stored';
COMMENT ON COLUMN documents.project_id IS 'Reference to the project this document belongs to';
COMMENT ON COLUMN documents.user_id IS 'Reference to the user who uploaded the document';
COMMENT ON COLUMN documents.description IS 'Optional description of the document';

COMMENT ON COLUMN personal_documents.id IS 'Unique identifier for the personal document';
COMMENT ON COLUMN personal_documents.created_at IS 'Timestamp when the document was created';
COMMENT ON COLUMN personal_documents.filename IS 'Original filename of the uploaded document';
COMMENT ON COLUMN personal_documents.filesize IS 'Size of the document in bytes';
COMMENT ON COLUMN personal_documents.mimetype IS 'MIME type of the document';
COMMENT ON COLUMN personal_documents.path IS 'Storage path where the document is stored';
COMMENT ON COLUMN personal_documents.user_id IS 'Reference to the user who uploaded the document';
COMMENT ON COLUMN personal_documents.description IS 'Optional description of the document';