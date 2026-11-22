"use client";

import { useEffect, useState } from "react";
import type { Message } from "@nexconn/chat";
import { meetupMetadata, type MeetupContent, type MeetupStatus } from "@/lib/nexconn/messages";
import { Icon, Sheet, Spinner } from "../ui";

/** Public, well-lit campus spots. Suggesting these nudges people away from meeting somewhere isolated. */
export const MEETUP_SPOTS = ["Main gate", "Library entrance", "Food court", "Hostel gate", "Admin block", "Bus stop"];

export function meetupWhen(at: number, now = Date.now()) {
  const d = new Date(at);
  const today = new Date(now);
  const tomorrow = new Date(now + 86_400_000);
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;
  return d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function countdown(at: number, now = Date.now()) {
  const mins = Math.round((at - now) / 60_000);
  if (mins < -30) return "time passed";
  if (mins <= 0) return "now";
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return h < 24 ? `in ${h}h${m ? ` ${m}m` : ""}` : `in ${Math.round(h / 24)}d`;
}

/** Reads the live meetup state: metadata (latest edit) overrides the original content. */
export function meetupState(message: Message<MeetupContent>, local?: Record<string, string> | null) {
  const remote = message.metadata;
  const pick = (k: string) => {
    const lv = local && Number(local.v ?? 0) >= Number(remote?.get("v") ?? 0) ? local[k] : undefined;
    return lv ?? (remote?.get(k) as string | undefined);
  };
  return {
    spot: pick("spot") ?? message.content.spot,
    at: Number(pick("at") ?? message.content.at),
    status: (pick("status") as MeetupStatus | undefined) ?? "proposed",
    by: pick("by") ?? message.senderUserId,
  };
}

function useNow(everyMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

export function MeetupCard({ message, myNx, otherFirst, onEvent }: { message: Message<MeetupContent>; metaTick: number; myNx: string; otherFirst: string; onEvent: (t: string) => void }) {
  const [local, setLocal] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useNow();
  const s = meetupState(message, local);
  const mineProposal = s.by === myNx;

  async function update(spot: string, at: number, status: MeetupStatus, event: string) {
    setBusy(true);
    setError(null);
    const meta = meetupMetadata(spot, at, status, myNx);
    // Same card, edited in place for both people via Nexconn message metadata.
    const r = await message.setMetadata(meta);
    setBusy(false);
    if (!r.isOk) return setError(`Couldn't update the meetup (code ${r.code}).`);
    setLocal(meta);
    // Mirror our own edit onto the local message too (the SDK only reports the other side's edits),
    // so the chat's meetup reminder sees it. The event pill below re-renders the chat.
    const map = message.metadata as Map<string, string> | undefined;
    if (map && typeof map.set === "function") for (const [k, v] of Object.entries(meta)) map.set(k, v);
    setEditing(false);
    onEvent(event);
  }

  const tone = s.status === "accepted" ? "bg-success-soft text-success-ink" : s.status === "cancelled" ? "bg-bg text-muted" : "bg-warning-soft text-warning-ink";
  const label = s.status === "accepted" ? "Confirmed" : s.status === "cancelled" ? "Cancelled" : "Proposed";
  const soon = s.status === "accepted" && s.at - now <= 15 * 60_000 && s.at - now > -30 * 60_000;

  return (
    <div className="w-[min(300px,82vw)] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm" data-testid="meetup-card" data-status={s.status}>
      <div className="flex items-center justify-between border-b border-line bg-primary-soft/60 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary"><Icon name="pin" className="mr-1 h-[1.05em] w-[1.05em]" />Meetup</p>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tone}`} data-testid="meetup-status">{label}</span>
      </div>
      <div className="p-3">
        <p className={`font-display text-lg font-bold leading-tight ${s.status === "cancelled" ? "text-muted line-through" : ""}`} data-testid="meetup-spot">{s.spot}</p>
        <p className="text-sm text-ink/80" data-testid="meetup-time">
          <Icon name="clock" className="mr-1 h-[1.05em] w-[1.05em]" />{meetupWhen(s.at, now)}
          {s.status !== "cancelled" ? <span className="text-muted"> · {countdown(s.at, now)}</span> : null}
        </p>

        {soon ? (
          <p className="mt-2 rounded-xl bg-warning-soft p-2 text-xs text-warning-ink" data-testid="meetup-soon">
            <Icon name="alarm" className="mr-1 h-[1.05em] w-[1.05em]" />Meetup {countdown(s.at, now)}. Check the item first, then share your handover code.
          </p>
        ) : null}

        {s.status === "proposed" && !mineProposal ? (
          <div className="mt-3 flex gap-2">
            <button className="btn btn-success flex-1 !py-2" disabled={busy} onClick={() => update(s.spot, s.at, "accepted", `📍 Meetup confirmed: ${s.spot}, ${meetupWhen(s.at)}`)} data-testid="meetup-accept">
              {busy ? <Spinner className="h-4 w-4 text-white" /> : null} Accept
            </button>
            <button className="btn btn-ghost flex-1 !py-2" disabled={busy} onClick={() => setEditing(true)} data-testid="meetup-suggest">Suggest another</button>
          </div>
        ) : s.status === "proposed" ? (
          <p className="mt-2 text-xs text-muted">Waiting for {otherFirst} to accept or suggest another time.</p>
        ) : null}

        {s.status === "accepted" ? (
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-success-ink">✓ You both agreed</span>
            <button className="font-medium text-primary underline" onClick={() => setEditing(true)} data-testid="meetup-change">Change</button>
          </div>
        ) : null}

        {s.status !== "cancelled" && mineProposal && s.status === "proposed" ? (
          <button className="mt-1 text-xs font-medium text-muted underline" disabled={busy} onClick={() => update(s.spot, s.at, "cancelled", "📍 Meetup cancelled")}>Cancel</button>
        ) : null}
        {error ? <p className="mt-2 text-xs text-danger" role="alert">{error}</p> : null}
      </div>

      <MeetupSheet
        open={editing}
        onClose={() => setEditing(false)}
        title="Suggest another time or place"
        initialSpot={s.spot}
        onSubmit={(spot, at) => update(spot, at, "proposed", `📍 New meetup suggested: ${spot}, ${meetupWhen(at)}`)}
      />
    </div>
  );
}

function toLocalInput(ts: number) {
  const d = new Date(ts - new Date(ts).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

function presetTimes(now: number) {
  const at = (dayOffset: number, h: number) => {
    const d = new Date(now + dayOffset * 86_400_000);
    d.setHours(h, 0, 0, 0);
    return d.getTime();
  };
  const in30 = Math.ceil((now + 30 * 60_000) / (15 * 60_000)) * 15 * 60_000;
  const list: [string, number][] = [["In 30 min", in30]];
  if (at(0, 17) > now + 20 * 60_000) list.push(["Today 5 pm", at(0, 17)]);
  if (at(0, 19) > now + 20 * 60_000) list.push(["Today 7 pm", at(0, 19)]);
  list.push(["Tomorrow 10 am", at(1, 10)], ["Tomorrow 5 pm", at(1, 17)]);
  return list;
}

/** Pick a public campus spot and a time. Used to propose a meetup and to suggest a change. */
export function MeetupSheet({ open, onClose, onSubmit, title = "Propose a meetup", initialSpot }: { open: boolean; onClose: () => void; onSubmit: (spot: string, at: number) => Promise<void> | void; title?: string; initialSpot?: string }) {
  const [spot, setSpot] = useState(initialSpot ?? MEETUP_SPOTS[0]);
  const [custom, setCustom] = useState("");
  const [at, setAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!open) return;
    const n = Date.now();
    /* eslint-disable react-hooks/set-state-in-effect */
    setNow(n);
    setAt(presetTimes(n)[0][1]);
    setCustom("");
    setSpot(initialSpot ?? MEETUP_SPOTS[0]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, initialSpot]);

  const place = custom.trim() || spot;
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="space-y-4" data-testid="meetup-sheet">
        <div>
          <p className="mb-2 text-sm font-semibold">Where</p>
          <div className="flex flex-wrap gap-1.5">
            {MEETUP_SPOTS.map((p) => (
              <button key={p} type="button" onClick={() => { setSpot(p); setCustom(""); }} className={`rounded-full border px-3 py-1.5 text-sm ${!custom && spot === p ? "border-primary bg-primary text-white" : "border-line"}`} data-testid="meetup-spot-chip">
                {p}
              </button>
            ))}
          </div>
          <input className="input mt-2 !py-2 text-sm" placeholder="Or type a place (e.g. CSE block lobby)" value={custom} onChange={(e) => setCustom(e.target.value.slice(0, 60))} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">When</p>
          <div className="flex flex-wrap gap-1.5">
            {now
              ? presetTimes(now).map(([label, ts]) => (
                  <button key={label} type="button" onClick={() => setAt(ts)} className={`rounded-full border px-3 py-1.5 text-sm ${at === ts ? "border-primary bg-primary text-white" : "border-line"}`} data-testid="meetup-time-chip">
                    {label}
                  </button>
                ))
              : null}
          </div>
          <input
            type="datetime-local"
            className="input mt-2 !py-2 text-sm"
            value={at ? toLocalInput(at) : ""}
            min={now ? toLocalInput(now) : undefined}
            onChange={(e) => e.target.value && setAt(new Date(e.target.value).getTime())}
            aria-label="Meetup date and time"
          />
        </div>
        <p className="rounded-xl bg-bg p-2 text-xs text-muted"><Icon name="shield" className="mr-1 h-[1.05em] w-[1.05em]" />Meet in a busy, public place on campus. Check the item before you pay.</p>
        <button
          className="btn btn-primary w-full !py-3"
          disabled={!at || busy || !place}
          onClick={async () => {
            if (!at) return;
            setBusy(true);
            try {
              await onSubmit(place, at);
            } finally {
              setBusy(false);
            }
          }}
          data-testid="meetup-send"
        >
          {busy ? <Spinner className="h-4 w-4 text-white" /> : null} {at ? `Send: ${place}, ${meetupWhen(at, now)}` : "Pick a time"}
        </button>
      </div>
    </Sheet>
  );
}
