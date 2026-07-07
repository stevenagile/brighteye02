// service_role Supabase client — 供 Edge Function 使用(繞過 RLS)
// SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY 由 Supabase Edge 執行環境自動注入
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
