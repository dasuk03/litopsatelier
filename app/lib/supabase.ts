import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const isCmsConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isCmsConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Хранилище магазина ещё не подключено");
  }
  return supabase;
}
