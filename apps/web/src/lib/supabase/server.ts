import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabaseEnv } from "../env.server";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function createSupabaseAnonServerClient(): SupabaseClient<Database> | null {
  const { data, status } = readSupabaseEnv();
  if (!data || !status.configuredPublic) return null;

  return createClient<Database>(data.NEXT_PUBLIC_SUPABASE_URL!, data.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "x-application-name": "chia-ecommerce-web",
      },
    },
  });
}

export function requireSupabaseAnonServerClient(): SupabaseClient<Database> {
  const client = createSupabaseAnonServerClient();
  if (!client) {
    throw new Error("Supabase no está configurado (faltan NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  }
  return client;
}

export function createSupabaseServiceClient(): SupabaseClient<Database> | null {
  const { data, status } = readSupabaseEnv();
  if (!data || !status.configuredServer) return null;

  return createClient<Database>(data.NEXT_PUBLIC_SUPABASE_URL!, data.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "x-application-name": "chia-ecommerce-web-service",
      },
    },
  });
}

export function requireSupabaseServiceClient(): SupabaseClient<Database> {
  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Supabase service role no está configurado (falta SUPABASE_SERVICE_ROLE_KEY).");
  }
  return client;
}

export type SupabaseHealthSnapshot = {
  canCreateAnonClient: boolean;
  canCreateServiceClient: boolean;
  checkedAt: string;
};

export function getSupabaseHealthSnapshot(): SupabaseHealthSnapshot {
  return {
    canCreateAnonClient: Boolean(createSupabaseAnonServerClient()),
    canCreateServiceClient: Boolean(createSupabaseServiceClient()),
    checkedAt: new Date().toISOString(),
  };
}
