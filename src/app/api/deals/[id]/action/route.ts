import { NextResponse } from "next/server";
import { handle, HttpError, requireUser } from "@/lib/auth";
import { dealView, loadDeal, receiptContent, sealDeal } from "@/lib/dealServer";
import { applyAction, type DealAction } from "@/lib/deals";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ACTIONS: DealAction[] = ["accept", "counter", "decline", "cancel", "start", "done"];

/** Server-enforced deal transition. The client then writes the result onto the Nexconn DealCard metadata. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { profile } = await requireUser();
    const { action, price } = (await req.json().catch(() => ({}))) as { action?: DealAction; price?: number };
    if (!action || !ACTIONS.includes(action)) throw new HttpError(400, "Unknown action.");
    const admin = supabaseAdmin();

    // Optimistic concurrency with automatic retry: if both people act at the same moment
    // (e.g. both tap "Mark done"), re-read and re-apply instead of failing.
    let deal = await loadDeal(id);
    let t;
    let updated = null;
    for (let attempt = 0; attempt < 3 && !updated; attempt++) {
      if (attempt > 0) deal = await loadDeal(id);
      try {
        t = applyAction(deal, profile.id, action, price);
      } catch (e) {
        throw new HttpError(409, e instanceof Error ? e.message : "Not allowed.");
      }
      const history = [...(deal.history ?? []), { at: new Date().toISOString(), by: profile.id, action, ...(action === "counter" ? { price: t.patch.price } : {}) }];
      const { data, error } = await admin
        .from("deals")
        .update({ ...t.patch, history, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("updated_at", deal.updated_at)
        .select("*")
        .maybeSingle();
      if (error) throw new HttpError(500, error.message);
      updated = data;
    }
    if (!updated || !t) throw new HttpError(409, "The other person just updated this deal. Refreshing…");

    const { data: post } = await admin.from("posts").select("type, details, status").eq("id", deal.post_id).single();
    const isRent = post?.type === "market" && post?.details?.listing === "rent";
    if (updated.status === "agreed" && !isRent && post?.status === "open") {
      await admin.from("posts").update({ status: "in_deal" }).eq("id", deal.post_id);
    }
    if (updated.status === "cancelled" && post?.status === "in_deal") {
      const { count } = await admin.from("deals").select("id", { count: "exact", head: true }).eq("post_id", deal.post_id).in("status", ["agreed", "in_progress"]);
      if (!count) await admin.from("posts").update({ status: "open" }).eq("id", deal.post_id);
    }
    if (t.completed) {
      await admin.rpc("increment_completed", { uids: [deal.buyer_id, deal.seller_id] });
      if (!isRent) await admin.from("posts").update({ status: "completed" }).eq("id", deal.post_id);
      // Seal the finished deal; the client that completed it posts the Sealed Receipt into the chat.
      const sealed = await sealDeal(updated);
      const view = await dealView(sealed, profile.id);
      return NextResponse.json({ ...view, event: t.event, receipt: receiptContent(view) });
    }
    return NextResponse.json({ ...(await dealView(updated, profile.id)), event: t.event });
  });
}
