import { NextResponse } from "next/server";
import { handle, HttpError, requireUser } from "@/lib/auth";
import { loadDeal } from "@/lib/dealServer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { nexconnIdFromUuid } from "@/lib/format";

/** Links the Nexconn DealCard message to the deal so both sides update the same card. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { profile } = await requireUser();
    const { messageId } = (await req.json().catch(() => ({}))) as { messageId?: string };
    if (!messageId || messageId.length > 64) throw new HttpError(400, "Missing message id.");
    const deal = await loadDeal(id);
    if (deal.buyer_id !== profile.id) throw new HttpError(403, "Only the person who started the deal can attach its card.");
    const conv = `direct:${[nexconnIdFromUuid(deal.buyer_id), nexconnIdFromUuid(deal.seller_id)].sort().join(":")}`;
    const { error } = await supabaseAdmin()
      .from("deals")
      .update({ nexconn_message_id: messageId, nexconn_conversation_id: conv })
      .eq("id", id)
      .is("nexconn_message_id", null);
    if (error) throw new HttpError(500, error.message);
    return NextResponse.json({ ok: true });
  });
}
