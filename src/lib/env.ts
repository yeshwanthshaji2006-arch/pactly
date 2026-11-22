/**
 * Validates the Supabase env vars and explains common mistakes clearly
 * (e.g. the Postgres connection string pasted into NEXT_PUBLIC_SUPABASE_URL).
 */
export function supabaseEnvProblem(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url) return "NEXT_PUBLIC_SUPABASE_URL is missing in .env.local.";
  if (url.startsWith("postgres"))
    return "NEXT_PUBLIC_SUPABASE_URL contains the database connection string. It must be your project URL, like https://<project-ref>.supabase.co (Supabase → Project Settings → API). Put the postgresql://… string in SUPABASE_DB_URL instead.";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) && !/^https?:\/\//.test(url))
    return "NEXT_PUBLIC_SUPABASE_URL must start with https:// (e.g. https://<project-ref>.supabase.co).";
  if (!anon) return "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local.";
  return null;
}
