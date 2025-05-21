-- Create project_services table
CREATE TABLE IF NOT EXISTS public.project_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    total_tokens_input BIGINT DEFAULT 0 NOT NULL,
    total_tokens_output BIGINT DEFAULT 0 NOT NULL,
    total_tokens BIGINT DEFAULT 0 NOT NULL,
    total_runtime_ms BIGINT DEFAULT 0 NOT NULL,
    total_resources_used_count INTEGER DEFAULT 0 NOT NULL,
    total_resources_used_cost DECIMAL(10,2) DEFAULT 0 NOT NULL,
    last_used_at TIMESTAMPTZ,
    UNIQUE(project_id, service_id)
);

-- Add RLS policies for project_services
ALTER TABLE public.project_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project services for their projects"
    ON public.project_services
    FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert project services for their projects"
    ON public.project_services
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update project services for their projects"
    ON public.project_services
    FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete project services for their projects"
    ON public.project_services
    FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

-- Add new columns to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS resources_used JSONB DEFAULT '{}'::jsonb NOT NULL,
ADD COLUMN IF NOT EXISTS tokens_input INTEGER,
ADD COLUMN IF NOT EXISTS tokens_output INTEGER,
ADD COLUMN IF NOT EXISTS tokens_total INTEGER,
ADD COLUMN IF NOT EXISTS runtime_ms BIGINT,
ADD COLUMN IF NOT EXISTS resources_used_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS resources_used_cost DECIMAL(10,2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS resource_type TEXT CHECK (resource_type IN ('llm', 'embedding', 'storage', 'processing')),
ADD COLUMN IF NOT EXISTS model_name TEXT;


ALTER TABLE public.project_services
ADD COLUMN IF NOT EXISTS total_tokens_input BIGINT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_tokens_output BIGINT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_tokens BIGINT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_runtime_ms BIGINT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_resources_used_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_resources_used_cost DECIMAL(10,2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- Drop usages table
DROP TABLE IF EXISTS public.usages;

-- Create function to update project_services usage
CREATE OR REPLACE FUNCTION public.update_project_service_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update on completed transactions
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.project_services
        SET
            total_tokens =  total_tokens + COALESCE(NEW.tokens_total, 0),
            total_runtime_ms = total_runtime_ms + COALESCE(NEW.runtime_ms, 0),
            total_resources_used_count = total_resources_used_count + NEW.resources_used_count,
            total_resources_used_cost = total_resources_used_cost + NEW.resources_used_cost,
            last_used_at = NEW.updated_at,
            updated_at = now()
        WHERE project_id = NEW.project_id AND service_id = NEW.service_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update project_services usage
CREATE TRIGGER update_project_service_usage_trigger
    AFTER UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_service_usage(); 