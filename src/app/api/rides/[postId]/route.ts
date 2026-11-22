import { NextResponse } from "next/server";
import { handle, HttpError, requireUser } from "@/lib/auth";
import { rideManifest } from "@/lib/rideServer";

export async function GET(_req: Request, ctx: { params: Promise<{ postId: string }> }) {
  return handle(async () => {
    const { postId } = await ctx.params;
    const { profile } = await requireUser();
    const m = await rideManifest(postId, profile.id);
    if (!m.isMember) throw new HttpError(403, "Book a seat to see this ride room.");
    return NextResponse.json(m);
  });
}
