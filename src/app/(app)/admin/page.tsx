import Link from "next/link";
import { getSessionProfile } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AdminActions, ReportActions } from "./AdminActions";
import { ruleById } from "@/lib/scamGuard";
import { timeAgo, yearLabel } from "@/lib/format";
import { Icon } from "@/components/ui";

type Evidence = { id: string; from: string; fromName: string; text: string; at: number; reported?: boolean };

export default async function AdminPage() {
  const me = await getSessionProfile();
  if (me?.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Icon name="lock" className="h-7 w-7" /></span>
        <h1 className="mt-2 font-display text-xl font-bold">Admins only</h1>
        <p className="mt-1 text-sm text-muted">This page is for campus moderators.</p>
        <Link href="/" className="btn btn-primary mt-4">Back to feed</Link>
      </div>
    );
  }
  const admin = supabaseAdmin();
  const head = { count: "exact" as const, head: true };
  const [users, verified, posts, deals, sealed, rides, reportsN, flagsN, sealedRows] = await Promise.all([
    admin.from("profiles").select("*", head).then((r) => r.count ?? 0),
    admin.from("profiles").select("*", head).eq("verification_status", "verified").then((r) => r.count ?? 0),
    admin.from("posts").select("*", head).then((r) => r.count ?? 0),
    admin.from("deals").select("*", head).then((r) => r.count ?? 0),
    admin.from("deals").select("*", head).in("status", ["done", "reviewed"]).then((r) => r.count ?? 0),
    admin.from("ride_bookings").select("*", head).eq("status", "booked").then((r) => r.count ?? 0),
    admin.from("reports").select("*", head).then((r) => r.count ?? 0),
    admin.from("scam_flags").select("*", head).then((r) => r.count ?? 0),
    admin.from("deals").select("price").in("status", ["done", "reviewed"]),
  ]);
  const value = (sealedRows.data ?? []).reduce((s2, d) => s2 + (d.price as number), 0);
  const stats: [string, string | number][] = [
    ["Students", users],
    ["Verified", verified],
    ["Posts", posts],
    ["Deals started", deals],
    ["Deals sealed", sealed],
    ["Value sealed", `₹${value.toLocaleString("en-IN")}`],
    ["Seats booked", rides],
    ["Scam warnings", flagsN],
    ["Reports", reportsN],
  ];
  const [{ data: pending }, { data: reports }, { data: flags }] = await Promise.all([
    admin.from("profiles").select("id, full_name, department, year, created_at, campus:campuses(name), private:profile_private(id_card_path, id_submitted_at)").eq("verification_status", "pending").order("created_at"),
    admin.from("reports").select("*, reporter:profiles!reports_reporter_id_fkey(full_name), reported:profiles!reports_reported_user_id_fkey(full_name, trust_score)").order("created_at", { ascending: false }).limit(30),
    admin.from("scam_flags").select("*, sender:profiles(full_name)").order("created_at", { ascending: false }).limit(15),
  ]);

  // ID images are private: sign short-lived URLs on the server, only for admins.
  const pendingWithUrls = await Promise.all(
    (pending ?? []).map(async (p) => {
      const priv = Array.isArray(p.private) ? p.private[0] : p.private;
      const path = priv?.id_card_path as string | undefined;
      const signed = path ? await admin.storage.from("id-cards").createSignedUrl(path, 600) : null;
      return { ...p, idUrl: signed?.data?.signedUrl ?? null, submitted: priv?.id_submitted_at as string | null };
    }),
  );
  const open = (reports ?? []).filter((r) => r.status === "open");
  const closed = (reports ?? []).filter((r) => r.status !== "open");

  return (
    <div className="space-y-6 px-4 pb-8 pt-4">
      <div>
        <h1 className="font-display text-2xl font-bold"><Icon name="shield" className="mr-1 h-[1.05em] w-[1.05em]" />Moderation</h1>
        <p className="text-sm text-muted">{pendingWithUrls.length} pending verifications · {open.length} open reports</p>
      </div>

      <section data-testid="admin-stats">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">Pactly in numbers</h2>
        <div className="grid grid-cols-3 gap-2">
          {stats.map(([label, v]) => (
            <div key={label} className="card p-3 text-center">
              <p className="font-display text-xl font-bold text-primary">{v}</p>
              <p className="text-[11px] font-medium text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3" data-testid="admin-verifications">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Verifications</h2>
        {pendingWithUrls.length === 0 ? <p className="card p-4 text-sm text-muted">All caught up. No pending IDs.</p> : null}
        {pendingWithUrls.map((p) => (
          <div key={p.id} className="card overflow-hidden" data-testid="pending-row">
            {p.idUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.idUrl} alt={`College ID of ${p.full_name}`} className="max-h-56 w-full bg-bg object-contain" />
            ) : (
              <p className="bg-bg p-6 text-center text-sm text-muted">No ID image</p>
            )}
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.full_name}</p>
                <p className="truncate text-xs text-muted">
                  {[p.department, yearLabel(p.year), (p.campus as unknown as { name: string } | null)?.name].filter(Boolean).join(" · ")} · {p.submitted ? timeAgo(p.submitted) : ""}
                </p>
              </div>
              <AdminActions userId={p.id} />
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3" data-testid="admin-reports">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Reports</h2>
        {open.length === 0 ? <p className="card p-4 text-sm text-muted">No open reports.</p> : null}
        {[...open, ...closed].map((r) => (
          <details key={r.id} className="card p-3" open={r.status === "open"} data-testid="report-row">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  <span className="mr-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold uppercase text-danger">{r.reason}</span>
                  {r.reported?.full_name ?? "Unknown"} <span className="font-normal text-muted">(trust {r.reported?.trust_score ?? "?"})</span>
                </span>
                <span className="text-xs text-muted">by {r.reporter?.full_name} · {timeAgo(r.created_at)} · {(r.evidence as Evidence[]).length} msgs of evidence</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.status === "open" ? "bg-warning-soft text-warning-ink" : "bg-bg text-muted"}`}>{r.status}</span>
            </summary>
            {r.note ? <p className="mt-2 rounded-xl bg-bg p-2 text-sm">“{r.note}”</p> : null}
            <ol className="mt-2 max-h-72 space-y-1 overflow-y-auto rounded-xl bg-bg p-2 text-xs" data-testid="evidence">
              {(r.evidence as Evidence[]).map((e) => (
                <li key={e.id + e.at} className={`rounded-lg px-2 py-1 ${e.reported ? "bg-danger-soft font-semibold text-danger ring-1 ring-danger/30" : ""}`}>
                  <span className="text-muted">{new Date(e.at).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })} · </span>
                  <b>{e.fromName}:</b> {e.text}
                  {e.reported ? " ← reported" : ""}
                </li>
              ))}
            </ol>
            {r.status === "open" ? <ReportActions id={r.id} /> : null}
          </details>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Scam Guard flags (server-checked)</h2>
        {(flags ?? []).length === 0 ? <p className="card p-4 text-sm text-muted">No flags yet.</p> : null}
        {(flags ?? []).map((f) => (
          <div key={f.id} className="card p-3 text-sm">
            <p><b>{f.sender?.full_name ?? "Unknown"}</b> · <span className="text-muted">{timeAgo(f.created_at)}</span></p>
            <p className="text-xs text-danger">{(f.rule_ids as string[]).map((id) => ruleById(id)?.title ?? id).join(" · ")}</p>
            <p className="truncate text-xs text-muted">“{f.excerpt}”</p>
          </div>
        ))}
      </section>
    </div>
  );
}
