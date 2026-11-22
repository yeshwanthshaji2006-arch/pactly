"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";

export function AdminActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function decide(decision: "verified" | "rejected") {
    setBusy(decision);
    setErr(null);
    const r = await fetch("/api/admin/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, decision }) });
    setBusy(null);
    if (!r.ok) return setErr((await r.json()).error ?? "Failed");
    router.refresh();
  }
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex gap-2">
        <button className="btn btn-danger !px-3 !py-1.5 text-xs" disabled={!!busy} onClick={() => decide("rejected")}>{busy === "rejected" ? <Spinner className="h-3 w-3" /> : "Reject"}</button>
        <button className="btn btn-success !px-3 !py-1.5 text-xs" disabled={!!busy} onClick={() => decide("verified")} data-testid="approve">{busy === "verified" ? <Spinner className="h-3 w-3 text-white" /> : "Approve"}</button>
      </div>
      {err ? <span className="text-[11px] text-danger">{err}</span> : null}
    </div>
  );
}

export function ReportActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function set(status: "actioned" | "dismissed") {
    setBusy(true);
    await fetch(`/api/admin/reports/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="mt-2 flex gap-2">
      <button className="btn btn-ghost flex-1 !py-1.5 text-xs" disabled={busy} onClick={() => set("dismissed")}>Dismiss</button>
      <button className="btn btn-primary flex-1 !py-1.5 text-xs" disabled={busy} onClick={() => set("actioned")} data-testid="report-actioned">Mark actioned</button>
    </div>
  );
}
