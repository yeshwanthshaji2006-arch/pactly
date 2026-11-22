// Applies supabase/migrations/*.sql in order using SUPABASE_DB_URL (local tooling only).
import "dotenv/config";
import { config } from "dotenv";
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
config({ path: ".env.local", quiet: true });
const url = process.env.SUPABASE_DB_URL;
if (!url) { console.error("SUPABASE_DB_URL missing in .env.local"); process.exit(1); }
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query("create table if not exists public._pactly_migrations (name text primary key, applied_at timestamptz default now())");
await client.query("alter table public._pactly_migrations enable row level security");
const dir = "supabase/migrations";
const done = new Set((await client.query("select name from public._pactly_migrations")).rows.map((r) => r.name));
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(f)) { console.log("skip", f); continue; }
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into public._pactly_migrations(name) values ($1)", [f]);
    await client.query("commit");
    console.log("applied", f);
  } catch (e) {
    await client.query("rollback");
    console.error("FAILED", f, e.message);
    process.exit(1);
  }
}
await client.end();
