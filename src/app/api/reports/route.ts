import { NextResponse } from "next/server";
import { handle, HttpError, requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { uuidFromNexconnId } from "@/lib/format";

const REASONS = ["harassment", "scam", "safety", "inappropriate", "other"];

type Evidence = { id: string; from: string; fromName?: string; type: string; text: string; at: number; reported?: boolean };

/** Report a message. The client attaches up to 10 messages before and after it as evidence. */
export async function POST(req: Request) {
  return handle(async () => {
    const { profile } = await requireUser();
    const b = (await req.json().catch(() => ({}))) as {
      reportedNexconnId?: string;
      reason?: string;
      note?: string;
      messageId?: string;
      channelKey?: string;
      evidence?: Evidence[];
    };
    if (!b.reason || !REASONS.includes(b.reason)) throw new HttpError(400, "Pick a reason.");
    if (!b.messageId) throw new HttpError(400, "Missing message.");
    const reported = b.reportedNexconnId ? uuidFromNexconnId(b.reportedNexconnId) : null;
    if (reported === profile.id) throw new HttpError(400, "You can't report your own message.");
    const evidence = (Array.isArray(b.evidence) ? b.evidence : []).slice(0, 21).map((e) => ({
      id: String(e.id ?? "").slice(0, 64),
      from: String(e.from ?? "").slice(0, 64),
      fromName: String(e.fromName ?? "").slice(0, 60),
      type: String(e.type ?? "").slice(0, 40),
      text: String(e.text ?? "").slice(0, 1000),
      at: Number(e.at) || 0,
      reported: e.id === b.messageId,
    }));
    if (!evidence.some((e) => e.reported)) throw new HttpError(400, "The reported message must be included in the evidence.");
    const { data, error } = await supabaseAdmin()
      .from("reports")
      .insert({
        reporter_id: profile.id,
        reported_user_id: reported,
        reason: b.reason,
        note: b.note?.trim().slice(0, 500) || null,
        message_id: b.messageId.slice(0, 64),
        channel_key: b.channelKey?.slice(0, 120) ?? null,
        evidence,
      })
      .select("id")
      .single();
    if (error) throw new HttpError(500, error.message);
    return NextResponse.json({ id: data.id, evidenceCount: evidence.length });
  });
}
