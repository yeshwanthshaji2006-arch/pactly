import { NextResponse } from "next/server";
import { handle, HttpError, requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = {
  fullName?: string;
  campusId?: string;
  department?: string;
  year?: number;
  inviteCode?: string;
  idCardPath?: string;
};

/** Saves campus, department and year plus the private ID-card path, then sets status Pending (or Verified in dev). */
export async function POST(req: Request) {
  return handle(async () => {
    const { user, profile } = await requireUser();
    const b = (await req.json().catch(() => ({}))) as Body;
    const fullName = (b.fullName || "").trim();
    const department = (b.department || "").trim();
    if (fullName.length < 2) throw new HttpError(400, "Enter your name.");
    if (!b.campusId) throw new HttpError(400, "Pick your campus.");
    if (department.length < 2) throw new HttpError(400, "Enter your department.");
    if (!b.year || b.year < 1 || b.year > 6) throw new HttpError(400, "Pick your year.");
    if (!b.idCardPath || !b.idCardPath.startsWith(`${user.id}/`)) throw new HttpError(400, "Upload your college ID.");

    const admin = supabaseAdmin();
    const { data: campus } = await admin.from("campuses").select("id").eq("id", b.campusId).maybeSingle();
    if (!campus) throw new HttpError(400, "Unknown campus.");

    let invitedBy: string | null = null;
    if (b.inviteCode?.trim()) {
      const { data: inviter } = await admin.from("profiles").select("id").eq("invite_code", b.inviteCode.trim().toLowerCase()).maybeSingle();
      if (!inviter) throw new HttpError(400, "That invite code doesn't exist.");
      if (inviter.id !== user.id) invitedBy = inviter.id;
    }

    const autoVerify = process.env.DEV_AUTO_VERIFY === "true";
    const status = profile.verification_status === "verified" ? "verified" : autoVerify ? "verified" : "pending";

    const { error: pErr } = await admin
      .from("profiles")
      .update({
        full_name: fullName.slice(0, 60),
        campus_id: b.campusId,
        department: department.slice(0, 60),
        year: b.year,
        onboarded: true,
        verification_status: status,
        ...(invitedBy && !profile.onboarded ? { invited_by: invitedBy } : {}),
      })
      .eq("id", user.id);
    if (pErr) throw new HttpError(500, pErr.message);

    const { error: privErr } = await admin
      .from("profile_private")
      .upsert({ user_id: user.id, id_card_path: b.idCardPath, id_submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    if (privErr) throw new HttpError(500, privErr.message);

    return NextResponse.json({ status });
  });
}
