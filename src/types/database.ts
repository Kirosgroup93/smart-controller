export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface ExactConnection {
  id: string;
  user_id: string;
  division: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSnapshot {
  id: string;
  user_id: string;
  division: number;
  snapshot_date: string;
  type: "balance_sheet" | "profit_loss" | "receivables" | "payables";
  data: Json;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      exact_connections: {
        Row: ExactConnection;
        Insert: Omit<ExactConnection, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ExactConnection, "id" | "created_at" | "updated_at">>;
      };
      financial_snapshots: {
        Row: FinancialSnapshot;
        Insert: Omit<FinancialSnapshot, "id" | "created_at">;
        Update: Partial<Omit<FinancialSnapshot, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
