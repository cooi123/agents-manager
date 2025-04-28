import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Database } from '../types/database.types';

type Service = Database['public']['Tables']['services']['Row'];

interface ServiceState {
  services: Service[];
  loading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  createService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<Service | null>;
  updateService: (id: string, updates: Partial<Service>) => Promise<Service | null>;
  deleteService: (id: string) => Promise<boolean>;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  services: [],
  loading: false,
  error: null,

  fetchServices: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ services: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createService: async (service) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single();

      if (error) throw error;

      const { services } = get();
      set({ 
        services: [data, ...services],
        loading: false 
      });
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateService: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('services')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const { services } = get();
      set({
        services: services.map(s => s.id === id ? data : s),
        loading: false
      });
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  deleteService: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const { services } = get();
      set({
        services: services.filter(s => s.id !== id),
        loading: false
      });
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  }
}));