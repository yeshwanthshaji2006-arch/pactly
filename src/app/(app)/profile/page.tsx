import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import { ProfileEditor } from "./ProfileEditor";
import { ProfileHeader, Reviews, TrustBreakdown, trustParts, type ReviewRow } from "@/components/ProfileView";

export default async function MyProfile() {
  const me = await getSessionProfile();
  if (!me) redirect("/auth/signout");
  const sb = await supabaseServer();
  const [{ data: campus }, { data: reviews }, { data: priv }, { count: invites }] = await Promise.all([
    sb.from("campuses").select("name").eq("id", me.campus_id).maybeSingle(),
    sb.from("reviews").select("id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url)").eq("reviewee_id", me.id).order("created_at", { ascending: false }).limit(20),
    sb.from("profile_private").select("upi_id").eq("user_id", me.id).maybeSingle(),
    sb.from("profiles").select("id", { count: "exact", head: true }).eq("invited_by", me.id).eq("verification_status", "verified"),
  ]);
  return (
    <div className="pb-6">
      <ProfileHeader p={me} campus={campus?.name} />
      <div className="mt-5 space-y-3 px-4">
        <TrustBreakdown parts={trustParts(me, invites ?? 0)} />
        <ProfileEditor me={me} upi={priv?.upi_id ?? ""} invites={invites ?? 0} />
        <Reviews reviews={(reviews ?? []) as unknown as ReviewRow[]} />
      </div>
    </div>
  );
}
