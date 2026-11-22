import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handle, HttpError } from "@/lib/auth";

/**
 * LOCAL DEVELOPMENT ONLY: sign in with any email without sending an email
 * (Supabase's built-in mailer allows only a few emails per hour).
 * Disabled in production and unless DEV_EMAIL_LOGIN=true.
 */
export async function POST(req: Request) {
  return handle(async () => {
    if (process.env.NODE_ENV === "production" || process.env.DEV_EMAIL_LOGIN !== "true") throw new HttpError(404, "Not available.");
    const { email } = (await req.json().catch(() => ({}))) as { email?: string };
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
    const { data, error } = await supabaseAdmin().auth.admin.generateLink({ type: "magiclink", email: email.trim() });
    if (error || !data.properties?.hashed_token) throw new HttpError(500, error?.message ?? "Could not create a sign-in link.");
    return NextResponse.json({ tokenHash: data.properties.hashed_token });
  });
}
