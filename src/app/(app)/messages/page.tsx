"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BaseChannel } from "@nexconn/chat";
import { loadChat } from "@/lib/nexconn/client";
import { channelKeyOf, TAGS, useChat, type TagId } from "@/components/chat/ChatProvider";
import { summarize } from "@/components/chat/summary";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Avatar, EmptyState, ErrorState, IconTile, Spinner } from "@/components/ui";
import { nexconnIdFromUuid, timeAgo, uuidFromNexconnId } from "@/lib/format";
import { useMe } from "@/components/ProfileProvider";

type Row = {
  key: string;
  kind: "d" | "g";
  id: string;
  unread: number;
  time: number;
  preview: string;
  mine: boolean;
  read: boolean;
};

type Filter = "all" | TagId;

type Names = Record<string, { name: string; avatar: string | null; id: string }>;
/** In-memory cache so returning to Chats shows the list instantly, then refreshes. */
const cache: { rows: Row[] | null; tagged: Record<TagId, Set<string>> | null; tagUnread: Record<TagId, number> | null; names: Names } = { rows: null, tagged: null, tagUnread: null, names: {} };

/** Conversation list straight from the Nexconn SDK, filtered by the user's Nexconn channel tags. */
export default function MessagesPage() {
  const chat = useChat();
  const me = useMe();
  const myNx = nexconnIdFromUuid(me.id);
  const [rows, setRows] = useState<Row[] | null>(() => cache.rows);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [tagged, setTagged] = useState<Record<TagId, Set<string>>>(() => cache.tagged ?? { tasks: new Set(), market: new Set(), rides: new Set() });
  const [tagUnread, setTagUnread] = useState<Record<TagId, number>>(() => cache.tagUnread ?? { tasks: 0, market: 0, rides: 0 });
  const [names, setNames] = useState<Names>(() => cache.names);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (cache.rows) setRefreshing(true);
    try {
      const m = await loadChat();
      const q = m.BaseChannel.createChannelsQuery({ pageSize: 50, channelTypes: [m.ChannelType.DIRECT, m.ChannelType.GROUP] });
      const r = await q.loadNextPage();
      if (!r.isOk) throw new Error(`Could not load chats (code ${r.code}).`);
      const channels = (r.data?.data ?? []) as BaseChannel[];

      // Read receipts for my latest message in direct chats
      const receiptChecks = channels.map(async (c) => {
        const lm = c.latestMessage;
        if (!lm || lm.senderUserId !== myNx || c.identifier.channelType !== m.ChannelType.DIRECT || !lm.messageId) return false;
        const info = await c.getMessageReadReceiptInfo([lm.messageId]).catch(() => null);
        return !!info?.isOk && (info.data?.[0]?.readCount ?? 0) > 0;
      });
      const reads = await Promise.all(receiptChecks);

      const list: Row[] = channels
        .map((c, i) => ({
          key: channelKeyOf(c.identifier),
          kind: (c.identifier.channelType === m.ChannelType.GROUP ? "g" : "d") as "d" | "g",
          id: c.identifier.channelId,
          unread: c.unreadCount,
          time: c.latestMessage?.sentTime ?? c.operationTime,
          preview: summarize(c.latestMessage),
          mine: c.latestMessage?.senderUserId === myNx,
          read: reads[i],
        }))
        .sort((a, b) => b.time - a.time);
      cache.rows = list;
      setRows(list);
      setError(null);

      // Tags → filter sets + per-tag unread counts (Nexconn Tag API)
      const tags = await m.Tag.getTags();
      if (tags.isOk && tags.data) {
        const sets: Record<TagId, Set<string>> = { tasks: new Set(), market: new Set(), rides: new Set() };
        const unread: Record<TagId, number> = { tasks: 0, market: 0, rides: 0 };
        await Promise.all(
          tags.data
            .filter((t) => (TAGS.map((x) => x.id) as string[]).includes(t.tagId))
            .map(async (t) => {
              const id = t.tagId as TagId;
              const tq = m.Tag.createTaggedChannelsQuery({ tagId: id, pageSize: 50 });
              const page = await tq.loadNextPage();
              for (const c of page.data?.data ?? []) sets[id].add(channelKeyOf(c.identifier));
              const u = await t.getUnreadCount(false);
              unread[id] = u.isOk ? (u.data ?? 0) : 0;
            }),
        );
        cache.tagged = sets;
        cache.tagUnread = unread;
        setTagged(sets);
        setTagUnread(unread);
      }

      // Names: people for direct chats, ride routes for group chats
      const sb = supabaseBrowser();
      const directIds = list.filter((x) => x.kind === "d").map((x) => x.id);
      const rideIds = list.filter((x) => x.kind === "g").map((x) => uuidFromNexconnId(x.id.replace(/^ride/, ""))).filter(Boolean) as string[];
      const [{ data: ppl }, { data: rides }] = await Promise.all([
        directIds.length ? sb.from("profiles").select("id, full_name, avatar_url, nexconn_user_id").in("nexconn_user_id", directIds) : Promise.resolve({ data: [] }),
        rideIds.length ? sb.from("posts").select("id, details").in("id", rideIds) : Promise.resolve({ data: [] }),
      ]);
      const map: Record<string, { name: string; avatar: string | null; id: string }> = {};
      for (const p of (ppl ?? []) as { id: string; full_name: string; avatar_url: string | null; nexconn_user_id: string }[]) map[p.nexconn_user_id] = { name: p.full_name, avatar: p.avatar_url, id: p.id };
      for (const p of (rides ?? []) as { id: string; details: { pickup?: string; destination?: string } }[])
        map[`ride${p.id.replace(/-/g, "")}`] = { name: `${p.details.pickup} → ${p.details.destination}`, avatar: null, id: p.id };
      cache.names = map;
      setNames(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load chats.");
    } finally {
      setRefreshing(false);
    }
  }, [myNx]);

  useEffect(() => {
    if (chat.status !== "connected") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // Web has no local channel cache (list comes from the server), so refresh on focus and periodically too.
    const onFocus = () => document.visibilityState === "visible" && load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const poll = setInterval(onFocus, 20000);
    const unsub = chat.subscribe((e) => {
      if (e.type !== "messages" && e.type !== "receipt") return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(load, 400);
    });
    return () => {
      unsub();
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [chat, load]);

  const visible = (rows ?? []).filter((r) => filter === "all" || tagged[filter].has(r.key));

  return (
    <div>
      <header className="sticky top-0 z-30 bg-bg/95 px-4 pb-3 pt-4 backdrop-blur">
        <h1 className="font-display text-2xl font-bold">Chats</h1>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="tablist">
          {([["all", "All"], ...TAGS.map((t) => [t.id, t.name])] as [Filter, string][]).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className="pill" data-active={filter === k} data-testid={`chats-${k}`}>
              {label}
              {k !== "all" && tagUnread[k as TagId] > 0 ? <span className="rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">{tagUnread[k as TagId]}</span> : null}
            </button>
          ))}
        </div>
      </header>

      {chat.status === "error" ? (
        <ErrorState message={chat.error ?? "Chat is offline."} onRetry={chat.retry} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : rows === null ? (
        <div className="space-y-2 px-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="skeleton h-12 w-12 !rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
          <p className="flex items-center justify-center gap-2 text-xs text-muted"><Spinner className="h-3 w-3" /> {chat.status === "connected" ? "Loading chats…" : "Connecting to Nexconn…"}</p>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="chat"
          title={filter === "all" ? "No chats yet" : `No ${TAGS.find((t) => t.id === filter)?.name.toLowerCase()} chats`}
          body="Tap Accept, Buy or Book on any post. The deal opens right here in chat."
          action={<Link href="/" className="btn btn-primary">Browse the feed</Link>}
        />
      ) : (
        <ul className={`stagger divide-y divide-line px-2 ${refreshing ? "refreshing" : "is-fresh"}`} aria-busy={refreshing}>
          {visible.map((r) => {
            const n = names[r.id];
            return (
              <li key={r.key}>
                <Link href={`/chat/${r.kind}/${r.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-surface active:scale-[0.985] active:bg-surface" data-testid="chat-row">
                  {r.kind === "g" ? (
                    <IconTile name="car" className="h-12 w-12 !rounded-full bg-success-soft text-success-ink" />
                  ) : (
                    <Avatar name={n?.name ?? "?"} url={n?.avatar} size={48} id={n?.id} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate ${r.unread ? "font-bold" : "font-semibold"}`}>{n?.name ?? (r.kind === "g" ? "Ride Room" : "Pactly user")}</p>
                      <span className={`shrink-0 text-[11px] ${r.unread ? "font-semibold text-primary" : "text-muted"}`}>{r.time ? timeAgo(r.time) : ""}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${r.unread ? "text-ink" : "text-muted"}`}>
                        {r.mine ? <span className={r.read ? "text-primary" : ""}>{r.read ? "✓✓ " : "✓ "}</span> : null}
                        {r.preview || "No messages yet"}
                      </p>
                      {r.unread > 0 ? <span className="min-w-[20px] shrink-0 rounded-full bg-primary px-1.5 text-center text-[11px] font-bold leading-5 text-white" data-testid="row-unread">{r.unread}</span> : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
