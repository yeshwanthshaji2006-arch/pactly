import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let admin: SupabaseClient<any, "public", any> | null = null;

/** Service-role client. Bypasses RLS, so use it only in server routes after checking the caller. */
export function supabaseAdmin() {
  if (!admin) {
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}
