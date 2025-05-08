import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../services/supabase';
import type { Database } from '../types/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type ProjectWithServices = Project & {
  services: Service[];
};
interface ProjectState {
  projects: Project[];
  currentProject: ProjectWithServices | null;
  personalProject: Project | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;

  // New service relationship functions
  fetchProjectServices: (projectId: string) => Promise<Service[]>;
  addServiceToProject: (projectId: string, serviceId: string) => Promise<boolean>;
  removeServiceFromProject: (projectId: string, serviceId: string) => Promise<boolean>;
  updateProjectServices: (projectId: string, serviceIds: string[]) => Promise<boolean>;

  // New method for personal project
  fetchPersonalProject: () => Promise<Project | null>;

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
        // Return cached personal project if it exists
        if (personalProject) return personalProject;

        set({ loading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .eq('project_type', 'personal')
            .single();

          if (error) throw error;
          
          set({ personalProject: data, loading: false });
          return data;
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
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          set({ currentProject: data, loading: false });
          return data;
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

          // Transform the nested data structure and cast to Service type
          return (data?.map(item => item.service) || []) as unknown as Service[];
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
          // First remove all existing associations
          await supabase
            .from('project_services')
            .delete()
            .eq('project_id', projectId);

          // Then add all selected services
          if (serviceIds.length > 0) {
            const projectServices = serviceIds.map(serviceId => ({
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