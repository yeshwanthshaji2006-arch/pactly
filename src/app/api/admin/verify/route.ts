import { NextResponse } from "next/server";
import { handle, HttpError, requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const { userId, decision } = (await req.json().catch(() => ({}))) as { userId?: string; decision?: "verified" | "rejected" };
    if (!userId || !decision || !["verified", "rejected"].includes(decision)) throw new HttpError(400, "Bad request.");
    const { error } = await supabaseAdmin().from("profiles").update({ verification_status: decision }).eq("id", userId);
    if (error) throw new HttpError(500, error.message);
    return NextResponse.json({ ok: true });
  });
}
