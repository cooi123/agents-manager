-- Create project_services table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.project_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, service_id)
);

-- Add indexes for performance
CREATE INDEX idx_project_services_project_id ON public.project_services(project_id);
CREATE INDEX idx_project_services_service_id ON public.project_services(service_id);

-- Set up RLS policies
ALTER TABLE public.project_services ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own project services
CREATE POLICY "Users can view their own project services"
  ON public.project_services
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Allow users to manage their own project services
CREATE POLICY "Users can insert their own project services"
  ON public.project_services
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own project services"
  ON public.project_services
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );