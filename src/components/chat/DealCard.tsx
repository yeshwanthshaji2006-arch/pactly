"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Message } from "@nexconn/chat";
import { allowedActions, dealMetadata, STATUS_LABEL, STATUS_STEPS, stepIndex, type DealAction } from "@/lib/deals";
import { rupees } from "@/lib/format";
import type { DealCardContent, ReceiptContent } from "@/lib/nexconn/messages";
import type { DealView } from "@/lib/dealServer";
import type { DealStatus } from "@/lib/types";
import { useMe } from "../ProfileProvider";
import { IconTile, Icon, Sheet, Spinner, TYPE_META } from "../ui";

type Props = {
  message: Message<DealCardContent>;
  metaTick: number;
  onEvent: (text: string) => void;
  /** Posts the Sealed Receipt into the chat when this person's action completed the deal. */
  onReceipt: (r: ReceiptContent) => void;
};

export function DealCard({ message, metaTick, onEvent, onReceipt }: Props) {
  const me = useMe();
  const c = message.content;
  const metaStatus = (message.metadata?.get("status") as DealStatus | undefined) ?? "offer";
  const metaPrice = Number(message.metadata?.get("price") ?? c.originalPrice);
  const metaV = message.metadata?.get("v") ?? "";
  const [view, setView] = useState<DealView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<DealAction | "review" | "handover" | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counter, setCounter] = useState("");
  const [holdOpen, setHoldOpen] = useState(false);

  const refresh = useCallback(async () => {
    const r = await fetch(`/api/deals/${c.dealId}`);
    const j = await r.json();
    if (!r.ok) return setLoadError(j.error || "Couldn't load this deal.");
    if (j.missing) return setLoadError("This deal is no longer available.");
    setLoadError(null);
    setView(j);
  }, [c.dealId]);

  // Reload the authoritative state whenever the in-place metadata changes (or on first render).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh, metaV, metaTick]);

  // Quick replies (outside the card) can change this deal; refresh when told to.
  useEffect(() => {
    const onRefresh = (e: Event) => (e as CustomEvent<string>).detail === c.dealId && refresh();
    window.addEventListener("pactly:deal-refresh", onRefresh);
    return () => window.removeEventListener("pactly:deal-refresh", onRefresh);
  }, [c.dealId, refresh]);

  const deal = view?.deal;
  const status: DealStatus = deal?.status ?? metaStatus;
  const price = deal?.price ?? metaPrice;
  const other = view ? (view.buyer.id === me.id ? view.seller : view.buyer) : null;
  const otherFirst = other?.full_name.split(" ")[0] ?? "They";
  const actions = deal ? allowedActions(deal, me.id) : [];
  const iAmPayer = view?.payerId === me.id;
  const payeeName = view ? (view.payeeId === view.buyer.id ? view.buyer : view.seller).full_name.split(" ")[0] : "";

  async function act(action: DealAction | "handover", newPrice?: number) {
    setBusy(action);
    setError(null);
    try {
      const r = await fetch(action === "handover" ? `/api/deals/${c.dealId}/handover` : `/api/deals/${c.dealId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "handover" ? { code } : { action, price: newPrice }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (r.status === 409) refresh();
        throw new Error(j.error || "That didn't work.");
      }
      setView(j);
      setCounterOpen(false);
      // Update the card in place for both users via Nexconn message metadata.
      const res = await message.setMetadata(dealMetadata(j.deal));
      if (!res.isOk) console.warn("[deal] metadata update failed", res.code);
      onEvent(`${me.full_name.split(" ")[0]} ${j.event}`);
      if (j.receipt) onReceipt(j.receipt);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work.");
    } finally {
      setBusy(null);
    }
  }

  async function review(rating: number, comment: string) {
    setBusy("review");
    setError(null);
    const r = await fetch(`/api/deals/${c.dealId}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, comment }) });
    const j = await r.json();
    setBusy(null);
    if (!r.ok) return setError(j.error || "Could not save review.");
    setView(j);
    await message.setMetadata(dealMetadata(j.deal)).catch(() => {});
    onEvent(`${me.full_name.split(" ")[0]} left a ${rating}★ review`);
  }

  const idx = stepIndex(status === "cancelled" ? "offer" : status);
  const changed = price !== c.originalPrice;

  return (
    <div className="w-[min(320px,85vw)] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm" data-testid="deal-card" data-status={status}>
      <div className="flex items-center gap-3 border-b border-line bg-primary-soft/60 p-3">
        {c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
        ) : (
          <IconTile name={TYPE_META[c.postType].icon} className={`h-11 w-11 ${TYPE_META[c.postType].tile}`} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Deal Card · {TYPE_META[c.postType].label}</p>
          <Link href={`/post/${c.postId}`} className="line-clamp-1 text-sm font-semibold hover:underline">{c.title}</Link>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-display text-2xl font-bold" data-testid="deal-price">
              {rupees(price)}
              <span className="text-xs font-medium text-muted">{c.unit}</span>
            </p>
            {changed ? <p className="text-xs text-muted line-through">{rupees(c.originalPrice)}</p> : null}
          </div>
          <StatusPill status={status} />
        </div>

        {status !== "cancelled" ? (
          <ol className="mt-3 flex items-center gap-1" aria-label="Deal progress">
            {STATUS_STEPS.map((s, i) => (
              <li key={s.key} className="flex flex-1 flex-col items-center gap-1">
                <span className={`h-1.5 w-full rounded-full ${i <= idx ? (status === "done" || status === "reviewed" ? "bg-success" : "bg-primary") : "bg-line"}`} />
                <span className={`whitespace-nowrap text-[9px] font-medium leading-none tracking-tight ${i === idx ? "text-ink" : "text-muted"}`}>{s.label}</span>
              </li>
            ))}
          </ol>
        ) : null}

        <p className="mt-3 text-sm text-ink/85" data-testid="deal-line">
          {!view ? (loadError ? <span className="text-danger">{loadError}</span> : <span className="text-muted">Loading deal…</span>) : statusLine()}
        </p>

        {view && ["agreed", "in_progress", "done"].includes(status) ? (
          iAmPayer ? (
            view.upi ? (
              <button className="btn btn-soft mt-3 w-full" onClick={() => setHoldOpen(true)} data-testid="pay-btn">
                Pay {rupees(price)} to {payeeName} via UPI
              </button>
            ) : (
              <p className="mt-3 rounded-xl bg-warning-soft p-2 text-xs text-warning-ink">{payeeName} hasn't added a UPI ID yet. Ask in chat or pay in cash on handover.</p>
            )
          ) : (
            <p className="mt-3 rounded-xl bg-success-soft p-2 text-xs text-success-ink"><Icon name="unlock" className="mr-1 h-[1.05em] w-[1.05em]" />Your UPI ID is now visible to {otherFirst}. Only accept money; never scan or approve anything.</p>
          )
        ) : view && ["offer", "counter"].includes(status) ? (
          <p className="mt-3 text-[11px] text-muted"><Icon name="lock" className="mr-1 h-[1.05em] w-[1.05em]" />UPI details unlock after you both agree.</p>
        ) : null}

        {view && deal && (status === "agreed" || status === "in_progress") ? (
          view.handoverCode ? (
            <div className="mt-3 rounded-xl border border-primary/30 bg-primary-soft/50 p-3 text-center" data-testid="handover-box">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary"><Icon name="key" className="mr-1 h-[1.05em] w-[1.05em]" />Your handover code</p>
              <p className="my-1 font-mono text-3xl font-bold tracking-[0.35em] text-ink" data-testid="handover-code">{view.handoverCode}</p>
              <p className="text-[11px] text-ink/70">Show it to {payeeName} only once you have what you&apos;re paying for. Their entering it finishes the deal.</p>
            </div>
          ) : view.payeeId === me.id ? (
            <form
              className="mt-3 rounded-xl border border-line bg-bg p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.length === 4) act("handover");
              }}
            >
              <p className="text-xs font-semibold"><Icon name="key" className="mr-1 h-[1.05em] w-[1.05em]" />Handing over? Ask {otherFirst} for their 4-digit code</p>
              <div className="mt-2 flex gap-2">
                <input
                  className="input flex-1 !py-2 text-center font-mono text-lg tracking-[0.35em]"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  placeholder="••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  aria-label="Handover code"
                  data-testid="handover-input"
                />
                <button className="btn btn-success !py-2" disabled={code.length !== 4 || !!busy} data-testid="handover-submit">
                  {busy === "handover" ? <Spinner className="h-4 w-4 text-white" /> : "Verify"}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted">A matching code proves you met. The deal completes and is sealed.</p>
            </form>
          ) : null
        ) : null}

        {status === "in_progress" && deal ? (
          <div className="mt-3 flex gap-2 text-xs">
            <DoneTick label={deal.buyer_id === me.id ? "You" : otherFirst} done={deal.buyer_done} />
            <DoneTick label={deal.seller_id === me.id ? "You" : otherFirst} done={deal.seller_done} />
          </div>
        ) : null}

        {counterOpen ? (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              act("counter", Number(counter));
            }}
          >
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">₹</span>
              <input autoFocus className="input !py-2 !pl-7" inputMode="numeric" value={counter} onChange={(e) => setCounter(e.target.value.replace(/\D/g, ""))} placeholder={String(price)} aria-label="Counter price" data-testid="counter-input" />
            </div>
            <button className="btn btn-primary !py-2" disabled={!counter || busy === "counter"} data-testid="counter-send">
              {busy === "counter" ? <Spinner className="h-4 w-4 text-white" /> : "Send"}
            </button>
          </form>
        ) : actions.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.includes("accept") && (
              <button className="btn btn-success flex-1 !py-2" disabled={!!busy} onClick={() => act("accept")} data-testid="act-accept">
                {busy === "accept" ? <Spinner className="h-4 w-4 text-white" /> : null} Accept {rupees(price)}
              </button>
            )}
            {actions.includes("counter") && (
              <button className="btn btn-ghost flex-1 !py-2" disabled={!!busy} onClick={() => { setCounter(""); setCounterOpen(true); }} data-testid="act-counter">Counter</button>
            )}
            {actions.includes("start") && (
              <button className="btn btn-primary flex-1 !py-2" disabled={!!busy} onClick={() => act("start")} data-testid="act-start">
                {busy === "start" ? <Spinner className="h-4 w-4 text-white" /> : null} Start deal
              </button>
            )}
            {actions.includes("done") && (
              <button className="btn btn-success flex-1 !py-2" disabled={!!busy} onClick={() => act("done")} data-testid="act-done">
                {busy === "done" ? <Spinner className="h-4 w-4 text-white" /> : null} Mark done ✓
              </button>
            )}
            {actions.includes("decline") && (
              <button className="btn btn-danger !py-2" disabled={!!busy} onClick={() => act("decline")} data-testid="act-decline">Decline</button>
            )}
            {actions.includes("cancel") && (
              <button className="w-full py-1 text-xs font-medium text-muted underline" disabled={!!busy} onClick={() => confirm("Cancel this deal?") && act("cancel")} data-testid="act-cancel">
                {status === "agreed" ? "Cancel deal" : "Withdraw offer"}
              </button>
            )}
          </div>
        ) : null}

        {view && (status === "done" || status === "reviewed") && !view.myReview ? <ReviewPrompt name={otherFirst} busy={busy === "review"} onSubmit={review} /> : null}
        {view?.myReview ? <p className="mt-3 text-center text-xs text-muted">You rated {otherFirst} {"★".repeat(view.myReview.rating)}</p> : null}

        {error ? <p className="mt-2 text-xs text-danger" role="alert">{error}</p> : null}
      </div>

      {view && iAmPayer && view.upi ? (
        <HoldSheet open={holdOpen} onClose={() => setHoldOpen(false)} amount={price} upi={view.upi} name={payeeName} title={c.title} status={status} />
      ) : null}
    </div>
  );

  function statusLine() {
    const lastByMe = deal?.last_actor_id === me.id;
    switch (status) {
      case "offer":
        return lastByMe ? `Offer sent. Waiting for ${otherFirst} to accept or counter.` : `${otherFirst} wants to deal at ${rupees(price)}.`;
      case "counter":
        return lastByMe ? `You countered at ${rupees(price)}. Waiting for ${otherFirst}.` : `${otherFirst} countered at ${rupees(price)}.`;
      case "agreed":
        return `Agreed at ${rupees(price)}. Meet up. The handover code finishes the deal.`;
      case "in_progress":
        return "In progress. Both of you confirm when it's done.";
      case "done":
        return view?.myReview ? `Done. Waiting for ${otherFirst}'s review.` : `Done. How was dealing with ${otherFirst}?`;
      case "reviewed":
        return "Completed and reviewed by both sides. Nice deal!";
      case "cancelled":
        return "This deal was cancelled.";
    }
  }
}

function StatusPill({ status }: { status: DealStatus }) {
  const tone =
    status === "cancelled" ? "bg-bg text-muted" : status === "done" || status === "reviewed" ? "bg-success-soft text-success-ink" : status === "agreed" || status === "in_progress" ? "bg-primary text-white" : "bg-warning-soft text-warning-ink";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`} data-testid="deal-status">{STATUS_LABEL[status]}</span>;
}

function DoneTick({ label, done }: { label: string; done: boolean }) {
  return (
    <span className={`flex-1 rounded-lg px-2 py-1.5 text-center font-medium ${done ? "bg-success-soft text-success-ink" : "bg-bg text-muted"}`}>
      {done ? <Icon name="check" className="mr-0.5 h-3.5 w-3.5" strokeWidth={2.2} /> : <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-current align-middle" />}{label}
    </span>
  );
}

function ReviewPrompt({ name, busy, onSubmit }: { name: string; busy: boolean; onSubmit: (r: number, c: string) => void }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  return (
    <div className="mt-3 rounded-xl bg-bg p-3" data-testid="review-prompt">
      <p className="text-sm font-semibold">Rate {name}</p>
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={stars === n} aria-label={`${n} stars`} onClick={() => setStars(n)} className={`text-2xl ${n <= stars ? "text-warning" : "text-line"}`} data-testid={`star-${n}`}>★</button>
        ))}
      </div>
      {stars ? (
        <>
          <input className="input mt-2 !py-2 text-sm" placeholder="A few words (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} />
          <button className="btn btn-primary mt-2 w-full !py-2" disabled={busy} onClick={() => onSubmit(stars, comment)} data-testid="review-submit">
            {busy ? <Spinner className="h-4 w-4 text-white" /> : null} Submit review
          </button>
        </>
      ) : null}
    </div>
  );
}

/** Scam Guard "Hold" step: a short, deliberate pause with checks before any payment action. */
function HoldSheet({ open, onClose, amount, upi, name, title, status }: { open: boolean; onClose: () => void; amount: number; upi: string; name: string; title: string; status: DealStatus }) {
  const [secs, setSecs] = useState(5);
  const [checks, setChecks] = useState([false, false, false]);
  const [stage, setStage] = useState<"hold" | "pay">("hold");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setSecs(5);
    setStage("hold");
    setChecks([false, false, false]);
    /* eslint-enable react-hooks/set-state-in-effect */
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [open]);

  const items = [
    status === "agreed" ? `I've seen the item or agreed the work with ${name} in person or in chat` : `The item or work from ${name} is as agreed`,
    "Nobody asked me to scan a QR, share an OTP or “approve a request” to receive money",
    `I'm paying ${name} directly. No advance to a different person or number`,
  ];
  const upiLink = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Pactly: ${title}`.slice(0, 50))}`;

  return (
    <Sheet open={open} onClose={onClose} title={stage === "hold" ? "Hold on: quick safety check" : `Pay ${name}`}>
      {stage === "hold" ? (
        <div data-testid="hold-sheet">
          <p className="mb-3 rounded-xl bg-warning-soft p-3 text-sm text-warning-ink"><Icon name="shield" className="mr-1 h-[1.05em] w-[1.05em]" />Scam Guard pauses every payment for a few seconds. Most campus scams rush you.</p>
          <div className="space-y-2">
            {items.map((t, i) => (
              <label key={i} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={checks[i]} onChange={(e) => setChecks(checks.map((c, j) => (j === i ? e.target.checked : c)))} data-testid={`hold-check-${i}`} />
                {t}
              </label>
            ))}
          </div>
          <button className="btn btn-primary mt-4 w-full !py-3" disabled={secs > 0 || checks.some((c) => !c)} onClick={() => setStage("pay")} data-testid="hold-continue">
            {secs > 0 ? `Wait ${secs}s…` : checks.some((c) => !c) ? "Tick all three to continue" : "Continue to payment"}
          </button>
        </div>
      ) : (
        <div className="space-y-3" data-testid="pay-details">
          <div className="rounded-2xl bg-bg p-4 text-center">
            <p className="text-xs text-muted">Amount</p>
            <p className="font-display text-3xl font-bold">{rupees(amount)}</p>
            <p className="mt-2 text-xs text-muted">UPI ID</p>
            <p className="font-mono text-base font-semibold" data-testid="upi-id">{upi}</p>
          </div>
          <a href={upiLink} className="btn btn-primary w-full !py-3">Open UPI app</a>
          <button
            className="btn btn-ghost w-full"
            onClick={async () => {
              await navigator.clipboard?.writeText(upi).catch(() => {});
              setCopied(true);
            }}
          >
            {copied ? "Copied ✓" : "Copy UPI ID"}
          </button>
          <p className="text-center text-[11px] text-muted">Pactly never holds your money. You pay {name} directly.</p>
        </div>
      )}
    </Sheet>
  );
}
