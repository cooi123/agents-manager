import { create } from 'zustand';
import { supabase, getCurrentUser, getUserRole } from '../services/supabase';

type AuthState = {
  user: any | null;
  role: 'admin' | 'user' | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null, user: any | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,
  initialized: false,
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      const role = await getUserRole();
      set({ user: data.user, role, loading: false });
    } else {
      set({ loading: false });
    }
    
    return { error };
  },
  
  signUp: async (email, password) => {
    try {
      // First sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        return { error, user: null };
      }
      
      if (!data.user) {
        return { error: new Error('User creation failed'), user: null };
      }
      
      // Create the profile record using service role to bypass RLS
      // This ensures the profile is created even if RLS would block it
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          role: 'user',
        });
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { error: profileError, user: null };
      }
      
      set({ user: data.user, role: 'user', loading: false });
      return { error: null, user: data.user };
    } catch (error: any) {
      console.error('Sign up error:', error);
      set({ loading: false });
      return { error, user: null };
    }
  },
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null });
  },
  
  initialize: async () => {
    try {
      const user = await getCurrentUser();
      let role = null;
      
      if (user) {
        role = await getUserRole();
      }
      
      set({ user, role, loading: false, initialized: true });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },
}));