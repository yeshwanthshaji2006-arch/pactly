import { NextResponse } from "next/server";
import { handle, HttpError, requireVerified } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dealView, isBlockedBetween } from "@/lib/dealServer";
import type { Deal, Post } from "@/lib/types";

/** Start (or resume) a deal on a post: Accept task / Buy / Rent / Offer a ride. */
export async function POST(req: Request) {
  return handle(async () => {
    const { profile } = await requireVerified();
    const { postId } = (await req.json().catch(() => ({}))) as { postId?: string };
    if (!postId) throw new HttpError(400, "Missing post.");
    const admin = supabaseAdmin();
    const { data: post } = await admin.from("posts").select("*").eq("id", postId).maybeSingle();
    const p = post as Post | null;
    if (!p) throw new HttpError(404, "That post was removed.");
    if (p.author_id === profile.id) throw new HttpError(400, "This is your own post.");
    if (p.type === "ride" && p.details.ride_kind === "offer") throw new HttpError(400, "Book a seat to join this ride's room.");
    if (!["open", "in_deal"].includes(p.status)) throw new HttpError(409, "This post is closed.");
    if (await isBlockedBetween(profile.id, p.author_id)) throw new HttpError(403, "You can't deal with this user.");

    const { data: existing } = await admin
      .from("deals")
      .select("*")
      .eq("post_id", p.id)
      .eq("buyer_id", profile.id)
      .not("status", "in", "(cancelled,done,reviewed)")
      .maybeSingle();
    if (existing) return NextResponse.json({ ...(await dealView(existing as Deal, profile.id)), created: false });

    const { data: deal, error } = await admin
      .from("deals")
      .insert({
        post_id: p.id,
        buyer_id: profile.id,
        seller_id: p.author_id,
        price: p.price,
        original_price: p.price,
        status: "offer",
        last_actor_id: profile.id,
        history: [{ at: new Date().toISOString(), by: profile.id, action: "offer", price: p.price }],
      })
      .select("*")
      .single();
    if (error) throw new HttpError(500, error.message);
    return NextResponse.json({ ...(await dealView(deal as Deal, profile.id)), created: true });
  });
}

/** List my deals (both sides) with the post and the other person. */
export async function GET() {
  return handle(async () => {
    const { profile } = await (await import("@/lib/auth")).requireUser();
    const { data, error } = await supabaseAdmin()
      .from("deals")
      .select("*, post:posts(id, type, title, images, details)")
      .or(`buyer_id.eq.${profile.id},seller_id.eq.${profile.id}`)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new HttpError(500, error.message);
    const others = [...new Set((data ?? []).map((d) => (d.buyer_id === profile.id ? d.seller_id : d.buyer_id)))];
    const { data: people } = await supabaseAdmin().from("profiles").select("id, full_name, avatar_url, nexconn_user_id").in("id", others.length ? others : ["00000000-0000-0000-0000-000000000000"]);
    const byId = Object.fromEntries((people ?? []).map((x) => [x.id, x]));
    return NextResponse.json({
      deals: (data ?? []).map((d) => ({ ...d, other: byId[d.buyer_id === profile.id ? d.seller_id : d.buyer_id] ?? null })),
    });
  });
}
