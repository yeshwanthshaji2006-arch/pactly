import { NextResponse } from "next/server";
import { handle, HttpError, requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { blocklistAdd, blocklistRemove } from "@/lib/nexconn/server";
import { nexconnIdFromUuid, uuidFromNexconnId } from "@/lib/format";

async function target(req: Request, me: string) {
  const { targetNexconnId } = (await req.json().catch(() => ({}))) as { targetNexconnId?: string };
  const id = targetNexconnId ? uuidFromNexconnId(targetNexconnId) : null;
  if (!id) throw new HttpError(400, "Missing user.");
  if (id === me) throw new HttpError(400, "You can't block yourself.");
  return { id, nx: targetNexconnId! };
}

/** Block: stored in Pactly and enforced by Nexconn's user blocklist so their messages are rejected. */
export async function POST(req: Request) {
  return handle(async () => {
    const { profile } = await requireUser();
    const t = await target(req, profile.id);
    const { error } = await supabaseAdmin().from("blocks").upsert({ blocker_id: profile.id, blocked_id: t.id });
    if (error) throw new HttpError(500, error.message);
    await blocklistAdd(nexconnIdFromUuid(profile.id), [t.nx]);
    return NextResponse.json({ blocked: true });
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const { profile } = await requireUser();
    const t = await target(req, profile.id);
    await supabaseAdmin().from("blocks").delete().eq("blocker_id", profile.id).eq("blocked_id", t.id);
    await blocklistRemove(nexconnIdFromUuid(profile.id), [t.nx]);
    return NextResponse.json({ blocked: false });
  });
}
