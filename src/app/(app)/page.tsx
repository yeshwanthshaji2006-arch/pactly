"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PUBLIC_PROFILE_COLUMNS, type Post, type PostType } from "@/lib/types";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { EmptyState, ErrorState, Icon, Logo, type IconName } from "@/components/ui";
import { useMe } from "@/components/ProfileProvider";

const PILLS: { key: "all" | PostType; label: string; icon?: IconName }[] = [
  { key: "all", label: "All" },
  { key: "task", label: "Tasks", icon: "bolt" },
  { key: "market", label: "Market", icon: "bag" },
  { key: "ride", label: "Rides", icon: "car" },
];

/** In-memory cache per filter: show cached results instantly, refresh in the background. */
const feedCache = new Map<string, Post[]>();

export default function FeedPage() {
  const me = useMe();
  const [scope, setScope] = useState<"campus" | "global">("campus");
  const [type, setType] = useState<"all" | PostType>("all");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const cacheKey = `${scope}|${type}|${debounced}|${me.campus_id ?? ""}`;
  const [posts, setPosts] = useState<Post[] | null>(() => feedCache.get(cacheKey) ?? null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campusName, setCampusName] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!me.campus_id) return;
    supabaseBrowser()
      .from("campuses")
      .select("name")
      .eq("id", me.campus_id)
      .single()
      .then(({ data }: { data: { name: string } | null }) => setCampusName(data?.name ?? ""));
  }, [me.campus_id]);

  const load = useCallback(async () => {
    setError(null);
    const cached = feedCache.get(cacheKey);
    setPosts(cached ?? null);
    setRefreshing(!!cached);
    let query = supabaseBrowser()
      .from("posts")
      .select(`*, author:profiles(${PUBLIC_PROFILE_COLUMNS}), campus:campuses(name, slug)`)
      .in("status", ["open", "in_deal"])
      .order("created_at", { ascending: false })
      .limit(60);
    if (scope === "campus" && me.campus_id) query = query.eq("campus_id", me.campus_id);
    if (type !== "all") query = query.eq("type", type);
    if (debounced) {
      const s = debounced.replace(/[%,()]/g, " ");
      query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%,location.ilike.%${s}%`);
    }
    const { data, error } = await query;
    setRefreshing(false);
    if (error) return setError(error.message);
    feedCache.set(cacheKey, (data as Post[]) ?? []);
    setPosts((data as Post[]) ?? []);
  }, [scope, type, debounced, me.campus_id, cacheKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div>
      <header className="sticky top-0 z-30 bg-bg/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted">Hi {me.full_name.split(" ")[0]}</p>
            <h1><Logo /></h1>
          </div>
          <div className="seg text-xs font-semibold" role="tablist" aria-label="Feed scope">
            {(["campus", "global"] as const).map((s) => (
              <button key={s} role="tab" aria-selected={scope === s} onClick={() => setScope(s)} className="px-3 py-1.5" data-testid={`scope-${s}`}>
                {s === "campus" ? "Campus" : "Global"}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mt-3">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input !pl-9" placeholder="Search calculators, rides to Katpadi, notes…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search posts" />
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {PILLS.map((p) => (
            <button key={p.key} onClick={() => setType(p.key)} className="pill" data-active={type === p.key} data-testid={`pill-${p.key}`}>
              {p.icon ? <Icon name={p.icon} className="h-3.5 w-3.5" /> : null}
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {me.verification_status !== "verified" ? (
        <p className="mx-4 mb-3 rounded-2xl bg-warning-soft p-3 text-sm text-warning-ink"><Icon name="hourglass" className="mr-1.5 h-4 w-4" />Your ID is pending verification. You can browse, and you can make deals once approved.</p>
      ) : null}

      <section className={`space-y-3 px-4 ${refreshing ? "refreshing" : "is-fresh"}`} aria-busy={refreshing}>
        {scope === "campus" && campusName ? <p className="text-xs font-semibold uppercase tracking-wider text-muted">{campusName}</p> : null}
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : posts === null ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={debounced ? "search" : "sprout"}
            title={debounced ? "No matches" : "Nothing here yet"}
            body={debounced ? `Nothing matches “${debounced}”. Try another word or switch to Global.` : scope === "campus" ? "Be the first to post on your campus, or switch to Global." : "Tap + to post the first one."}
          />
        ) : (
          <div className="stagger space-y-3">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
        )}
      </section>
    </div>
  );
}
