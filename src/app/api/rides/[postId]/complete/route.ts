import { NextResponse } from "next/server";
import { handle, HttpError, requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rideManifest } from "@/lib/rideServer";
import { freezeGroup } from "@/lib/nexconn/server";
import { rideGroupId } from "@/lib/format";

/**
 * Driver marks the ride complete in two steps:
 *  1. POST            → mark completed + credit everyone (the client then posts the "completed" event)
 *  2. POST ?step=freeze → freeze the Nexconn group so the Ride Room is archived (read-only)
 */
export async function POST(req: Request, ctx: { params: Promise<{ postId: string }> }) {
  return handle(async () => {
    const { postId } = await ctx.params;
    const { profile } = await requireUser();
    const m = await rideManifest(postId, profile.id);
    if (!m.isDriver) throw new HttpError(403, "Only the driver can complete the ride.");
    if (new URL(req.url).searchParams.get("step") === "freeze") {
      if (!m.archived) throw new HttpError(409, "Complete the ride first.");
      await freezeGroup(rideGroupId(postId));
      return NextResponse.json(m);
    }
    if (m.archived) return NextResponse.json(m);
    const admin = supabaseAdmin();
    const { error } = await admin
      .from("posts")
      .update({ status: "completed", details: { ...m.post.details, ride_status: "completed" } })
      .eq("id", postId);
    if (error) throw new HttpError(500, error.message);
    if (m.passengers.length) {
      await admin.rpc("increment_completed", { uids: [profile.id, ...m.passengers.map((p) => p.passenger_id)] });
    }
    return NextResponse.json(await rideManifest(postId, profile.id));
  });
}
