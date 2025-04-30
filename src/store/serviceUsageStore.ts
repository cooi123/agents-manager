import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface Transaction {
  id: string;
  service_id: string;
  user_id: string;
  document_id: string | null;
  created_at: string;
  custom_input: string | null;
  status: string;
  result: any;
  document_url: string | null;
  service_url: string | null;
  project_id: string | null;
  completed_at: string | null;
}

interface TransactionState {
  usageRecords: Transaction[];
  loading: boolean;
  error: string | null;
  createUsageRecord: (
    serviceId: string,
    documentId: string | null,
    customInput: string | null,
    result: any,
    documentUrl?: string | null,
    serviceUrl?: string | null,
    projectId?: string | null
  ) => Promise<Transaction | null>;
  fetchUsageRecords: () => Promise<void>;
}

export const useServiceUsageStore = create<TransactionState>((set, get) => ({
  usageRecords: [],
  loading: false,
  error: null,

  createUsageRecord: async (serviceId, documentId, customInput, result, documentUrl, serviceUrl, projectId) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create the record with completed status since we have the result
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          service_id: serviceId,
          user_id: user.id,
          document_id: documentId,
          custom_input: customInput,
          result: result,
          status: 'completed',
          document_url: documentUrl,
          service_url: serviceUrl,
          project_id: projectId,
          completed_at: new Date().toISOString()
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
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ usageRecords: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));