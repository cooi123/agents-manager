import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../services/supabase';
import type { Database } from '../types/database.types';
import { useAuthStore } from './authStore';

type Profile = Database['public']['Tables']['profiles']['Row'];

type UserState = {
  users: Profile[];
  currentUser: Profile | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;  // Add timestamp for last fetch
  fetchUsers: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  updateUserRole: (userId: string, role: 'admin' | 'user') => Promise<boolean>;
  isAdmin: () => boolean;
  // Add method to check if data needs refresh
  shouldRefetch: () => boolean;
  clearUserData: () => void;  // Add this to the type
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      loading: false,
      error: null,
      lastFetched: null,

      shouldRefetch: () => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        // Refetch if data is older than 5 minutes
        return Date.now() - lastFetched > 5 * 60 * 1000;
      },

      fetchUsers: async () => {
        // Only fetch if data is stale or doesn't exist
        if (!get().shouldRefetch()) return;

        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          set({ 
            users: data || [], 
            loading: false,
            lastFetched: Date.now()
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchCurrentUser: async () => {
        // Only fetch if data is stale or doesn't exist
        if (!get().shouldRefetch()) return;

        set({ loading: true, error: null });
        try {
          const { user } = useAuthStore.getState();
          if (!user) throw new Error('No authenticated user');

          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          set({ 
            currentUser: data, 
            loading: false,
            lastFetched: Date.now()
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      updateUserRole: async (userId, role) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

          if (error) throw error;

          const { users, currentUser } = get();
          set({
            users: users.map(u => u.id === userId ? { ...u, role } : u),
            currentUser: currentUser?.id === userId ? { ...currentUser, role } : currentUser,
            loading: false,
            lastFetched: Date.now()  // Update timestamp after role change
          });
          return true;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          return false;
        }
      },

      isAdmin: () => {
        const { currentUser } = get();
        return currentUser?.role === 'admin';
      },

      clearUserData: () => {
        set({
          users: [],
          currentUser: null,
          loading: false,
          error: null,
          lastFetched: null
        });
      }
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        users: state.users,
        currentUser: state.currentUser,
        lastFetched: state.lastFetched
      }),
      onRehydrateStorage: () => (state) => {
        // This runs after the state is rehydrated from storage
        if (state) {
          // Force refetch of all data
          state.fetchUsers();
          state.fetchCurrentUser();
          state.isAdmin()
        }
      }
    }
  )
);