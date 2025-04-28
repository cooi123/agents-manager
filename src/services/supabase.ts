import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please connect to Supabase using the "Connect to Supabase" button.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user;
}

export async function getUserRole() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  // Directly query the profiles table for the current user only
  // This avoids triggering the recursive admin check in the RLS policy
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
  
  return data?.role;
}

export async function isAdmin() {
  const role = await getUserRole();
  return role === 'admin';
}