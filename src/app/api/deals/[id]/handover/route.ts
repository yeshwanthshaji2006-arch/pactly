import { NextResponse } from "next/server";
import { handle, HttpError, requireUser } from "@/lib/auth";
import { checkHandoverCode, dealView, handoverOpen, loadDeal, receiptContent, sealDeal } from "@/lib/dealServer";
import { payeeId } from "@/lib/deals";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Deal } from "@/lib/types";

/**
 * Handover Code: the payee types the 4-digit code that only the payer can see.
 * A match proves they met, so the deal goes straight to Done for both sides and is sealed.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { profile } = await requireUser();
    const { code } = (await req.json().catch(() => ({}))) as { code?: string };
    const typed = String(code ?? "").replace(/\D/g, "");
    if (typed.length !== 4) throw new HttpError(400, "Enter the 4-digit code.");

    const admin = supabaseAdmin();
    const deal = await loadDeal(id);
    const { data: post } = await admin.from("posts").select("type, details").eq("id", deal.post_id).single();
    if (!post) throw new HttpError(404, "Post not found.");
    if (profile.id !== payeeId(deal, post.type)) throw new HttpError(403, "Only the person handing over enters the code.");
    if (!handoverOpen(deal)) throw new HttpError(409, "The handover code works once the deal is agreed and before it's done.");

    await checkHandoverCode(id, typed);

    const now = new Date().toISOString();
    const history = [...(deal.history ?? []), { at: now, by: profile.id, action: "handover" }];
    const { data: updated } = await admin
      .from("deals")
      .update({ status: "done", buyer_done: true, seller_done: true, handover_verified_at: now, last_actor_id: profile.id, history, updated_at: now })
      .eq("id", id)
      .in("status", ["agreed", "in_progress"])
      .select("*")
      .maybeSingle();
    if (!updated) throw new HttpError(409, "This deal just changed. Refreshing…");

    const isRent = post.type === "market" && post.details?.listing === "rent";
    await admin.rpc("increment_completed", { uids: [deal.buyer_id, deal.seller_id] });
    if (!isRent) await admin.from("posts").update({ status: "completed" }).eq("id", deal.post_id);

    const sealed = await sealDeal(updated as Deal);
    const view = await dealView(sealed, profile.id);
    return NextResponse.json({ ...view, event: "verified the handover code 🔐 Deal done ✅", receipt: receiptContent(view) });
  });
}
