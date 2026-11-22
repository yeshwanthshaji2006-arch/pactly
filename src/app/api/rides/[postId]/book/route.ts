import { NextResponse } from "next/server";
import { handle, HttpError, requireVerified } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isBlockedBetween } from "@/lib/dealServer";
import { rideManifest } from "@/lib/rideServer";
import { createGroup, ensureRegistered, joinGroup, NexconnApiError } from "@/lib/nexconn/server";
import { nexconnIdFromUuid, rideGroupId } from "@/lib/format";

/** Book seat(s) on an offered ride, then add the passenger to the ride's Nexconn group channel (the Ride Room). */
export async function POST(req: Request, ctx: { params: Promise<{ postId: string }> }) {
  return handle(async () => {
    const { postId } = await ctx.params;
    const { profile } = await requireVerified();
    const { seats = 1 } = (await req.json().catch(() => ({}))) as { seats?: number };
    const admin = supabaseAdmin();
    const { data: post } = await admin.from("posts").select("author_id, title, details").eq("id", postId).maybeSingle();
    if (!post) throw new HttpError(404, "Ride not found.");
    if (await isBlockedBetween(profile.id, post.author_id)) throw new HttpError(403, "You can't book this ride.");

    const { data, error } = await admin.rpc("book_ride", { p_post: postId, p_passenger: profile.id, p_seats: Math.round(seats) });
    if (error) throw new HttpError(409, error.message.replace(/^.*?: /, ""));
    const result = (data as { seats_left: number; fare: number; already: boolean }[])[0];

    // Ride Room = Nexconn group channel with a deterministic id. Create it on the first booking, join afterwards.
    const groupId = rideGroupId(postId);
    const { data: driver } = await admin.from("profiles").select("full_name").eq("id", post.author_id).single();
    const driverNx = nexconnIdFromUuid(post.author_id);
    const meNx = nexconnIdFromUuid(profile.id);
    await ensureRegistered([
      { nexconnId: driverNx, name: driver?.full_name ?? "Driver" },
      { nexconnId: meNx, name: profile.full_name },
    ]);
    const d = post.details as { pickup?: string; destination?: string };
    try {
      await createGroup(groupId, `🚗 ${d.pickup ?? ""} → ${d.destination ?? ""}`, driverNx, [meNx], `Ride Room for “${post.title}”. Fares are shown on the pinned card.`);
    } catch (e) {
      if (!(e instanceof NexconnApiError)) throw e;
      await joinGroup(groupId, [meNx]); // group already exists
    }
    return NextResponse.json({ ...(await rideManifest(postId, profile.id)), booking: result });
  });
}
