import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/session";
import { PUBLIC_PROFILE_COLUMNS, type Post } from "@/lib/types";
import { rupees, when, yearLabel } from "@/lib/format";
import { Avatar, RatingChip, TrustBadge, TypeBadge } from "@/components/ui";
import { priceSuffix, typeExtra } from "@/components/PostCard";
import { PostActions } from "./PostActions";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionProfile();
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("posts")
    .select(`*, author:profiles(${PUBLIC_PROFILE_COLUMNS}), campus:campuses(name, slug)`)
    .eq("id", id)
    .maybeSingle();
  if (!data || !me) notFound();
  const post = data as Post;
  const a = post.author!;
  const d = post.details;

  let myBooking: { seats: number; fare: number } | null = null;
  if (post.type === "ride") {
    const { data: b } = await supabase.from("ride_bookings").select("seats, fare").eq("post_id", id).eq("passenger_id", me.id).eq("status", "booked").maybeSingle();
    myBooking = b;
  }

  const rows: [string, string][] = [];
  if (post.type === "task") {
    rows.push(["Where", d.mode === "online" ? "Online" : post.location || "On campus"]);
    if (d.needed_by) rows.push(["Needed by", when(d.needed_by)]);
  } else if (post.type === "market") {
    rows.push(["Type", d.listing === "rent" ? "For rent" : "For sale"], ["Pickup", post.location || "Campus"]);
  } else {
    rows.push(["Pickup", d.pickup || ""], ["Drop", d.destination || ""], ["Leaves", `${when(d.depart_start)} – ${new Date(d.depart_end!).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`], ["Vehicle", d.vehicle || "Any"]);
    if (d.ride_kind === "offer") rows.push(["Seats", `${d.seats_left} of ${d.seats_total} left`]);
  }
  rows.push(["Category", post.category], ["Campus", post.campus?.name ?? ""]);

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-bg/95 px-2 py-2 backdrop-blur">
        <Link href="/" className="rounded-full p-2 transition hover:bg-surface" aria-label="Back to feed"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg></Link>
        <TypeBadge type={post.type} extra={typeExtra(post)} />
      </div>
      {post.images.length ? (
        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4">
          {post.images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="h-60 w-[85%] shrink-0 snap-center rounded-2xl object-cover" />
          ))}
        </div>
      ) : null}
      <div className="space-y-4 px-4 pt-3">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">{post.title}</h1>
          <p className="price mt-1 text-3xl">
            {rupees(post.price)}
            <span className="text-sm font-medium text-muted">{priceSuffix(post)}</span>
          </p>
          {post.status !== "open" ? (
            <p className="mt-1 inline-block rounded-full bg-bg px-2 py-0.5 text-xs font-semibold text-muted ring-1 ring-line">
              {post.status === "in_deal" ? "In a deal" : post.status === "completed" ? "Completed" : "Closed"}
            </p>
          ) : null}
        </div>
        <dl className="card divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {post.description ? <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/90">{post.description}</p> : null}
        <Link href={`/u/${a.id}`} className="card flex items-center gap-3 p-3">
          <Avatar name={a.full_name} url={a.avatar_url} size={44} id={a.id} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{a.full_name}</p>
            <p className="truncate text-xs text-muted">{[a.department, yearLabel(a.year)].filter(Boolean).join(" · ")} · {a.completed_deals} deals</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <RatingChip avg={a.rating_avg} count={a.rating_count} />
            <TrustBadge profile={a} compact />
          </div>
        </Link>
        <PostActions post={post} myBooking={myBooking} />
      </div>
    </div>
  );
}
