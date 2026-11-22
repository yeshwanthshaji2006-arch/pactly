"use client";

import Link from "next/link";
import type { Message } from "@nexconn/chat";
import type { ReceiptContent } from "@/lib/nexconn/messages";
import { rupees } from "@/lib/format";
import { Icon } from "@/components/ui";

/** "a3f9 c21e 08b4 7d10": the start of the seal, grouped so people can compare it by eye. */
export const shortSeal = (hash: string) => (hash.slice(0, 16).match(/.{1,4}/g) ?? []).join(" ");

/** The Sealed Receipt: the final terms of a finished deal, with a SHA-256 seal anyone in the deal can verify. */
export function ReceiptCard({ message }: { message: Message<ReceiptContent> }) {
  const c = message.content;
  const sealed = c.sealedAt ? new Date(c.sealedAt) : null;
  return (
    <div className="w-[min(300px,82vw)] overflow-hidden rounded-2xl border-2 border-dashed border-success/60 bg-surface shadow-sm" data-testid="receipt-card">
      <div className="flex items-center justify-between bg-success-soft px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-success-ink"><Icon name="receipt" className="mr-1 h-[1.05em] w-[1.05em]" />Sealed receipt</p>
        <span className="text-[11px] font-semibold text-success-ink">{c.handover ? <><Icon name="key" className="mr-1 h-3 w-3" />Handover verified</> : <><Icon name="check" className="mr-1 h-3 w-3" />Both confirmed</>}</span>
      </div>
      <div className="space-y-2 p-3 text-sm">
        <p className="line-clamp-2 font-semibold">{c.title}</p>
        <div className="flex items-end justify-between">
          <p className="font-display text-2xl font-bold" data-testid="receipt-price">{rupees(c.price)}</p>
          {c.price !== c.originalPrice ? <p className="text-xs text-muted">listed {rupees(c.originalPrice)}</p> : null}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted">Paid by</dt>
          <dd className="truncate font-medium">{c.payerName}</dd>
          <dt className="text-muted">Paid to</dt>
          <dd className="truncate font-medium">{c.payeeName}</dd>
          <dt className="text-muted">Sealed</dt>
          <dd>{sealed ? sealed.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</dd>
        </dl>
        <div className="rounded-xl bg-bg p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Seal (SHA-256)</p>
          <p className="font-mono text-xs font-semibold tracking-wide" data-testid="receipt-seal">{shortSeal(c.hash)}…</p>
        </div>
        <Link href={`/receipt/${c.dealId}?h=${c.hash}`} className="btn btn-soft w-full !py-2 text-sm" data-testid="receipt-verify">
          Verify seal
        </Link>
      </div>
    </div>
  );
}
