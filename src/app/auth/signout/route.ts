import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Clears a stale session and returns to /login.
 * Used when the login cookie still looks valid but the session or profile behind it is gone
 * (e.g. revoked elsewhere or the account was reset), which would otherwise bounce
 * between /login and / forever.
 */
export async function GET(request: NextRequest) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  const store = await cookies();
  for (const c of store.getAll()) if (c.name.startsWith("sb-")) store.delete(c.name);
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
}
