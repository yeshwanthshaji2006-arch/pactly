"use client";

import { useState } from "react";
import Link from "next/link";
import { rupees, when } from "@/lib/format";
import type { RideManifest } from "@/lib/rideServer";
import { Icon, Avatar, Spinner } from "../ui";

/** Pinned card at the top of a Ride Room: route, time, seats left and each passenger's fare. */
export function RideRoomCard({ m, onComplete }: { m: RideManifest; onComplete: () => Promise<void> }) {
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const d = m.post.details;
  const total = m.passengers.reduce((s, p) => s + p.fare, 0);
  return (
    <div className="border-b border-line bg-surface px-3 py-2" data-testid="ride-card">
      <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-success-soft text-success-ink"><Icon name="pinned" className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{d.pickup} → {d.destination}</span>
          <span className="block text-xs text-muted">
            {when(d.depart_start)} · <b data-testid="seats-left">{d.seats_left}</b> of {d.seats_total} seats left · {rupees(m.post.price)}/seat
          </span>
        </span>
        <span className="text-muted">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-1.5 pb-1">
          <div className="flex items-center gap-2 text-sm">
            <Avatar name={m.driver.full_name} url={m.driver.avatar_url} size={24} id={m.driver.id} />
            <span className="flex-1 truncate">{m.driver.full_name} <span className="text-xs text-muted">· driver · {d.vehicle}</span></span>
          </div>
          {m.passengers.length === 0 ? <p className="text-xs text-muted">No passengers yet.</p> : null}
          {m.passengers.map((p) => (
            <div key={p.passenger_id} className="flex items-center gap-2 text-sm" data-testid="ride-passenger">
              <Avatar name={p.profile?.full_name ?? "?"} url={p.profile?.avatar_url} size={24} id={p.passenger_id} />
              <span className="flex-1 truncate">{p.profile?.full_name} <span className="text-xs text-muted">· {p.seats} seat{p.seats > 1 ? "s" : ""}</span></span>
              <span className="font-semibold">{rupees(p.fare)}</span>
            </div>
          ))}
          {m.passengers.length ? <p className="text-right text-xs text-muted">Total fuel share {rupees(total)}</p> : null}
          <div className="flex gap-2 pt-1">
            <Link href={`/post/${m.post.id}`} className="btn btn-ghost flex-1 !py-1.5 text-xs">Ride details</Link>
            {m.isDriver && !m.archived ? (
              <button
                className="btn btn-success flex-1 !py-1.5 text-xs"
                disabled={busy}
                data-testid="ride-complete"
                onClick={async () => {
                  if (!confirm("Mark this ride complete? The Ride Room will be archived (read-only).")) return;
                  setBusy(true);
                  await onComplete().finally(() => setBusy(false));
                }}
              >
                {busy ? <Spinner className="h-3 w-3 text-white" /> : null} Mark ride complete
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {m.archived ? <p className="mt-1 rounded-lg bg-bg px-2 py-1 text-center text-xs font-medium text-muted" data-testid="ride-archived"><Icon name="archive" className="mr-1 h-[1.05em] w-[1.05em]" />Ride completed. This room is archived and read-only.</p> : null}
    </div>
  );
}
