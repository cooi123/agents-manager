import { create } from 'zustand';
import { Database } from '../types/database.types';
import { supabase } from '../services/supabase';


type PersonalDocument = Database['public']['Tables']['personal_documents']['Row'];

interface PersonalDocumentState {
  documents: PersonalDocument[];
  loading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<PersonalDocument[]>;
  fetchPersonalDocuments: (userId: string) => Promise<PersonalDocument[]>;
  uploadDocument: (file: File, projectId?: string) => Promise<PersonalDocument | null>;
  deleteDocument: (id: string) => Promise<boolean>;
}

export const usePersonalDocumentStore = create<PersonalDocumentState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,

  // Fetch personal documents for a specific user
  fetchPersonalDocuments: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('personal_documents')
        .select('id, filename, path, filesize, mimetype, created_at, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      console.log('Fetched personal documents:', data);
      if (error) throw error;
      set({ documents: data || [], loading: false });
      return data;
    }
    catch (error: any) {
      set({ error: error.message, loading: false });
      return [];
    }
  },
  // Fetch all documents (admin function)
  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('personal_documents')
        .select('id, filename, path, filesize, mimetype, created_at, user_id, project_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ documents: data || [], loading: false });
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return [];
    }
  },

  // Enhanced upload document function that can handle project documents
  uploadDocument: async (file) => {
    set({ loading: true, error: null });
    console.log('Uploading document:', file);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage - with folder structure based on document type
      const filename = `${Date.now()}-${file.name}`;
      const filePath =  `personal/${user.id}/${filename}`;

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
          user_id: user.id,
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