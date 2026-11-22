import { NextResponse } from "next/server";
import { handle, HttpError, requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { scanText, PAYMENT_QR_HIT } from "@/lib/scamGuard";
import { uuidFromNexconnId } from "@/lib/format";

/**
 * Server-side Scam Guard. The receiver's client reports a suspicious incoming message; the server
 * re-runs the rules on the text itself (it does not trust the client's verdict) and records the hit
 * for moderators, building a sender risk history.
 */
export async function POST(req: Request) {
  return handle(async () => {
    await requireUser();
    const b = (await req.json().catch(() => ({}))) as { messageId?: string; text?: string; senderNexconnId?: string; paymentQr?: boolean };
    if (!b.messageId || !b.senderNexconnId) throw new HttpError(400, "Missing message.");
    const hits = scanText(b.text ?? "");
    const ruleIds = [...hits.map((h) => h.id), ...(b.paymentQr ? [PAYMENT_QR_HIT.id] : [])];
    if (!ruleIds.length) return NextResponse.json({ hits: [] });
    const admin = supabaseAdmin();
    const { data: existing } = await admin.from("scam_flags").select("id").eq("message_id", b.messageId).maybeSingle();
    if (!existing) {
      await admin.from("scam_flags").insert({
        message_id: b.messageId,
        sender_id: uuidFromNexconnId(b.senderNexconnId),
        rule_ids: ruleIds,
        excerpt: (b.text || (b.paymentQr ? "[image: payment QR]" : "[message]")).slice(0, 280),
      });
    }
    return NextResponse.json({ hits: ruleIds });
  });
}
