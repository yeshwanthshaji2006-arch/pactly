"use client";

import { useEffect, useState } from "react";
import type { Message } from "@nexconn/chat";
import { PAYMENT_QR_HIT, ruleById, scanText, type ScamHit } from "@/lib/scamGuard";
import { classifyQr } from "@/lib/qr";
import { Icon } from "@/components/ui";

type ImageContent = { remoteUrl?: string; thumbnailBase64?: string };

const reported = new Set<string>();

/**
 * Client-side Scam Guard for one incoming message: text rules, plus payment-QR detection on images
 * (sender-side flag in message metadata + receiver-side decode of the inline thumbnail / original).
 */
export function useScamHits(msg: Message, isIncoming: boolean): ScamHit[] {
  const isText = msg.messageType === "RC:TxtMsg";
  const isImage = msg.messageType === "RC:ImgMsg";
  const text = isText ? ((msg.content as { text?: string }).text ?? "") : "";
  const flagged = msg.metadata?.get?.("scan");
  const [qr, setQr] = useState<"payment" | "qr" | null>(null);

  useEffect(() => {
    if (!isIncoming || !isImage || flagged) return;
    let cancelled = false;
    const c = msg.content as ImageContent;
    (async () => {
      let r: "payment" | "qr" | null = null;
      if (c.thumbnailBase64) r = await classifyQr(`data:image/jpeg;base64,${c.thumbnailBase64}`);
      if (!r && c.remoteUrl) r = await classifyQr(c.remoteUrl);
      if (!cancelled) setQr(r);
    })();
    return () => {
      cancelled = true;
    };
  }, [isIncoming, isImage, flagged, msg]);

  const hits: ScamHit[] = [];
  if (isIncoming) {
    if (isText) hits.push(...scanText(text));
    if (isImage && (flagged === "payment_qr" || qr === "payment")) hits.unshift(PAYMENT_QR_HIT);
    else if (isImage && (flagged === "qr" || qr === "qr")) hits.unshift({ ...PAYMENT_QR_HIT, id: "qr", title: "QR code received", severity: "medium" });
  }
  const hitKey = hits.map((h) => h.id).join(",");

  // Report once to the server-side check, which re-verifies and records it for moderators.
  useEffect(() => {
    if (!hitKey || !msg.messageId || reported.has(msg.messageId)) return;
    reported.add(msg.messageId);
    fetch("/api/scam/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msg.messageId, text, senderNexconnId: msg.senderUserId, paymentQr: hitKey.includes("payment_qr") }),
    }).catch(() => {});
  }, [hitKey, msg.messageId, msg.senderUserId, text]);

  return hits;
}

export function ScamBanner({ hits, onReport }: { hits: ScamHit[]; onReport: () => void }) {
  const [hidden, setHidden] = useState(false);
  if (!hits.length || hidden) return null;
  const top = hits[0];
  const high = hits.some((h) => h.severity === "high");
  return (
    <div className={`mt-1 max-w-[85%] rounded-2xl border p-3 text-sm ${high ? "border-danger/30 bg-danger-soft" : "border-warning/40 bg-warning-soft"}`} role="alert" data-testid="scam-banner">
      <p className={`flex items-center gap-1.5 font-semibold ${high ? "text-danger" : "text-warning-ink"}`}>
        <Icon name="shield" className="mr-1 h-[1.05em] w-[1.05em]" />Scam Guard · {top.title}
      </p>
      <p className="mt-1 text-ink/85">{top.explain}</p>
      {hits.length > 1 ? <p className="mt-1 text-xs text-muted">Also flagged: {hits.slice(1).map((h) => h.title).join(", ")}</p> : null}
      <div className="mt-2 flex gap-2">
        <button className="rounded-full bg-surface px-3 py-1 text-xs font-semibold ring-1 ring-line" onClick={() => setHidden(true)}>Got it</button>
        <button className="rounded-full bg-danger px-3 py-1 text-xs font-semibold text-white" onClick={onReport}>Report</button>
      </div>
    </div>
  );
}

export { ruleById };
