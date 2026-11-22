import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "./supabase/server";
import { supabaseAdmin } from "./supabase/admin";
import type { Profile } from "./types";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Resolve the signed-in user plus their profile (via service role, so private flags are available). */
export async function requireUser() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new HttpError(401, "Please sign in again.");
  const { data: profile } = await supabaseAdmin().from("profiles").select("*").eq("id", data.user.id).single();
  if (!profile) throw new HttpError(401, "Profile not found.");
  return { user: data.user, profile: profile as Profile };
}

export async function requireVerified() {
  const ctx = await requireUser();
  if (ctx.profile.verification_status !== "verified") {
    throw new HttpError(403, "Your college ID needs to be verified before you can do this.");
  }
  return ctx;
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.profile.role !== "admin") throw new HttpError(403, "Admins only.");
  return ctx;
}

/** Wrap a route handler body so thrown HttpErrors become JSON responses. */
export async function handle(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[api]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });
  }
}
