import { createClient } from '@supabase/supabase-js';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string | null; created_at: string; subscription_status: string | null };
        Insert: { id: string; email?: string | null; created_at?: string; subscription_status?: string | null };
        Update: { id?: string; email?: string | null; created_at?: string; subscription_status?: string | null };
        Relationships: [];
      };
      analysis_history: {
        Row: {
          id: string;
          user_id: string;
          career_input: Record<string, unknown>;
          analysis: Record<string, unknown>;
          report: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          career_input: Record<string, unknown>;
          analysis: Record<string, unknown>;
          report?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          career_input?: Record<string, unknown>;
          analysis?: Record<string, unknown>;
          report?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          polar_checkout_id: string;
          polar_order_id: string | null;
          user_id: string | null;
          email: string | null;
          status: string;
          payment_type: string | null;
          metadata_pending_session_key: string | null;
          report_generated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          polar_checkout_id: string;
          polar_order_id?: string | null;
          user_id?: string | null;
          email?: string | null;
          status?: string;
          payment_type?: string | null;
          metadata_pending_session_key?: string | null;
          report_generated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          polar_checkout_id?: string;
          polar_order_id?: string | null;
          user_id?: string | null;
          email?: string | null;
          status?: string;
          payment_type?: string | null;
          metadata_pending_session_key?: string | null;
          report_generated?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          polar_subscription_id: string;
          user_id: string;
          email: string;
          status: string;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          polar_subscription_id: string;
          user_id: string;
          email: string;
          status?: string;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          polar_subscription_id?: string;
          user_id?: string;
          email?: string;
          status?: string;
          current_period_end?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_usage: {
        Row: {
          id: string;
          user_id: string;
          usage_date: string;
          report_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          usage_date?: string;
          report_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          usage_date?: string;
          report_count?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      increment_daily_usage: {
        Args: { p_user_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null!;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
