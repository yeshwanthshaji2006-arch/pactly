import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { handle, HttpError } from "@/lib/auth";

const DEMO_ACCOUNTS = ["aarav", "priya", "meera"] as const;

/** One-tap sign-in to seeded demo students, so judges can test two-user flows without email. */
export async function POST(req: Request) {
  return handle(async () => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true" || !process.env.DEMO_PASSWORD) {
      throw new HttpError(404, "Demo mode is off.");
    }
    const { handle: who } = (await req.json().catch(() => ({}))) as { handle?: string };
    if (!who || !(DEMO_ACCOUNTS as readonly string[]).includes(who)) throw new HttpError(400, "Unknown demo account.");
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithPassword({
      email: `${who}@demo.pactly.app`,
      password: process.env.DEMO_PASSWORD,
    });
    if (error) throw new HttpError(400, "Demo sign-in failed. Has the seed script been run?");
    return NextResponse.json({ ok: true });
  });
}
