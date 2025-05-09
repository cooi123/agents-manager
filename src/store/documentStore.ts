import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Database } from '../types/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentState {
  projectDocuments: Document[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (projectId: string) => Promise<void>;
  fetchAllDocuments: () => Promise<void>;
  uploadDocument: (file: File, projectId: string) => Promise<Document | null>;
  uploadDocuments: (files: File[], projectId: string) => Promise<UploadResult>;
  deleteDocument: (id: string) => Promise<boolean>;
  getDocumentUrls: (documentIds: string[]) => Promise<string[]>;
}

// Add this type for upload results
type UploadResult = {
  success: boolean;
  errors?: string[];
  uploadedFilesId: string[];
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
  projectDocuments: [],
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
      set({ projectDocuments: data || [], loading: false });
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
      set({ projectDocuments: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  uploadDocuments: async (files, projectId): Promise<UploadResult> => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const uploadedDocuments: Document[] = [];
      const errors: string[] = [];
      const uploadedFilesId: string[] = [];

      for (const file of files) {
        try {
          // Check if file already exists in the project
          const { data: existingDoc } = await supabase
            .from('documents')
            .select('filename')
            .eq('project_id', projectId)
            .eq('filename', file.name)
            .single();

          if (existingDoc) {
            errors.push(`"${file.name}" already exists`);
            continue;
          }

          const filename = `${Date.now()}-${file.name}`;
          // Ensure proper path formatting
          const filePath = `${projectId}/${filename}`.replace(/\/+/g, '/');

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          // Create document record
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

          if (dbError) {
            console.error('Database error:', dbError);
            throw dbError;
          }

          if (data) {
            uploadedDocuments.push(data);
            uploadedFilesId.push(data.id);
          }
        } catch (error: any) {
          console.error('Error uploading file:', error);
          errors.push(`Failed to upload "${file.name}": ${error.message}`);
        }
      }

      // Update store state with new documents
      if (uploadedDocuments.length > 0) {
        const { projectDocuments: currentDocuments } = get();
        set({ 
          projectDocuments: [...uploadedDocuments, ...currentDocuments],
          loading: false 
        });
      }

      return {
        success: uploadedDocuments.length > 0,
        errors: errors.length > 0 ? errors : undefined,
        uploadedFilesId: uploadedFilesId
      };
    } catch (error: any) {
      console.error('Store error:', error);
      set({ error: error.message, loading: false });
      return { success: false, errors: [error.message], uploadedFilesId: [] };
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

      const { projectDocuments: documents } = get();
      set({ 
        projectDocuments: [data, ...documents],
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
      // First get the document to get its storage path and verify ownership
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('path, user_id')
        .eq('id', id)
        .single();
      console.log("id", id)
      console.log("doc", doc)
      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      if (!doc) {
        throw new Error('Document not found');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.path]);

      if (storageError) {
        console.error('Storage error:', storageError);
        // If storage deletion fails, check if it's a permissions error
        if (storageError.message.includes('permission denied')) {
          throw new Error('You do not have permission to delete this document');
        }
        throw storageError;
      }

      // Delete from database
      const { data, error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      console.log("delete data", data)
      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      const { projectDocuments: documents } = get();
      set({
        projectDocuments: documents.filter(d => d.id !== id),
        loading: false
      });
      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  getDocumentUrls: async (documentIds: string[]) => {
    try {
      const { data: selectedDocs, error: fetchError } = await supabase
        .from('documents')
        .select('path')
        .in('id', documentIds);

      if (fetchError) throw fetchError;

      const documentUrls = await Promise.all(
        selectedDocs.map(async (doc) => {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.path, 3600);

          if (signedUrlError) throw signedUrlError;
          return signedUrlData.signedUrl;
        })
      );

      return documentUrls;
    } catch (error) {
      console.error('Error getting document URLs:', error);
      throw error;
    }
  }
}));