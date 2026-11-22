import Link from "next/link";
import { rupees, timeAgo, when } from "@/lib/format";
import type { Post } from "@/lib/types";
import { Avatar, Icon, RatingChip, TrustBadge, TypeBadge } from "./ui";

export function priceSuffix(p: Pick<Post, "type" | "details">) {
  if (p.type === "market" && p.details.listing === "rent") return "/day";
  if (p.type === "ride") return "/seat";
  return "";
}

export function typeExtra(p: Pick<Post, "type" | "details">) {
  if (p.type === "task") return p.details.mode === "online" ? "Online" : "On campus";
  if (p.type === "market") return p.details.listing === "rent" ? "Rent" : "Sale";
  return p.details.ride_kind === "offer" ? "Offering" : "Needed";
}

export function PostCard({ post }: { post: Post }) {
  const a = post.author;
  const d = post.details;
  return (
    <Link href={`/post/${post.id}`} className="card block p-4" data-testid="post-card">
      <div className="flex items-start justify-between gap-3">
        <TypeBadge type={post.type} extra={typeExtra(post)} />
        <span className="text-[11px] text-muted">{timeAgo(post.created_at)}</span>
      </div>
      <div className="mt-2 flex gap-3">
        {post.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.images[0]} alt="" loading="lazy" decoding="async" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug">{post.title}</h3>
          {post.type === "ride" ? (
            <p className="mt-1 truncate text-sm text-muted">
              {d.pickup} → {d.destination}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0 text-sm text-muted">
          <p className="flex items-center gap-1 truncate"><Icon name="pin" className="h-3.5 w-3.5" />{post.location || "Campus"}</p>
          {post.type === "ride" && d.depart_start ? (
            <p className="flex items-center gap-1 truncate">
              <Icon name="clock" className="h-3.5 w-3.5" />{when(d.depart_start)}
              {d.ride_kind === "offer" ? ` · ${d.seats_left ?? 0} seat${d.seats_left === 1 ? "" : "s"} left` : ""}
            </p>
          ) : null}
          {post.type === "task" && d.needed_by ? <p className="flex items-center gap-1 truncate"><Icon name="alarm" className="h-3.5 w-3.5" />by {when(d.needed_by)}</p> : null}
        </div>
        <p className="price shrink-0 text-xl">
          {rupees(post.price)}
          <span className="text-xs font-medium text-muted">{priceSuffix(post)}</span>
        </p>
      </div>
      {a ? (
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <Avatar name={a.full_name} url={a.avatar_url} size={28} id={a.id} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.full_name}</span>
          <RatingChip avg={a.rating_avg} count={a.rating_count} />
          <TrustBadge profile={a} compact />
        </div>
      ) : null}
    </Link>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="card space-y-3 p-4">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-5 w-4/5" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-7 w-full" />
    </div>
  );
}
