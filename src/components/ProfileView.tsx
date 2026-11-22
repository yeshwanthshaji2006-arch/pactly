import { Avatar, RatingChip, ShieldIcon } from "./ui";
import { timeAgo, yearLabel } from "@/lib/format";
import type { Profile } from "@/lib/types";

export type ReviewRow = { id: string; rating: number; comment: string | null; created_at: string; reviewer: { full_name: string; avatar_url: string | null; id: string } | null };

/** Trust score breakdown, mirroring public.recompute_trust() in SQL. */
export function trustParts(p: Pick<Profile, "verification_status" | "full_name" | "avatar_url" | "department" | "year" | "skills" | "bio" | "completed_deals" | "rating_avg" | "rating_count">, invites: number) {
  const complete = [p.full_name, p.avatar_url, p.department && p.year ? "x" : "", p.skills?.length ? "x" : "", p.bio].filter(Boolean).length / 5;
  return [
    { label: "College ID verified", weight: 40, got: p.verification_status === "verified" ? 40 : 0 },
    { label: "Profile complete", weight: 20, got: Math.round(20 * complete) },
    { label: "Completed deals", weight: 20, got: Math.round((20 * Math.min(p.completed_deals, 5)) / 5) },
    { label: "Rating", weight: 10, got: p.rating_count ? Math.round((10 * Number(p.rating_avg)) / 5) : 0 },
    { label: "Campus invites", weight: 10, got: Math.round((10 * Math.min(invites, 3)) / 3) },
  ];
}

export function ProfileHeader({ p, campus }: { p: Profile; campus?: string }) {
  return (
    <div className="flex flex-col items-center px-4 pt-6 text-center">
      <Avatar name={p.full_name} url={p.avatar_url} size={88} id={p.id} />
      <h1 className="mt-3 font-display text-2xl font-bold">{p.full_name}</h1>
      <p className="text-sm text-muted">{[p.department, yearLabel(p.year), campus].filter(Boolean).join(" · ")}</p>
      <div className="mt-2 flex items-center gap-2">
        {p.verification_status === "verified" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success-ink"><ShieldIcon className="h-3.5 w-3.5" /> Verified student</span>
        ) : (
          <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold capitalize text-warning-ink">{p.verification_status === "unsubmitted" ? "Not verified" : `Verification ${p.verification_status}`}</span>
        )}
      </div>
      <div className="mt-4 grid w-full grid-cols-3 gap-2">
        <Stat label="Trust" value={<span data-testid="trust-score">{p.trust_score}</span>} />
        <Stat label="Rating" value={<RatingChip avg={p.rating_avg} count={p.rating_count} />} />
        <Stat label="Deals" value={p.completed_deals} />
      </div>
      {p.bio ? <p className="mt-4 text-sm text-ink/85">{p.bio}</p> : null}
      {p.skills?.length ? (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {p.skills.map((s) => <span key={s} className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">{s}</span>)}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card py-3">
      <div className="font-display text-xl font-bold">{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

export function TrustBreakdown({ parts }: { parts: ReturnType<typeof trustParts> }) {
  return (
    <div className="card p-4">
      <p className="mb-2 text-sm font-semibold">How trust is calculated</p>
      <ul className="space-y-2">
        {parts.map((x) => (
          <li key={x.label} className="text-sm">
            <div className="flex justify-between"><span>{x.label}</span><span className="font-semibold">{x.got}/{x.weight}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-line"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${(x.got / x.weight) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Reviews({ reviews }: { reviews: ReviewRow[] }) {
  return (
    <div className="card p-4">
      <p className="mb-2 text-sm font-semibold">Reviews</p>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="flex gap-3">
              <Avatar name={r.reviewer?.full_name ?? "?"} url={r.reviewer?.avatar_url} size={32} id={r.reviewer?.id} />
              <div className="min-w-0 flex-1">
                <p className="text-sm"><b>{r.reviewer?.full_name ?? "Student"}</b> <span className="text-warning">{"★".repeat(r.rating)}</span><span className="text-line">{"★".repeat(5 - r.rating)}</span></p>
                {r.comment ? <p className="text-sm text-ink/80">{r.comment}</p> : null}
                <p className="text-[11px] text-muted">{timeAgo(r.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
