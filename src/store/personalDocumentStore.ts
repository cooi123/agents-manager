import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Database } from '../types/database.types';

type PersonalDocument = Database['public']['Tables']['personal_documents']['Row'];

interface PersonalDocumentState {
  documents: PersonalDocument[];
  loading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<PersonalDocument | null>;
  deleteDocument: (id: string) => Promise<boolean>;
}

export const usePersonalDocumentStore = create<PersonalDocumentState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,

  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('personal_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ documents: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  uploadDocument: async (file) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const filename = `${Date.now()}-${file.name}`;
      const filePath = `personal/${user.id}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error: dbError } = await supabase
        .from('personal_documents')
        .insert({
          filename: file.name,
          filesize: file.size,
          mimetype: file.type,
          path: filePath,
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
      // Get the document to get its storage path
      const { data: doc, error: fetchError } = await supabase
        .from('personal_documents')
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
        .from('personal_documents')
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