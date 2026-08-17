import process from "node:process";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const globalForSupabase = globalThis as unknown as {
  __supabase: SupabaseClient | undefined;
};

export function getSupabaseClient(): SupabaseClient {
  if (globalForSupabase.__supabase) return globalForSupabase.__supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing env var SUPABASE_URL — set it in Vercel dashboard");
  if (!key) throw new Error("Missing env var SUPABASE_ANON_KEY — set it in Vercel dashboard");

  const client = createClient(url, key, { auth: { persistSession: false } });

  if (process.env.NODE_ENV !== "production") {
    globalForSupabase.__supabase = client;
  }

  return client;
}
