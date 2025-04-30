/*
  # Remove foreign key constraints

  1. Changes
    - Drop all foreign key constraints from tables
    - Keep primary keys and check constraints
    - Maintain table structure without referential integrity
*/

-- Drop foreign keys from service_usage
ALTER TABLE service_usage
DROP CONSTRAINT IF EXISTS service_usage_service_id_fkey,
DROP CONSTRAINT IF EXISTS service_usage_user_id_fkey;

-- Drop foreign keys from transactions
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_service_id_fkey,
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey,
DROP CONSTRAINT IF EXISTS transactions_project_id_fkey;

-- Drop foreign keys from documents
ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_project_id_fkey,
DROP CONSTRAINT IF EXISTS documents_user_id_fkey;

-- Drop foreign keys from personal_documents
ALTER TABLE personal_documents
DROP CONSTRAINT IF EXISTS personal_documents_user_id_fkey;

-- Drop foreign keys from projects
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- Drop foreign keys from profiles
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;