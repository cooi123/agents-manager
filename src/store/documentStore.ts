import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Database } from '../types/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (projectId: string) => Promise<void>;
  fetchAllDocuments: () => Promise<void>;
  uploadDocument: (file: File, projectId: string) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,

  fetchDocuments: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ documents: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAllDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ documents: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  uploadDocument: async (file, projectId) => {
    set({ loading: true, error: null });
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const filename = `${Date.now()}-${file.name}`;
      const filePath = `${projectId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record with user_id
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          filename: file.name,
          filesize: file.size,
          mimetype: file.type,
          path: filePath,
          project_id: projectId,
          user_id: user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const { documents } = get();
      set({ 
        documents: [data, ...documents],
        loading: false 
      });
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  deleteDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      // First get the document to get its storage path
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('path')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      if (doc) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([doc.path]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      const { documents } = get();
      set({
        documents: documents.filter(d => d.id !== id),
        loading: false
      });
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  }
}));