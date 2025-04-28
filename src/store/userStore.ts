import { create } from 'zustand';
import { supabase } from '../services/supabase';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
};

type UserState = {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
};

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,
  
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ users: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));