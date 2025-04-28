export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      services: {
        Row: {
          id: string
          name: string
          url: string
          description: string | null
          instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          description?: string | null
          instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          description?: string | null
          instructions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          created_at: string
          filename: string
          filesize: number
          mimetype: string
          path: string
          project_id: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          filename: string
          filesize: number
          mimetype: string
          path: string
          project_id: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          filename?: string
          filesize?: number
          mimetype?: string
          path?: string
          project_id?: string
          user_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          role: 'admin' | 'user'
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          role?: 'admin' | 'user'
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          role?: 'admin' | 'user'
        }
      }
      projects: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          user_id?: string
        }
      }
    }
  }
      personal_documents: {
        Row: {
          id: string
          user_id: string
          filename: string
          filesize: number
          mimetype: string
          path: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          filesize: number
          mimetype: string
          path: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          filesize?: number
          mimetype?: string
          path?: string
          created_at?: string
        }
      }
}