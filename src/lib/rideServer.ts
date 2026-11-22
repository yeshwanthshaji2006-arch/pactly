import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { HttpError } from "./auth";
import { PUBLIC_PROFILE_COLUMNS, type Post, type PublicProfile } from "./types";
import { rideGroupId } from "./format";

export async function rideManifest(postId: string, viewerId: string) {
  const admin = supabaseAdmin();
  const { data: post } = await admin.from("posts").select("*").eq("id", postId).maybeSingle();
  const p = post as Post | null;
  if (!p || p.type !== "ride") throw new HttpError(404, "Ride not found.");
  const { data: bookings } = await admin.from("ride_bookings").select("passenger_id, seats, fare, status, created_at").eq("post_id", postId).eq("status", "booked").order("created_at");
  const ids = [p.author_id, ...(bookings ?? []).map((b) => b.passenger_id)];
  const { data: people } = await admin.from("profiles").select(PUBLIC_PROFILE_COLUMNS).in("id", ids);
  const byId = Object.fromEntries(((people as PublicProfile[]) ?? []).map((x) => [x.id, x]));
  const isMember = ids.includes(viewerId);
  return {
    post: p,
    groupId: rideGroupId(p.id),
    driver: byId[p.author_id],
    passengers: (bookings ?? []).map((b) => ({ ...b, profile: byId[b.passenger_id] })),
    isDriver: p.author_id === viewerId,
    isMember,
    archived: p.details.ride_status === "completed",
  };
}
export type RideManifest = Awaited<ReturnType<typeof rideManifest>>;
