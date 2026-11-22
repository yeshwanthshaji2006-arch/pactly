import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "./supabase/admin";
import { HttpError } from "./auth";
import { PUBLIC_PROFILE_COLUMNS, type Deal, type Post, type PublicProfile } from "./types";
import { payerId, payeeId } from "./deals";

export async function loadDeal(id: string) {
  const { data } = await supabaseAdmin().from("deals").select("*").eq("id", id).maybeSingle();
  if (!data) throw new HttpError(404, "Deal not found.");
  return data as Deal;
}

export async function isBlockedBetween(a: string, b: string) {
  const { data } = await supabaseAdmin()
    .from("blocks")
    .select("blocker_id")
    .or(`and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** Full view of a deal for one participant, including the payee's UPI once the deal is Agreed. */
export async function dealView(deal: Deal, viewerId: string) {
  if (viewerId !== deal.buyer_id && viewerId !== deal.seller_id) throw new HttpError(403, "Not your deal.");
  const admin = supabaseAdmin();
  const [{ data: post }, { data: people }, { data: reviews }] = await Promise.all([
    admin.from("posts").select("id, type, title, price, images, details, status").eq("id", deal.post_id).single(),
    admin.from("profiles").select(PUBLIC_PROFILE_COLUMNS).in("id", [deal.buyer_id, deal.seller_id]),
    admin.from("reviews").select("reviewer_id, rating").eq("deal_id", deal.id),
  ]);
  const p = post as Pick<Post, "id" | "type" | "title" | "price" | "images" | "details" | "status">;
  const byId = Object.fromEntries(((people as PublicProfile[]) ?? []).map((x) => [x.id, x]));
  const payee = payeeId(deal, p.type);
  const payer = payerId(deal, p.type);
  let upi: string | null = null;
  const unlocked = ["agreed", "in_progress", "done", "reviewed"].includes(deal.status);
  if (unlocked) {
    const { data: priv } = await admin.from("profile_private").select("upi_id").eq("user_id", payee).single();
    upi = priv?.upi_id ?? null;
  }
  return {
    deal,
    post: p,
    buyer: byId[deal.buyer_id],
    seller: byId[deal.seller_id],
    payeeId: payee,
    payerId: payer,
    upi, // null until Agreed
    myReview: (reviews ?? []).find((r) => r.reviewer_id === viewerId) ?? null,
    reviewCount: reviews?.length ?? 0,
    // Only the payer ever receives the handover code; the payee only learns whether entry is still allowed.
    handoverCode: handoverOpen(deal) && viewerId === payer ? (await getOrCreateHandoverCode(deal.id)).handover_code : null,
  };
}
export type DealView = Awaited<ReturnType<typeof dealView>>;

// ---------- Handover Code ----------

const MAX_HANDOVER_ATTEMPTS = 5;

/** Handover is possible once both agreed and until the deal is done. */
export const handoverOpen = (deal: Deal) => deal.status === "agreed" || deal.status === "in_progress";

/** The payer (the person receiving the item or service) holds the code; it is created on first view. */
export async function getOrCreateHandoverCode(dealId: string) {
  const admin = supabaseAdmin();
  const { data } = await admin.from("deal_secrets").select("handover_code, attempts").eq("deal_id", dealId).maybeSingle();
  if (data) return data as { handover_code: string; attempts: number };
  const code = String(randomInt(0, 10000)).padStart(4, "0");
  // Upsert-ignore keeps the first code if two requests race.
  await admin.from("deal_secrets").upsert({ deal_id: dealId, handover_code: code }, { onConflict: "deal_id", ignoreDuplicates: true });
  const { data: again } = await admin.from("deal_secrets").select("handover_code, attempts").eq("deal_id", dealId).single();
  return again as { handover_code: string; attempts: number };
}

/** Checks a code typed by the payee. Returns true on a match; counts wrong attempts and locks after 5. */
export async function checkHandoverCode(dealId: string, typed: string) {
  const admin = supabaseAdmin();
  const secret = await getOrCreateHandoverCode(dealId);
  if (secret.attempts >= MAX_HANDOVER_ATTEMPTS) {
    throw new HttpError(429, "Too many wrong codes. Ask them to tap “Mark done” instead.");
  }
  const a = Buffer.from(secret.handover_code), b = Buffer.from(typed.padEnd(4).slice(0, 4));
  if (timingSafeEqual(a, b)) return true;
  await admin.from("deal_secrets").update({ attempts: secret.attempts + 1 }).eq("deal_id", dealId);
  const left = MAX_HANDOVER_ATTEMPTS - secret.attempts - 1;
  throw new HttpError(400, left > 0 ? `That code doesn't match. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong codes. Ask them to tap “Mark done” instead.");
}

// ---------- Sealed Receipt ----------

/**
 * Canonical record of a finished deal. Its SHA-256 is the receipt "seal": anyone can recompute it
 * later from the database, and any change to the price, people or timeline breaks the match.
 * Only facts fixed at completion are included (no titles that the author could edit later, no reviews).
 */
export function sealPayload(deal: Deal, sealedAt: string) {
  const cutoff = new Date(sealedAt).getTime();
  return JSON.stringify({
    v: 1,
    deal: deal.id,
    post: deal.post_id,
    buyer: deal.buyer_id,
    seller: deal.seller_id,
    price: deal.price,
    original_price: deal.original_price,
    handover_verified_at: deal.handover_verified_at ? new Date(deal.handover_verified_at).toISOString() : null,
    timeline: (deal.history ?? [])
      .filter((h) => new Date(h.at).getTime() <= cutoff)
      .map((h) => [new Date(h.at).toISOString(), h.by, h.action, h.price ?? null]),
    sealed_at: new Date(sealedAt).toISOString(),
  });
}

export const sealHash = (deal: Deal, sealedAt: string) => createHash("sha256").update(sealPayload(deal, sealedAt)).digest("hex");

/** Seals a deal that just became Done. Idempotent: an already sealed deal keeps its original seal. */
export async function sealDeal(deal: Deal): Promise<Deal> {
  if (deal.sealed_at && deal.receipt_hash) return deal;
  const sealedAt = new Date().toISOString();
  const hash = sealHash(deal, sealedAt);
  const { data } = await supabaseAdmin()
    .from("deals")
    .update({ sealed_at: sealedAt, receipt_hash: hash })
    .eq("id", deal.id)
    .is("sealed_at", null)
    .select("*")
    .maybeSingle();
  return (data as Deal) ?? (await loadDeal(deal.id));
}

/** Content of the Pactly:Receipt chat message, built from the sealed deal. */
export function receiptContent(view: DealView) {
  const d = view.deal;
  return {
    dealId: d.id,
    postId: view.post.id,
    title: view.post.title,
    postType: view.post.type,
    price: d.price,
    originalPrice: d.original_price,
    buyerName: view.buyer.full_name,
    sellerName: view.seller.full_name,
    payerName: (view.payerId === view.buyer.id ? view.buyer : view.seller).full_name,
    payeeName: (view.payeeId === view.buyer.id ? view.buyer : view.seller).full_name,
    handover: !!d.handover_verified_at,
    sealedAt: d.sealed_at ?? "",
    hash: d.receipt_hash ?? "",
  };
}
