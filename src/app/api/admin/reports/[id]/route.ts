import { NextResponse } from "next/server";
import { handle, HttpError, requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await ctx.params;
    const { status } = (await req.json().catch(() => ({}))) as { status?: string };
    if (!status || !["open", "actioned", "dismissed"].includes(status)) throw new HttpError(400, "Bad status.");
    const { error } = await supabaseAdmin().from("reports").update({ status }).eq("id", id);
    if (error) throw new HttpError(500, error.message);
    return NextResponse.json({ ok: true });
  });
}
