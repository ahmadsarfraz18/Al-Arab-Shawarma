import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const globalForSupabase = globalThis as unknown as {
  __supabase: ReturnType<typeof createClient> | undefined;
};

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url) throw new Error("SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_ANON_KEY is not set");

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export const supabase = globalForSupabase.__supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.__supabase = supabase;
}
