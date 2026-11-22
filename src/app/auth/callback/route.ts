import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

/** Handles the email magic link (PKCE `code` or `token_hash`) and returns the user to the app. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = url.searchParams.get("next") || "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const supabase = await supabaseServer();

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const rawType = url.searchParams.get("type");
  // Supabase verifies email OTP token hashes as type "email"; older templates send magiclink/signup.
  const type = (rawType === "magiclink" || rawType === "signup" ? "email" : rawType) as EmailOtpType | null;

  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  return NextResponse.redirect(new URL(ok ? safeNext : "/login?error=link", url.origin));
}
