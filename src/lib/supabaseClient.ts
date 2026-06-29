import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/rest\/v1\/?$/i, "").replace(/\/rest\/v1\/?(?=\?)/i, "");
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.",
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase client is not configured. Paste VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY into .env, then restart the dev server.",
    );
  }

  return supabase;
}