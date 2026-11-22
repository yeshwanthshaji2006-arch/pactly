import { NextResponse } from "next/server";
import { handle, requireUser } from "@/lib/auth";
import { dealView } from "@/lib/dealServer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Deal } from "@/lib/types";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { profile } = await requireUser();
    const { data } = await supabaseAdmin().from("deals").select("*").eq("id", id).maybeSingle();
    // A card in chat history can outlive its deal (e.g. removed by moderators): report it, don't 404.
    if (!data) return NextResponse.json({ missing: true });
    return NextResponse.json(await dealView(data as Deal, profile.id));
  });
}
