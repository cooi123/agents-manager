/*
  # Remove RLS policies from all tables

  1. Changes
    - Disable RLS on all tables
    - Drop all existing policies
    - Keep table structures and relationships intact
*/

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Drop all policies from profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Drop all policies from projects
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Drop all policies from documents
DROP POLICY IF EXISTS "Enable document creation for project owners" ON documents;
DROP POLICY IF EXISTS "Enable document access for owners and project owners" ON documents;
DROP POLICY IF EXISTS "Enable document deletion for owners and project owners" ON documents;
DROP POLICY IF EXISTS "Enable admin access to documents" ON documents;

-- Drop all policies from personal_documents
DROP POLICY IF EXISTS "Users can read own documents" ON personal_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON personal_documents;
DROP POLICY IF EXISTS "Users can update own documents" ON personal_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON personal_documents;

-- Drop all policies from services
DROP POLICY IF EXISTS "Enable read access to services for all users" ON services;
DROP POLICY IF EXISTS "Enable admin write access to services" ON services;

-- Drop all policies from service_usage
DROP POLICY IF EXISTS "Users can read own service usage" ON service_usage;
DROP POLICY IF EXISTS "Users can create service usage records" ON service_usage;
DROP POLICY IF EXISTS "Admins have full access to service usage" ON service_usage;

-- Drop all policies from transactions
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Admins have full access to transactions" ON transactions;

-- Drop all storage policies
DROP POLICY IF EXISTS "storage_read_documents_v1" ON storage.objects;
DROP POLICY IF EXISTS "storage_upload_documents_v1" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_documents_v1" ON storage.objects;
DROP POLICY IF EXISTS "storage_admin_access_documents_v1" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access to personal documents" ON storage.objects;