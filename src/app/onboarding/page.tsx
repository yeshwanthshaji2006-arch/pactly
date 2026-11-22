import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";
import type { Campus } from "@/lib/types";

export default async function OnboardingPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/auth/signout");
  const supabase = await supabaseServer();
  const [{ data: campuses }, { data: auth }] = await Promise.all([
    supabase.from("campuses").select("id, slug, name, city").order("name"),
    supabase.auth.getUser(),
  ]);
  return <OnboardingForm profile={profile} campuses={(campuses as Campus[]) ?? []} email={auth.user?.email ?? ""} />;
}
