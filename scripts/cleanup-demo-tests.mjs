// Removes ONLY test activity among the seeded demo students (aarav, priya, meera). Real users are untouched.
// Usage: node scripts/cleanup-demo-tests.mjs
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
config({ path: ".env.local", quiet: true });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function nexconn(path, body) {
  const nonce = randomBytes(8).toString("hex"), ts = Date.now().toString();
  const sig = createHash("sha1").update(process.env.NEXCONN_APP_SECRET + nonce + ts).digest("hex");
  const r = await fetch(`https://${process.env.NEXCONN_API_HOST}${path}`, { method: "POST", headers: { "App-Key": process.env.NEXCONN_APP_KEY, Nonce: nonce, Timestamp: ts, Signature: sig, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}
const { data: demo } = await db.from("profiles").select("id, nexconn_user_id").in("full_name", ["Aarav Sharma", "Priya Nair", "Meera Iyer"]);
const ids = demo.map((d) => d.id);
// deals only between demo students
const { data: deals } = await db.from("deals").select("id").in("buyer_id", ids).in("seller_id", ids);
const dealIds = deals.map((d) => d.id);
if (dealIds.length) {
  await db.from("reviews").delete().in("deal_id", dealIds);
  await db.from("deals").delete().in("id", dealIds);
}
await db.from("reports").delete().in("reporter_id", ids).in("reported_user_id", ids);
await db.from("scam_flags").delete().in("sender_id", ids);
await db.from("blocks").delete().in("blocker_id", ids).in("blocked_id", ids);
// ride bookings by demo students on demo students' rides
const { data: rides } = await db.from("posts").select("id, details, author_id").eq("type", "ride").in("author_id", ids);
for (const r of rides) {
  const { data: others } = await db.from("ride_bookings").select("id").eq("post_id", r.id).not("passenger_id", "in", `(${ids.join(",")})`);
  await db.from("ride_bookings").delete().eq("post_id", r.id).in("passenger_id", ids);
  if (!others?.length) {
    await db.from("posts").update({ status: "open", details: { ...r.details, seats_left: r.details.seats_total, ride_status: "scheduled" } }).eq("id", r.id);
    await nexconn("/v4/group-channel/freeze-list/remove", { channelIds: [`ride${r.id.replace(/-/g, "")}`] });
    for (const d of demo) await nexconn("/v4/channel/message/history/delete", { channelType: 3, fromUserId: d.nexconn_user_id, channelId: `ride${r.id.replace(/-/g, "")}` });
  }
}
// reopen demo students' non-ride posts that tests closed
await db.from("posts").update({ status: "open" }).in("author_id", ids).neq("type", "ride").in("status", ["in_deal", "completed"]);
// clear chat history between demo students
for (const u of demo) for (const v of demo) if (u.id !== v.id) await nexconn("/v4/channel/message/history/delete", { channelType: 1, fromUserId: u.nexconn_user_id, channelId: v.nexconn_user_id });
for (const u of demo) await nexconn("/v4/user/blocklist/remove", { userId: u.nexconn_user_id, blockedUserIds: demo.filter((x) => x.id !== u.id).map((x) => x.nexconn_user_id) });
// recompute demo ratings from remaining reviews
for (const d of demo) {
  const { data: rv } = await db.from("reviews").select("rating").eq("reviewee_id", d.id);
  const n = rv.length;
  await db.from("profiles").update({ rating_count: n, rating_avg: n ? rv.reduce((s, x) => s + x.rating, 0) / n : 0 }).eq("id", d.id);
}
console.log(`Removed ${dealIds.length} test deals among demo students; real users untouched.`);
execFileSync(process.execPath, ["scripts/seed.mjs"], { stdio: "inherit" }); // restores demo counts, Vikram pending
