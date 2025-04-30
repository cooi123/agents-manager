import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Database } from '../types/database.types';
import { useAuthStore } from './authStore';

type Project = Database['public']['Tables']['projects']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type ProjectWithServices = Project & {
  services: Service[];
};
interface ProjectState {
  projects: Project[];
  currentProject: ProjectWithServices | null;
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (project: Omit<Project, 'id' | 'created_at'>) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;

  // New service relationship functions
  fetchProjectServices: (projectId: string) => Promise<Service[]>;
  addServiceToProject: (projectId: string, serviceId: string) => Promise<boolean>;
  removeServiceFromProject: (projectId: string, serviceId: string) => Promise<boolean>;
  updateProjectServices: (projectId: string, serviceIds: string[]) => Promise<boolean>;
}


export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

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
        : error.message || 'Failed to fetch projects';

      console.error('Error fetching projects:', {
        error,
        userId: useAuthStore.getState().user?.id
      });

      set({ error: errorMessage, loading: false });
    }
  },

  fetchAllProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
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
      // Validate project ID
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Invalid project ID');
      }

      // Validate user authentication
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Test Supabase connection first
      try {
        await supabase.from('projects').select('count').limit(1);
      } catch (error: any) {
        throw new Error('Unable to connect to Supabase. Please check your connection and try again.');
      }

      // Attempt to fetch the project
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id.trim())
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Project not found');
        }
        throw error;
      }

      if (!data) {
        set({ currentProject: null, loading: false });
        throw new Error('Project not found');
      }

      const services = await get().fetchProjectServices(id);

      set({ currentProject: {...data, services}, loading: false });
      return data;
    } catch (error: any) {
      console.error('Error fetching project:', {
        error,
        projectId: id,
        userId: useAuthStore.getState().user?.id
      });

      const errorMessage = error.message === 'Failed to fetch'
        ? 'Unable to connect to Supabase. Please check your connection and try again.'
        : error.message;

      set({
        error: errorMessage,
        loading: false,
        currentProject: null
      });
      return null;
    }
  }, 
  fetchProjectServices: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_services')
        .select('services(*)')
        .eq('project_id', projectId);

      if (error) throw error;

      // Extract services from the join table results
      return data.map(item => item.services) as Service[];
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
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({ name, description, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      const { projects } = get();
      set({
        projects: [data, ...projects],
        loading: false
      });
      return data;
    } catch (error: any) {
      const errorMessage = error.message === 'Failed to fetch'
        ? 'Unable to connect to Supabase. Please check your connection and try again.'
        : error.message || 'Failed to create project';

      console.error('Error creating project:', error);
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  updateProject: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      if (!id) {
        throw new Error('Project ID is required');
      }

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
      const errorMessage = error.message === 'Failed to fetch'
        ? 'Unable to connect to Supabase. Please check your connection and try again.'
        : error.message || 'Failed to update project';

      console.error('Error updating project:', error);
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      if (!id) {
        throw new Error('Project ID is required');
      }

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
      const errorMessage = error.message === 'Failed to fetch'
        ? 'Unable to connect to Supabase. Please check your connection and try again.'
        : error.message || 'Failed to delete project';

      console.error('Error deleting project:', error);
      set({ error: errorMessage, loading: false });
      return false;
    }
  }
}));