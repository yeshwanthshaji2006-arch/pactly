"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { STATUS_LABEL } from "@/lib/deals";
import { rideGroupId, rupees, timeAgo, when } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useMe } from "@/components/ProfileProvider";
import { Avatar, EmptyState, ErrorState, Icon, IconTile, TYPE_META } from "@/components/ui";
import type { Deal, DealStatus, Post } from "@/lib/types";

type DealRow = Deal & { post: Pick<Post, "id" | "type" | "title" | "images" | "details">; other: { id: string; full_name: string; avatar_url: string | null; nexconn_user_id: string } | null };
type RideRow = { seats: number; fare: number; post: Pick<Post, "id" | "title" | "details" | "status"> };

type DealsCache = { deals: DealRow[]; rides: RideRow[]; myPosts: Pick<Post, "id" | "type" | "title" | "status" | "price" | "created_at">[] };
let dealsCache: DealsCache | null = null;

const ACTIVE: DealStatus[] = ["offer", "counter", "agreed", "in_progress", "done"];

export default function DealsPage() {
  const me = useMe();
  const [deals, setDeals] = useState<DealRow[] | null>(() => dealsCache?.deals ?? null);
  const [rides, setRides] = useState<RideRow[]>(() => dealsCache?.rides ?? []);
  const [myPosts, setMyPosts] = useState<Pick<Post, "id" | "type" | "title" | "status" | "price" | "created_at">[]>(() => dealsCache?.myPosts ?? []);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "past" | "posts">("active");

  const load = useCallback(async () => {
    setError(null);
    setRefreshing(!!dealsCache);
    try {
      const sb = supabaseBrowser();
      const [r, b, p] = await Promise.all([
        fetch("/api/deals").then(async (x) => {
          const j = await x.json();
          if (!x.ok) throw new Error(j.error || "Could not load deals.");
          return j.deals as DealRow[];
        }),
        sb.from("ride_bookings").select("seats, fare, post:posts(id, title, details, status)").eq("passenger_id", me.id).eq("status", "booked").order("created_at", { ascending: false }),
        sb.from("posts").select("id, type, title, status, price, created_at").eq("author_id", me.id).order("created_at", { ascending: false }),
      ]);
      const rs = ((b.data ?? []) as unknown as RideRow[]).filter((x) => x.post);
      dealsCache = { deals: r, rides: rs, myPosts: p.data ?? [] };
      setDeals(r);
      setRides(rs);
      setMyPosts(p.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load deals.");
    } finally {
      setRefreshing(false);
    }
  }, [me.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const active = (deals ?? []).filter((d) => ACTIVE.includes(d.status));
  const past = (deals ?? []).filter((d) => !ACTIVE.includes(d.status));

  return (
    <div>
      <header className="sticky top-0 z-30 bg-bg/95 px-4 pb-3 pt-4 backdrop-blur">
        <h1 className="font-display text-2xl font-bold">Deals</h1>
        <div className="seg mt-3 grid grid-cols-3 text-sm font-semibold" role="tablist">
          {([["active", `Active${active.length ? ` · ${active.length}` : ""}`], ["past", "Past"], ["posts", "My posts"]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className="py-1.5">{l}</button>
          ))}
        </div>
      </header>
      <div className={refreshing ? "refreshing" : "is-fresh"} aria-busy={refreshing}>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : deals === null ? (
        <div className="space-y-3 px-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : tab === "posts" ? (
        myPosts.length === 0 ? (
          <EmptyState icon="note" title="You haven't posted yet" body="Tap + to post a task, list something or offer a ride." />
        ) : (
          <ul className="stagger space-y-2 px-4">
            {myPosts.map((p) => (
              <li key={p.id}>
                <Link href={`/post/${p.id}`} className="card flex items-center gap-3 p-3">
                  <IconTile name={TYPE_META[p.type].icon} className={`h-10 w-10 ${TYPE_META[p.type].tile}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.title}</span>
                    <span className="text-xs text-muted">{rupees(p.price)} · {timeAgo(p.created_at)}</span>
                  </span>
                  <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-semibold capitalize text-muted ring-1 ring-line">{p.status.replace("_", " ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="stagger space-y-2 px-4">
          {tab === "active" && rides.filter((r) => r.post.details.ride_status !== "completed").map((r) => (
            <Link key={r.post.id} href={`/chat/g/${rideGroupId(r.post.id)}`} className="card flex items-center gap-3 p-3">
              <IconTile name="car" className="h-11 w-11 !rounded-full bg-success-soft text-success-ink" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.post.details.pickup} → {r.post.details.destination}</span>
                <span className="text-xs text-muted">{when(r.post.details.depart_start)} · {r.seats} seat{r.seats > 1 ? "s" : ""} · {rupees(r.fare)}</span>
              </span>
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success-ink">Ride Room</span>
            </Link>
          ))}
          {(tab === "active" ? active : past).length === 0 && !(tab === "active" && rides.length) ? (
            <EmptyState icon={tab === "active" ? "handshake" : "folder"} title={tab === "active" ? "No active deals" : "No past deals"} body="Deals you start or receive appear here and live inside chat." action={<Link href="/" className="btn btn-primary">Find something</Link>} />
          ) : null}
          {(tab === "active" ? active : past).map((d) => (
            <Link key={d.id} href={d.other ? `/chat/d/${d.other.nexconn_user_id}` : "/messages"} className="card flex items-center gap-3 p-3" data-testid="deal-row">
              <Avatar name={d.other?.full_name ?? "?"} url={d.other?.avatar_url} size={44} id={d.other?.id} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate font-semibold"><Icon name={TYPE_META[d.post.type].icon} className="h-3.5 w-3.5 text-muted" /><span className="truncate">{d.post.title}</span></span>
                <span className="text-xs text-muted">with {d.other?.full_name ?? "someone"} · {d.buyer_id === me.id ? "you started" : "on your post"} · {timeAgo(d.updated_at)}</span>
              </span>
              <span className="text-right">
                <span className="price block">{rupees(d.price)}</span>
                <span className="text-[11px] font-semibold text-primary">{STATUS_LABEL[d.status]}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
