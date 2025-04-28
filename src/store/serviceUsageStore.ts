import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface ServiceUsage {
  id: string;
  service_id: string;
  user_id: string;
  document_id: string | null;
  created_at: string;
  custom_input: string | null;
  status: string;
  result: any;
}

interface ServiceUsageState {
  usageRecords: ServiceUsage[];
  loading: boolean;
  error: string | null;
  createUsageRecord: (
    serviceId: string,
    documentId: string | null,
    customInput: string | null,
    result: any
  ) => Promise<ServiceUsage | null>;
  fetchUsageRecords: () => Promise<void>;
}

export const useServiceUsageStore = create<ServiceUsageState>((set, get) => ({
  usageRecords: [],
  loading: false,
  error: null,

  createUsageRecord: async (serviceId, documentId, customInput, result) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('service_usage')
        .insert({
          service_id: serviceId,
          user_id: user.id,
          document_id: documentId,
          custom_input: customInput,
          result: result,
        })
        .select()
        .single();

      if (error) throw error;

      const { usageRecords } = get();
      set({ 
        usageRecords: [data, ...usageRecords],
        loading: false 
      });
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  fetchUsageRecords: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('service_usage')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ usageRecords: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));