"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { initials } from "@/lib/format";
import type { PostType, PublicProfile } from "@/lib/types";

const AVATAR_TINTS = ["#0d6b63", "#3b6fb6", "#c2671c", "#b4446c", "#4d7c3a", "#6a54b0", "#1f7a8c", "#a8463a"];

/* ---------- Icons: line SVG, stroke = currentColor, 1.8 width ---------- */
const ICONS = {
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  bag: "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
  car: "M5 16V11l2-5h10l2 5v5M3 16h18v3h-3v-1H6v1H3v-3Zm4-2.5h.01M17 13.5h.01M5 11h14",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 3-4.3-4.3",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  alarm: "M12 20a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-10v3.5l2 1.5M5 3 2 6m17-3 3 3",
  hourglass: "M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9",
  shield: "M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6l-7-3Z",
  shieldCheck: "M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Z",
  unlock: "M7 11V8a5 5 0 0 1 9.6-2M6 11h12v9H6v-9Z",
  key: "M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-1.5 2.5L20 18l-2 2m-2-2 1.5-1.5",
  check: "M5 12.5 10 17 19 7",
  checks: "M2 12.5 6.5 17 15 7m-4 10 1 1 9-11",
  checkCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-4-9 3 3 5-6",
  close: "M6 6l12 12M18 6 6 18",
  chat: "M4 5h16v11H8l-4 4V5Z",
  handshake: "M2 11l4-4 3 1 3-2 3 2 3-1 4 4M2 11l6 6 2-2 2 2 2-2 2 2 6-6M9 13l3-3",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6m-6 4h3",
  camera: "M4 8h3l2-3h6l2 3h3v11H4V8Zm8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  clip: "M20 11.5 12 19.5a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7",
  send: "M4 12 20 4l-6 16-3-7-7-1Z",
  flag: "M5 21V4h11l-2 4 2 4H5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0",
  ban: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM5.6 5.6l12.8 12.8",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z",
  archive: "M3 5h18v4H3V5Zm2 4v10h14V9M10 13h4",
  wave: "M7 11V6.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0 0V5.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-12.6 4.2L4 14a1.5 1.5 0 0 1 2.4-1.8L7 13",
  sprout: "M12 21v-9m0 0c0-4-3-6-7-6 0 4 3 6 7 6Zm0 0c0-4 3-7 7-7 0 4-3 7-7 7Z",
  note: "M6 3h9l4 4v14H6V3Zm9 0v4h4M9 12h7m-7 4h5",
  folder: "M3 6h6l2 2h10v11H3V6Z",
  tool: "M14.5 6.5a4 4 0 0 0 5 5L12 19a2 2 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2ZM5 5l3 3",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z",
  idCard: "M3 6h18v12H3V6Zm5 3.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6ZM5.5 16a2.5 2.5 0 0 1 5 0M14 10h4m-4 3h3",
  flask: "M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 15h10",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z",
  pinned: "M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5Zm3 10v6",
  warning: "M12 4 2.5 20h19L12 4Zm0 6v4m0 3h.01",
  copy: "M8 8h11v12H8V8ZM5 16V4h11",
  walk: "M13 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM9 22l2-7 3 3v4m-5-11 2-4 3 1 2 3 3 1M9 10l-2 4",
  thanks: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  plus: "M12 5v14M5 12h14",
  chevronRight: "m9 6 6 6-6 6",
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className = "h-4 w-4", strokeWidth = 1.8 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={`icon ${className}`} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Icon tile used in empty states, sheets and list rows. */
export function IconTile({ name, className = "h-11 w-11 bg-primary-soft text-primary", iconClass = "h-5 w-5" }: { name: IconName; className?: string; iconClass?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-2xl ${className}`}>
      <Icon name={name} className={iconClass} />
    </span>
  );
}

export function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      Pactly<span className="logo-dot">.</span>
    </span>
  );
}

export function Avatar({ name, url, size = 40, id }: { name: string; url?: string | null; size?: number; id?: string }) {
  const seed = (id || name).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} width={size} height={size} loading="lazy" decoding="async" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-label={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: AVATAR_TINTS[seed % AVATAR_TINTS.length], fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

/** Rating chip: brand-new users show "New" instead of a fake 5.0★. */
export function RatingChip({ avg, count }: { avg: number; count: number }) {
  if (!count) return <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">New</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-ink">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-accent" fill="currentColor" aria-hidden><path d={ICONS.star} /></svg>
      {Number(avg).toFixed(1)} <span className="font-normal text-muted">({count})</span>
    </span>
  );
}

export function TrustBadge({ profile, compact }: { profile: Pick<PublicProfile, "verification_status" | "trust_score">; compact?: boolean }) {
  const verified = profile.verification_status === "verified";
  const tone = profile.trust_score >= 75 ? "text-success-ink bg-success-soft" : profile.trust_score >= 50 ? "text-primary bg-primary-soft" : "text-warning-ink bg-warning-soft";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`} title={`Trust score ${profile.trust_score}/100`}>
      {verified ? <ShieldIcon className="h-3 w-3" /> : null}
      {compact ? profile.trust_score : `${verified ? "Verified · " : ""}Trust ${profile.trust_score}`}
    </span>
  );
}

export const TYPE_META: Record<PostType, { label: string; badge: string; icon: IconName; tile: string }> = {
  task: { label: "Task", badge: "bg-primary-soft text-primary", icon: "bolt", tile: "bg-primary-soft text-primary" },
  market: { label: "Market", badge: "bg-warning-soft text-warning-ink", icon: "bag", tile: "bg-warning-soft text-warning-ink" },
  ride: { label: "Ride", badge: "bg-success-soft text-success-ink", icon: "car", tile: "bg-success-soft text-success-ink" },
};

export function TypeBadge({ type, extra }: { type: PostType; extra?: string }) {
  const m = TYPE_META[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${m.badge}`}>
      <Icon name={m.icon} className="h-3 w-3" strokeWidth={2.2} />
      {m.label}
      {extra ? <span className="font-semibold normal-case opacity-80">· {extra}</span> : null}
    </span>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin text-primary ${className}`} viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="page-enter flex flex-col items-center px-6 py-14 text-center">
      <IconTile name={icon} className="mb-3 h-14 w-14 bg-primary-soft text-primary" iconClass="h-6 w-6" />
      <p className="font-display text-lg font-bold">{title}</p>
      {body ? <p className="mt-1 max-w-xs text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-4 my-6 rounded-[18px] border border-danger/20 bg-danger-soft p-4 text-sm text-danger" role="alert">
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1 opacity-90">{message}</p>
      {onRetry ? (
        <button className="btn btn-ghost mt-3 !py-1.5 text-ink" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <Icon name="shieldCheck" className={className} strokeWidth={2.2} />;
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  // Portal to <body> so sheets always sit above sticky/fixed UI (stacking contexts).
  return createPortal(
    <div className="sheet-backdrop fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[26px] bg-surface p-5 pb-safe sm:rounded-[26px]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted transition hover:bg-bg" aria-label="Close">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Toast({ text, tone = "ink" }: { text: string | null; tone?: "ink" | "danger" | "success" }) {
  if (!text) return null;
  const bg = tone === "danger" ? "bg-danger" : tone === "success" ? "bg-success" : "bg-ink";
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4" role="status">
      <div key={text} className={`toast-pop rounded-full px-4 py-2 text-sm font-medium text-white shadow-md ${bg}`}>{text}</div>
    </div>
  );
}
