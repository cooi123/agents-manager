import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';
import { useUserStore } from './userStore';
import { useProjectStore } from './projectStore';

type AuthState = {
  user: User | null;  // Supabase auth user
  session: any | null;  // Auth session
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null, user: any | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      set({ 
        user: data.user, 
        session: data.session,
        loading: false 
      });
      useUserStore.getState().fetchCurrentUser();
    } else {
      set({ loading: false });
    }
    
    return { error };
  },
  
  signUp: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) return { error, user: null };
      if (!data.user) return { error: new Error('User creation failed'), user: null };
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          role: 'user'
        })
        .select()
        .single();
      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw profileError;
      }
      
      set({ 
        user: data.user, 
        session: data.session,
        loading: false 
      });
      return { error: null, user: data.user };
    } catch (error: any) {
      set({ loading: false });
      return { error, user: null };
    }
  },
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
    useUserStore.getState().clearUserData();
    useProjectStore.getState().clearProjectData();
  },
  
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      set({ 
        user: user, 
        session: session,
        loading: false, 
        initialized: true 
      });
      
      if (user) {
        useUserStore.getState().fetchCurrentUser();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },
}));