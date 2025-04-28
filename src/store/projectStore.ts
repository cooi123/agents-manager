import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Database } from '../types/database.types';
import { useAuthStore } from './authStore';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchAllProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (name: string, description: string | null) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
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
      set({ error: error.message, loading: false });
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
      set({ error: error.message, loading: false });
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
  }
}));