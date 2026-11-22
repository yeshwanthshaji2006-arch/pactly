"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useChat } from "./chat/ChatProvider";
import { Icon, IconTile, Sheet, TYPE_META } from "./ui";
import { useMe } from "./ProfileProvider";

const ITEMS = [
  { href: "/", label: "Home", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" },
  { href: "/deals", label: "Deals", icon: "M4 7h16M4 12h10M4 17h7M17 14l2 2 3-4" },
  null,
  { href: "/messages", label: "Chats", icon: "M4 5h16v11H8l-4 4V5Z" },
  { href: "/profile", label: "Profile", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0" },
];

export function BottomNav() {
  const path = usePathname();
  const router = useRouter();
  const { totalUnread } = useChat();
  const me = useMe();
  const [open, setOpen] = useState(false);
  if (path.startsWith("/chat")) return null;

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line bg-surface/95 pb-safe backdrop-blur-md" aria-label="Main">
        <ul className="grid grid-cols-5 items-end px-2 pt-2">
          {ITEMS.map((it, i) =>
            it ? (
              <li key={it.href}>
                <Link href={it.href} aria-current={isActive(it.href) ? "page" : undefined} className={`relative flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition-colors ${isActive(it.href) ? "font-semibold text-primary" : "text-muted hover:text-ink"}`}>
                  {isActive(it.href) ? <span className="nav-bar absolute -top-2 h-[3px] w-8 rounded-full bg-primary" aria-hidden /> : null}
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={it.icon} />
                  </svg>
                  {it.label}
                  {it.href === "/messages" && totalUnread > 0 ? (
                    <span className="absolute right-3 top-0 min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-[18px] text-white" data-testid="nav-unread">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  ) : null}
                </Link>
              </li>
            ) : (
              <li key={`plus-${i}`} className="flex justify-center">
                <button
                  onClick={() => setOpen(true)}
                  className="-mt-7 flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary text-white ring-[5px] ring-bg transition hover:bg-primary-hover active:scale-95" style={{ boxShadow: "var(--shadow-glow)" }}
                  aria-label="Create a post"
                  data-testid="create-post"
                >
                  <Icon name="plus" className="h-6 w-6" strokeWidth={2.2} />
                </button>
              </li>
            ),
          )}
        </ul>
      </nav>
      <Sheet open={open} onClose={() => setOpen(false)} title="What do you want to post?">
        {me.verification_status !== "verified" ? (
          <p className="mb-3 rounded-xl bg-warning-soft p-3 text-sm text-warning-ink">
            Your college ID is still being verified. You can browse now, and you can post once it's approved.
          </p>
        ) : null}
        <div className="stagger grid gap-2">
          {(
            [
              ["task", "Task", "Get help or earn a reward: errands, notes, design, code."],
              ["market", "Market", "Sell or rent: books, cycles, calculators, hostel gear."],
              ["ride", "Ride", "Offer seats or find a ride, splitting fuel fairly."],
            ] as const
          ).map(([t, label, body]) => (
            <button
              key={t}
              disabled={me.verification_status !== "verified"}
              onClick={() => {
                setOpen(false);
                router.push(`/post/new?type=${t}`);
              }}
              className="card flex items-center gap-3 p-4 text-left disabled:opacity-50"
            >
              <IconTile name={TYPE_META[t].icon} className={`h-11 w-11 ${TYPE_META[t].tile}`} />
              <span>
                <span className="block font-semibold">{label}</span>
                <span className="block text-sm text-muted">{body}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
