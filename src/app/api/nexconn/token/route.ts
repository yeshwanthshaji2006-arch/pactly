import { NextResponse } from "next/server";
import { issueAccessToken, publicAppKey } from "@/lib/nexconn/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handle, HttpError } from "@/lib/auth";

/**
 * Issues a Nexconn access token for the signed-in user only.
 * The App Secret stays on the server; the browser receives the App Key (public) and its own token.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      const { data: p } = await supabaseAdmin()
        .from("profiles")
        .select("nexconn_user_id, full_name, avatar_url")
        .eq("id", data.user.id)
        .single();
      if (!p) throw new HttpError(404, "Profile missing.");
      const token = await issueAccessToken(p.nexconn_user_id, p.full_name || "Pactly user", p.avatar_url || undefined);
      return NextResponse.json({ token, appKey: publicAppKey(), userId: p.nexconn_user_id });
    }

    // Local-only smoke test (/dev/smoke): arbitrary test ids, never in production.
    if (process.env.NODE_ENV !== "production") {
      const { userId, name } = (await req.json().catch(() => ({}))) as { userId?: string; name?: string };
      if (userId && /^[A-Za-z0-9]{1,64}$/.test(userId)) {
        const token = await issueAccessToken(userId, name || userId);
        return NextResponse.json({ token, appKey: publicAppKey(), userId });
      }
    }
    throw new HttpError(401, "Please sign in.");
  });
}
