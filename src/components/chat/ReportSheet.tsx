"use client";

import { useState } from "react";
import { Icon, Sheet, Spinner } from "../ui";

const REASONS = [
  ["harassment", "Harassment", "Abuse, threats or unwanted contact"],
  ["scam", "Scam", "Asks for advance money, OTP or QR tricks"],
  ["safety", "Safety", "Makes me feel unsafe offline"],
  ["inappropriate", "Inappropriate", "Sexual, hateful or offensive content"],
  ["other", "Other", "Something else"],
] as const;

export function ReportSheet({ open, onClose, onSubmit, preview }: { open: boolean; onClose: () => void; onSubmit: (reason: string, note: string) => Promise<number>; preview: string }) {
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setReason("");
    setNote("");
    setDone(null);
    setError(null);
    onClose();
  }

  return (
    <Sheet open={open} onClose={close} title={done !== null ? "Report sent" : "Report message"}>
      {done !== null ? (
        <div className="space-y-3 text-center" data-testid="report-done">
          <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Icon name="shield" className="h-7 w-7" /></span>
          <p className="text-sm text-muted">Thanks. Moderators will review it with {done} messages of context. You can also block this person from the chat menu.</p>
          <button className="btn btn-primary w-full" onClick={close}>Done</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="line-clamp-2 rounded-xl bg-bg p-3 text-sm italic text-muted">“{preview}”</p>
          <div className="space-y-2" role="radiogroup">
            {REASONS.map(([k, label, body]) => (
              <button key={k} role="radio" aria-checked={reason === k} onClick={() => setReason(k)} className={`card flex w-full items-center justify-between p-3 text-left ${reason === k ? "!border-primary ring-2 ring-primary-soft" : ""}`} data-testid={`reason-${k}`}>
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="text-xs text-muted">{body}</span>
                </span>
                {reason === k ? <span className="text-primary">●</span> : null}
              </button>
            ))}
          </div>
          <textarea className="input min-h-16 text-sm" placeholder="Anything else moderators should know? (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          <p className="text-xs text-muted"><Icon name="clip" className="mr-1 h-[1.05em] w-[1.05em]" />The 10 messages before and after this one are attached automatically as evidence.</p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button
            className="btn btn-danger w-full !py-3 !bg-danger !text-white"
            disabled={!reason || busy}
            data-testid="report-submit"
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                setDone(await onSubmit(reason, note));
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not send report.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <Spinner className="h-4 w-4 text-white" /> : null} Send report
          </button>
        </div>
      )}
    </Sheet>
  );
}
