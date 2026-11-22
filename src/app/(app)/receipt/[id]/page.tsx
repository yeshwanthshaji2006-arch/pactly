import Link from "next/link";
import { Icon } from "@/components/ui";
import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sealHash } from "@/lib/dealServer";
import { rupees } from "@/lib/format";
import type { Deal } from "@/lib/types";

const TZ = "Asia/Kolkata";
const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: TZ, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

const ACTION_LABEL: Record<string, string> = {
  offer: "offered",
  accept: "agreed",
  counter: "countered",
  decline: "declined",
  cancel: "cancelled",
  start: "started the deal",
  done: "marked it done",
  handover: "verified the handover code 🔐",
};

/** Recomputes a Sealed Receipt's SHA-256 from the live database and compares it with the seal in the chat. */
export default async function ReceiptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ h?: string }> }) {
  const [{ id }, { h }] = await Promise.all([params, searchParams]);
  const me = await getSessionProfile();
  if (!me) notFound();
  const admin = supabaseAdmin();
  const { data } = await admin.from("deals").select("*").eq("id", id).maybeSingle();
  const deal = data as Deal | null;
  if (!deal || (me.id !== deal.buyer_id && me.id !== deal.seller_id && me.role !== "admin")) notFound();

  const [{ data: post }, { data: people }] = await Promise.all([
    admin.from("posts").select("title, type").eq("id", deal.post_id).maybeSingle(),
    admin.from("profiles").select("id, full_name").in("id", [deal.buyer_id, deal.seller_id]),
  ]);
  const name = (uid: string) => people?.find((p) => p.id === uid)?.full_name ?? "Someone";

  const sealed = !!(deal.sealed_at && deal.receipt_hash);
  const recomputed = sealed ? sealHash(deal, deal.sealed_at!) : null;
  const dbMatches = sealed && recomputed === deal.receipt_hash;
  const chatMatches = !h || h === deal.receipt_hash;
  const ok = dbMatches && chatMatches;
  const cutoff = deal.sealed_at ? new Date(deal.sealed_at).getTime() : Infinity;

  return (
    <div className="space-y-4 p-4" data-testid="receipt-page">
      <Link href="/deals" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>Deals</Link>
      <h1 className="font-display text-2xl font-bold">Sealed receipt</h1>

      {!sealed ? (
        <p className="rounded-2xl bg-bg p-4 text-sm text-muted">This deal isn&apos;t finished yet, so there is no seal.</p>
      ) : (
        <div className={`rounded-2xl p-4 ${ok ? "bg-success-soft text-success-ink" : "bg-danger-soft text-danger"}`} data-testid="seal-result" data-ok={ok ? "1" : "0"}>
          <p className="text-lg font-bold">{ok ? <><Icon name="checkCircle" className="mr-1.5 h-5 w-5" />Seal verified</> : <><Icon name="warning" className="mr-1.5 h-5 w-5" />Seal does not match</>}</p>
          <p className="mt-1 text-sm">
            {ok
              ? `Pactly recomputed the SHA-256 of this deal's record just now and it matches the seal from ${fmt(deal.sealed_at!)}. The price, the people and the timeline haven't changed since.`
              : !chatMatches
                ? "The seal shown in the chat is different from this deal's seal. Treat that receipt as not genuine."
                : "This deal's record has changed since it was sealed."}
          </p>
        </div>
      )}

      <div className="card space-y-3 p-4">
        <p className="font-semibold">{post?.title ?? "Deal"}</p>
        <p className="font-display text-3xl font-bold">{rupees(deal.price)}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">Buyer</dt>
          <dd>{name(deal.buyer_id)}</dd>
          <dt className="text-muted">Seller</dt>
          <dd>{name(deal.seller_id)}</dd>
          <dt className="text-muted">Listed at</dt>
          <dd>{rupees(deal.original_price)}</dd>
          <dt className="text-muted">Handover</dt>
          <dd>{deal.handover_verified_at ? `Code verified, ${fmt(deal.handover_verified_at)}` : "Both tapped “Mark done”"}</dd>
        </dl>
      </div>

      <div className="card p-4">
        <p className="mb-2 text-sm font-semibold">Timeline (sealed)</p>
        <ol className="space-y-1.5 text-sm">
          {(deal.history ?? [])
            .filter((e) => new Date(e.at).getTime() <= cutoff)
            .map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-32 shrink-0 text-xs text-muted">{fmt(e.at)}</span>
                <span>
                  {name(e.by).split(" ")[0]} {ACTION_LABEL[e.action] ?? e.action}
                  {e.price ? ` ₹${e.price.toLocaleString("en-IN")}` : ""}
                </span>
              </li>
            ))}
        </ol>
      </div>

      {sealed ? (
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">SHA-256 seal</p>
          <p className="mt-1 break-all font-mono text-xs" data-testid="seal-full">{deal.receipt_hash}</p>
          <p className="mt-2 text-[11px] text-muted">The seal covers the price, both people, the handover and every step up to completion. Change any of them and the seal stops matching.</p>
        </div>
      ) : null}
    </div>
  );
}
