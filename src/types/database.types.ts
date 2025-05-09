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
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          role: 'admin' | 'user'
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          role?: 'admin' | 'user'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          role?: 'admin' | 'user'
        }
      }
      projects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          user_id: string
          project_type: 'personal' | 'team'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          user_id: string
          project_type?: 'personal' | 'team'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          user_id?: string
          project_type?: 'personal' | 'team'
        }
      }
      services: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          url: string
          description: string | null
          instructions: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          url: string
          description?: string | null
          instructions?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          url?: string
          description?: string | null
          instructions?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
          filename?: string
          filesize?: number
          mimetype?: string
          path?: string
          project_id?: string
          user_id?: string
        }
      }
      transactions: {
        Row: {
          id: string
          parent_transaction_id: string | null
          task_id: string | null
          user_id: string
          project_id: string
          service_id: string
          task_type: 'task' | 'subtask'
          input_data: Json
          input_document_urls: string[]
          status: 'received' | 'pending' | 'running' | 'completed' | 'failed'
          created_at: string
          updated_at: string
          result_payload: Json | null
          result_document_urls: string[] | null
          error_message: string | null
          resources_used: Json
          prompt_tokens: number | null
          completion_tokens: number | null
          tokens_total: number | null
          runtime_ms: number | null
          resources_used_count: number
          resources_used_cost: number
          resource_type: 'llm' | 'embedding' | 'storage' | 'processing'
          model_name: string | null
        }
        Insert: {
          id?: string
          parent_transaction_id?: string | null
          task_id?: string | null
          user_id: string
          project_id: string
          service_id: string
          task_type: 'task' | 'subtask'
          input_data: Json
          input_document_urls?: string[]
          status: 'received' | 'pending' | 'running' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
          result_payload?: Json | null
          result_document_urls?: string[] | null
          error_message?: string | null
          resources_used: Json
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_total?: number | null
          runtime_ms?: number | null
          resources_used_count: number
          resources_used_cost: number
          resource_type: 'llm' | 'embedding' | 'storage' | 'processing'
          model_name?: string | null
        }
        Update: {
          id?: string
          parent_transaction_id?: string | null
          task_id?: string | null
          user_id?: string
          project_id?: string
          service_id?: string
          task_type?: 'task' | 'subtask'
          input_data?: Json
          input_document_urls?: string[]
          status?: 'received' | 'pending' | 'running' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
          result_payload?: Json | null
          result_document_urls?: string[] | null
          error_message?: string | null
          resources_used?: Json
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_total?: number | null
          runtime_ms?: number | null
          resources_used_count?: number
          resources_used_cost?: number
          resource_type?: 'llm' | 'embedding' | 'storage' | 'processing'
          model_name?: string | null
        }
      }
      project_services: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          project_id: string
          service_id: string
          is_active: boolean
          total_tokens_input: number
          total_tokens_output: number
          total_tokens: number
          total_runtime_ms: number
          total_resources_used_count: number
          total_resources_used_cost: number
          last_used_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id: string
          service_id: string
          is_active?: boolean
          total_tokens_input?: number
          total_tokens_output?: number
          total_tokens?: number
          total_runtime_ms?: number
          total_resources_used_count?: number
          total_resources_used_cost?: number
          last_used_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id?: string
          service_id?: string
          is_active?: boolean
          total_tokens_input?: number
          total_tokens_output?: number
          total_tokens?: number
          total_runtime_ms?: number
          total_resources_used_count?: number
          total_resources_used_cost?: number
          last_used_at?: string | null
        }
      }
    }
  }
}