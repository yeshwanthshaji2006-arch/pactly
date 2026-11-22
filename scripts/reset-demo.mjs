// Restores a clean demo state (before recording / submitting). Re-runs the seed afterwards.
// Usage: node scripts/reset-demo.mjs
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
config({ path: ".env.local", quiet: true });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function nexconn(path, body) {
  const nonce = randomBytes(8).toString("hex"), ts = Date.now().toString();
  const sig = createHash("sha1").update(process.env.NEXCONN_APP_SECRET + nonce + ts).digest("hex");
  const r = await fetch(`https://${process.env.NEXCONN_API_HOST}${path}`, {
    method: "POST",
    headers: { "App-Key": process.env.NEXCONN_APP_KEY, Nonce: nonce, Timestamp: ts, Signature: sig, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json().catch(() => ({}));
}
const del = (q, label) => q.then(({ error }) => error && console.warn(label, error.message));

const { data: profiles } = await db.from("profiles").select("id, nexconn_user_id, full_name");
const { data: posts } = await db.from("posts").select("id, type, details");

// 1. Nexconn: unfreeze ride groups, clear chat history between all users, remove blocks
const rideGroups = posts.filter((p) => p.type === "ride").map((p) => `ride${p.id.replace(/-/g, "")}`);
for (let i = 0; i < rideGroups.length; i += 20) await nexconn("/v4/group-channel/freeze-list/remove", { channelIds: rideGroups.slice(i, i + 20) });
let cleared = 0;
for (const u of profiles) {
  for (const v of profiles) if (u.id !== v.id) {
    const r = await nexconn("/v4/channel/message/history/delete", { channelType: 1, fromUserId: u.nexconn_user_id, channelId: v.nexconn_user_id });
    if (r.code === 0) cleared++;
  }
  for (const g of rideGroups) await nexconn("/v4/channel/message/history/delete", { channelType: 3, fromUserId: u.nexconn_user_id, channelId: g });
  await nexconn("/v4/user/blocklist/remove", { userId: u.nexconn_user_id, blockedUserIds: profiles.filter((x) => x.id !== u.id).map((x) => x.nexconn_user_id).slice(0, 20) });
}
console.log(`Nexconn: unfroze ${rideGroups.length} ride groups, cleared ${cleared} direct histories, removed blocks`);

// 2. Database: remove activity, keep seed
await del(db.from("reports").delete().not("id", "is", null), "reports");
await del(db.from("scam_flags").delete().not("id", "is", null), "scam_flags");
await del(db.from("blocks").delete().not("blocker_id", "is", null), "blocks");
await del(db.from("reviews").delete().not("deal_id", "is", null), "reviews");
await del(db.from("deals").delete().not("id", "is", null), "deals");
await del(db.from("ride_bookings").delete().not("id", "is", null), "ride_bookings");
for (const p of posts) {
  const details = p.type === "ride" ? { ...p.details, seats_left: p.details.seats_total, ride_status: "scheduled" } : p.details;
  await db.from("posts").update({ status: "open", details }).eq("id", p.id);
}
// remove e2e test users
const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
for (const u of list.users.filter((u) => u.email?.endsWith("@test.pactly.app"))) await db.auth.admin.deleteUser(u.id);
// recompute ratings from remaining (seeded) reviews
for (const p of profiles) {
  const { data: rv } = await db.from("reviews").select("rating").eq("reviewee_id", p.id);
  const n = rv?.length ?? 0;
  await db.from("profiles").update({ rating_count: n, rating_avg: n ? rv.reduce((s, r) => s + r.rating, 0) / n : 0 }).eq("id", p.id);
}
console.log("Database: cleared deals, bookings, reviews from deals, reports, flags, blocks; posts reopened; ratings recomputed");

// 3. Re-run seed (restores profiles, UPI IDs, completed-deal counts, Vikram pending)
execFileSync(process.execPath, ["scripts/seed.mjs"], { stdio: "inherit" });
