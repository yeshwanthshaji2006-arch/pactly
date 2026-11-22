import { NextResponse } from "next/server";
import { handle, HttpError, requireUser } from "@/lib/auth";
import { dealView, loadDeal } from "@/lib/dealServer";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { profile } = await requireUser();
    const { rating, comment } = (await req.json().catch(() => ({}))) as { rating?: number; comment?: string };
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) throw new HttpError(400, "Pick 1 to 5 stars.");
    const deal = await loadDeal(id);
    if (![deal.buyer_id, deal.seller_id].includes(profile.id)) throw new HttpError(403, "Not your deal.");
    if (!["done", "reviewed"].includes(deal.status)) throw new HttpError(409, "You can review once both sides confirm the deal is done.");
    const reviewee = profile.id === deal.buyer_id ? deal.seller_id : deal.buyer_id;
    const admin = supabaseAdmin();
    const { error } = await admin.from("reviews").insert({ deal_id: id, reviewer_id: profile.id, reviewee_id: reviewee, rating, comment: comment?.trim().slice(0, 300) || null });
    if (error) throw new HttpError(error.code === "23505" ? 409 : 500, error.code === "23505" ? "You already reviewed this deal." : error.message);
    const { count } = await admin.from("reviews").select("id", { count: "exact", head: true }).eq("deal_id", id);
    let updated = deal;
    if ((count ?? 0) >= 2) {
      const { data } = await admin.from("deals").update({ status: "reviewed", updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
      if (data) updated = data;
    }
    return NextResponse.json(await dealView(updated, profile.id));
  });
}
