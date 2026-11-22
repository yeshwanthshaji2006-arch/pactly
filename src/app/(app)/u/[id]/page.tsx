import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ProfileHeader, Reviews, TrustBreakdown, trustParts, type ReviewRow } from "@/components/ProfileView";
import { PostCard } from "@/components/PostCard";
import { PUBLIC_PROFILE_COLUMNS, type Post, type Profile } from "@/lib/types";

export default async function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: p } = await sb.from("profiles").select("id, full_name, avatar_url, campus_id, department, year, bio, skills, verification_status, trust_score, rating_avg, rating_count, completed_deals").eq("id", id).maybeSingle();
  if (!p) notFound();
  const [{ data: campus }, { data: reviews }, { data: posts }, { count: invites }] = await Promise.all([
    sb.from("campuses").select("name").eq("id", p.campus_id).maybeSingle(),
    sb.from("reviews").select("id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url)").eq("reviewee_id", id).order("created_at", { ascending: false }).limit(20),
    sb.from("posts").select(`*, author:profiles(${PUBLIC_PROFILE_COLUMNS})`).eq("author_id", id).in("status", ["open", "in_deal"]).order("created_at", { ascending: false }).limit(10),
    sb.from("profiles").select("id", { count: "exact", head: true }).eq("invited_by", id).eq("verification_status", "verified"),
  ]);
  const prof = p as unknown as Profile;
  return (
    <div className="pb-6">
      <div className="px-2 pt-2"><Link href="/" className="inline-flex rounded-full p-2 transition hover:bg-surface" aria-label="Back"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg></Link></div>
      <ProfileHeader p={prof} campus={campus?.name} />
      <div className="mt-5 space-y-3 px-4">
        <TrustBreakdown parts={trustParts(prof, invites ?? 0)} />
        <Reviews reviews={(reviews ?? []) as unknown as ReviewRow[]} />
        {posts?.length ? (
          <>
            <p className="pt-2 text-sm font-semibold">Open posts</p>
            {(posts as Post[]).map((x) => <PostCard key={x.id} post={x} />)}
          </>
        ) : null}
      </div>
    </div>
  );
}
