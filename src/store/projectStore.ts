import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../services/supabase';
import type { Database } from '../types/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type ProjectService = Database['public']['Tables']['project_services']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

type ServiceUsage = {
  total_transactions: number;
  total_tokens: number;
  total_cost: number;
  last_used_at: string | null;
};

type ProjectWithServices = Project & {
  services: (Service & {
    usage: ServiceUsage;
  })[];
};

interface ProjectState {
  projects: Project[];
  currentProject: ProjectWithServices | null;
  personalProject: ProjectWithServices | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<ProjectWithServices | null>;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;

  // Updated service relationship functions
  fetchProjectServices: (projectId: string) => Promise<(Service & { usage: ServiceUsage })[]>;
  addServiceToProject: (projectId: string, serviceId: string) => Promise<boolean>;
  removeServiceFromProject: (projectId: string, serviceId: string) => Promise<boolean>;
  updateProjectServices: (projectId: string, serviceIds: string[]) => Promise<boolean>;
  fetchServiceTransactions: (projectId: string, serviceId: string) => Promise<Transaction[]>;

  // New method for personal project
  fetchPersonalProject: () => Promise<ProjectWithServices | null>;

  clearProjectData: () => void;
}


export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      personalProject: null,
      loading: false,
      error: null,
      lastFetched: null,

      fetchPersonalProject: async () => {
        const { personalProject } = get();
        set({ loading: true, error: null });
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          // If we don't have a personal project, find it first
          if (!personalProject) {
            const { data, error } = await supabase
              .from('projects')
              .select('id')
              .eq('user_id', user.id)
              .eq('project_type', 'personal')
              .single();

            if (error) throw error;
            
            // Now fetch the full project details
            const updatedPersonalProject = await get().fetchProject(data.id);
            set({ personalProject: updatedPersonalProject, loading: false });
            return updatedPersonalProject;
          }

          // If we already have the personal project, just refresh it
          const updatedPersonalProject = await get().fetchProject(personalProject.id);
          set({ personalProject: updatedPersonalProject, loading: false });
          return updatedPersonalProject;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          return null;
        }
      },

      fetchProjects: async () => {
        //to rehydrate the project store
        

        set({ loading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .neq('project_type', 'personal') // Exclude personal project
            .order('created_at', { ascending: false });
          if (error) throw error;
          set({ projects: data || [], loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchAllProjects: async () => {
        set({ loading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          set({ projects: data || [], loading: false });
        } catch (error: any) {
          const errorMessage = error.message === 'Failed to fetch'
            ? 'Unable to connect to Supabase. Please check your connection and try again.'
            : error.message || 'Failed to fetch all projects';

          console.error('Error fetching all projects:', error);
          set({ error: errorMessage, loading: false });
        }
      },

      fetchProject: async (id) => {
        set({ loading: true, error: null });
        try {
          // First fetch the project
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

          if (projectError) throw projectError;

          // Then fetch the project services with usage data
          const { data: projectServices, error: servicesError } = await supabase
            .from('project_services')
            .select(`
              *,
              service:services (
                id,
                created_at,
                updated_at,
                name,
                url,
                description,
                instructions
              )
            `)
            .eq('project_id', id);

          if (servicesError) throw servicesError;

          // Transform the data to include services with usage
          const services = projectServices?.map(item => ({
            ...item.service,
            usage: {
              total_transactions: item.total_resources_used_count || 0,
              total_tokens: item.total_tokens || 0,
              total_cost: item.total_resources_used_cost || 0,
              last_used_at: item.last_used_at
            }
          })) || [];

          const projectWithServices = {
            ...project,
            services
          };

          set({ currentProject: projectWithServices, loading: false });
          return projectWithServices;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          return null;
        }
      },

      fetchProjectServices: async (projectId: string) => {
        try {
          const { data, error } = await supabase
            .from('project_services')
            .select(`
              *,
              service:services (
                id,
                created_at,
                updated_at,
                name,
                url,
                description,
                instructions
              )
            `)
            .eq('project_id', projectId);

          if (error) throw error;

          // Transform the nested data structure and include usage data
          return (data?.map(item => ({
            ...item.service,
            usage: {
              total_transactions: item.total_resources_used_count || 0,
              total_tokens: item.total_tokens || 0,
              total_cost: item.total_resources_used_cost || 0,
              last_used_at: item.last_used_at
            }
          })) || []) as (Service & { usage: ServiceUsage })[];
        } catch (error: any) {
          set({ error: error.message });
          return [];
        }
      },

      fetchServiceTransactions: async (projectId: string, serviceId: string) => {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('project_id', projectId)
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data || [];
        } catch (error: any) {
          set({ error: error.message });
          return [];
        }
      },

      addServiceToProject: async (projectId: string, serviceId: string) => {
        try {
          const { error } = await supabase
            .from('project_services')
            .insert({ project_id: projectId, service_id: serviceId });

          if (error) throw error;

          // Update current project's services
          const { currentProject } = get();
          if (currentProject && currentProject.id === projectId) {
            const services = await get().fetchProjectServices(projectId);
            set({ currentProject: { ...currentProject, services } });
          }

          return true;
        } catch (error: any) {
          set({ error: error.message });
          return false;
        }
      },

      removeServiceFromProject: async (projectId: string, serviceId: string) => {
        try {
          const { error } = await supabase
            .from('project_services')
            .delete()
            .eq('project_id', projectId)
            .eq('service_id', serviceId);

          if (error) throw error;

          // Update current project's services
          const { currentProject } = get();
          if (currentProject && currentProject.id === projectId) {
            const services = await get().fetchProjectServices(projectId);
            set({ currentProject: { ...currentProject, services } });
          }

          return true;
        } catch (error: any) {
          set({ error: error.message });
          return false;
        }
      },

      updateProjectServices: async (projectId: string, serviceIds: string[]) => {
        try {
          //create new project services for the service that are not already in the project
          const existingProjectServices = await get().fetchProjectServices(projectId);
          const newServiceIds = serviceIds.filter(serviceId => !existingProjectServices.some(service => service.id === serviceId));

          if (newServiceIds.length > 0) {
            const projectServices = newServiceIds.map(serviceId => ({
              project_id: projectId,
              service_id: serviceId
            }));

            const { error } = await supabase
              .from('project_services')
              .insert(projectServices);

            if (error) throw error;
          }

          // Update current project's services
          const { currentProject } = get();
          if (currentProject && currentProject.id === projectId) {
            const services = await get().fetchProjectServices(projectId);
            set({ currentProject: { ...currentProject, services } });
          }

          return true;
        } catch (error: any) {
          set({ error: error.message });
          return false;
        }
      },

      createProject: async (name, description) => {
        set({ loading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('projects')
            .insert({
              name,
              description,
              user_id: user.id,
              project_type: 'team'
            })
            .select()
            .single();

          if (error) throw error;

          // Update personal project if this is a personal project
          if (data.project_type === 'personal') {
            set({ personalProject: data });
          } else {
            const { projects } = get();
            set({ projects: [data, ...projects] });
          }
          
          set({ loading: false });
          return data;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          return null;
        }
      },

      updateProject: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const { projects } = get();
          set({
            projects: projects.map(p => p.id === id ? data : p),
            currentProject: data,
            loading: false
          });
          return data;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          return null;
        }
      },

      deleteProject: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

          if (error) throw error;

          const { projects } = get();
          set({
            projects: projects.filter(p => p.id !== id),
            loading: false
          });
          return true;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          return false;
        }
      },

      clearProjectData: () => {
        set({
          projects: [],
          currentProject: null,
          loading: false,
          error: null,
          lastFetched: null
        });
      }
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        projects: state.projects,
        currentProject: state.currentProject,
        personalProject: state.personalProject,
        lastFetched: state.lastFetched
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.fetchProjects();
        }
      }
    }
  )
);