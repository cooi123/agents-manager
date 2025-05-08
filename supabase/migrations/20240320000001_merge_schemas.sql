-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Create profiles table for users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users,
    project_type TEXT CHECK (project_type IN ('personal', 'team')) DEFAULT 'team' NOT NULL
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    instructions TEXT
);

-- Create project_services junction table
CREATE TABLE IF NOT EXISTS project_services (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, service_id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    filename TEXT NOT NULL,
    filesize INTEGER NOT NULL,
    mimetype TEXT NOT NULL,
    path TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    task_id UUID,
    user_id UUID NOT NULL REFERENCES auth.users,
    project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services ON DELETE CASCADE,
    task_type TEXT CHECK (task_type IN ('task', 'subtask')) NOT NULL,
    input_data JSONB NOT NULL,
    input_document_urls TEXT[] NOT NULL DEFAULT '{}',
    status TEXT CHECK (status IN ('received', 'pending', 'running', 'completed', 'failed')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    result_payload JSONB,
    result_document_urls TEXT[],
    error_message TEXT
);

-- Create usages table
CREATE TABLE IF NOT EXISTS usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users,
    project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions ON DELETE CASCADE,
    resources_used JSONB NOT NULL,
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER,
    runtime_ms INTEGER,
    resources_used_count INTEGER NOT NULL,
    resources_used_cost DECIMAL(10,2) NOT NULL,
    resource_type TEXT CHECK (resource_type IN ('llm', 'embedding', 'storage', 'processing')) NOT NULL,
    model_name TEXT
);

-- Grant basic permissions to all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create indexes for better query performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_transactions_service_id ON transactions(service_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_usages_user_id ON usages(user_id);
CREATE INDEX idx_usages_project_id ON usages(project_id);
CREATE INDEX idx_usages_service_id ON usages(service_id);
CREATE INDEX idx_usages_transaction_id ON usages(transaction_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_services ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Enable read access for all users"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can read own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- Project Services policies
CREATE POLICY "Users can read own project services"
    ON project_services FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_services.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own project services"
    ON project_services FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_services.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own project services"
    ON project_services FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_services.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Services policies
CREATE POLICY "Enable read access for all users"
    ON services FOR SELECT
    USING (true);

-- Documents policies
CREATE POLICY "Users can read own documents"
    ON documents FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()
        )
    );

-- Storage policies
CREATE POLICY "Users can upload documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        bucket_id = 'documents' AND
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can download own documents"
    ON storage.objects
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        bucket_id = 'documents' AND
        (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM projects WHERE user_id = auth.uid()
            )
        )
    );
