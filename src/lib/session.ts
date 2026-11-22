import "server-only";
import { cache } from "react";
import { supabaseServer } from "./supabase/server";
import type { Profile } from "./types";

/** Current user's own profile (RLS: users can read profiles). Cached per request. */
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
  return (profile as Profile) ?? null;
});
