// Records a ~2.5 min side-by-side demo of Pactly (Aarav = buyer, Priya = seller) and saves pactly-demo.mp4.
// Usage: node scripts/record-demo.mjs   (BASE=https://... to point at another deployment)
import { chromium } from "playwright";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

config({ path: ".env.local", quiet: true });
const BASE = process.env.BASE || "https://pactly-live.vercel.app";
const OUT = path.resolve("pactly-demo.mp4");
const VID = path.resolve("scripts/.demo-video");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function nexconn(p, body) {
  const nonce = randomBytes(8).toString("hex");
  const ts = Date.now().toString();
  const sig = createHash("sha1").update(process.env.NEXCONN_APP_SECRET + nonce + ts).digest("hex");
  const r = await fetch(`https://${process.env.NEXCONN_API_HOST}${p}`, {
    method: "POST",
    headers: { "App-Key": process.env.NEXCONN_APP_KEY, Nonce: nonce, Timestamp: ts, Signature: sig, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  return r?.ok;
}

// ---------- setup ----------
rmSync(VID, { recursive: true, force: true });
mkdirSync(VID, { recursive: true });
const { data: ppl } = await admin.from("profiles").select("id, full_name, nexconn_user_id").in("full_name", ["Aarav Sharma", "Priya Nair"]);
const aarav = ppl.find((p) => p.full_name === "Aarav Sharma");
const priya = ppl.find((p) => p.full_name === "Priya Nair");
// Clean slate: no block between them, ride open with seats
await admin.from("blocks").delete().in("blocker_id", [aarav.id, priya.id]);
await nexconn("/v4/user/blocklist/remove", { userId: aarav.nexconn_user_id, blockedUserIds: [priya.nexconn_user_id] });
const { data: ride } = await admin.from("posts").select("id, details").eq("title", "Campus → Katpadi station, evening drop").maybeSingle();
if (ride) {
  await admin.from("ride_bookings").delete().eq("post_id", ride.id);
  await admin.from("posts").update({ status: "open", details: { ...ride.details, seats_left: 3, ride_status: "scheduled" } }).eq("id", ride.id);
  await nexconn("/v4/group-channel/freeze-list/remove", { channelIds: [`ride${ride.id.replace(/-/g, "")}`] });
}

const browser = await chromium.launch({ headless: true, slowMo: 400 });
const T0 = Date.now();
const mkCtx = () => browser.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: VID, size: { width: 390, height: 844 } } });
const [ctxA, ctxP] = await Promise.all([mkCtx(), mkCtx()]);

// Caption bar that survives navigation (re-drawn from sessionStorage on every page load)
const CAPTION_JS = () => {
  const draw = () => {
    let t = "";
    try { t = sessionStorage.getItem("__cap") || ""; } catch {}
    let d = document.getElementById("__cap");
    if (!t) return d?.remove();
    if (!d) {
      d = document.createElement("div");
      d.id = "__cap";
      d.style.cssText = "position:fixed;left:8px;right:8px;top:8px;z-index:2147483647;background:rgba(20,29,27,.92);color:#fff;font:600 15px/1.35 Inter,system-ui,sans-serif;padding:10px 12px;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.25);border-left:4px solid #f0a23b;pointer-events:none";
      document.documentElement.appendChild(d);
    }
    d.textContent = t;
  };
  window.__drawCap = draw;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw);
  else draw();
};
await ctxA.addInitScript(CAPTION_JS);
await ctxP.addInitScript(CAPTION_JS);
const A = await ctxA.newPage();
const P = await ctxP.newPage();
A.setDefaultTimeout(20000);
P.setDefaultTimeout(20000);

async function cap(page, text) {
  await page.evaluate((t) => {
    try { sessionStorage.setItem("__cap", t); } catch {}
    window.__drawCap?.();
  }, text).catch(() => {});
}
const both = (t) => Promise.all([cap(A, t), cap(P, t)]);
const pause = (ms = 1200) => new Promise((r) => setTimeout(r, ms));
const results = [];
async function step(name, fn) {
  const s = Date.now();
  try {
    await fn();
    results.push(`✓ ${name} (${((Date.now() - s) / 1000).toFixed(0)}s)`);
  } catch (e) {
    results.push(`✗ ${name}: ${String(e.message).split("\n")[0].slice(0, 120)}`);
  }
}

// ---------- login (trimmed out of the final video) ----------
for (const [pg, who] of [[A, "aarav"], [P, "priya"]]) {
  await pg.goto(`${BASE}/login`);
  await pg.getByTestId(`demo-${who}`).click();
  await pg.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 });
}
await Promise.all([A.getByTestId("post-card").first().waitFor({ timeout: 30000 }).catch(() => {}), P.getByTestId("post-card").first().waitFor({ timeout: 30000 }).catch(() => {})]);
const START = (Date.now() - T0) / 1000; // video time where the demo begins

const aChat = `${BASE}/chat/d/${priya.nexconn_user_id}`;
const pChat = `${BASE}/chat/d/${aarav.nexconn_user_id}`;
const aCard = () => A.getByTestId("deal-card").last();
const pCard = () => P.getByTestId("deal-card").last();
const stamp = Date.now() % 10000;
let postId = null;

// a) Title
await step("Title", async () => {
  await cap(A, "Pactly — Every deal, sealed in chat · Built on Nexconn Chat SDK");
  await cap(P, "Left: Aarav (buyer) · Right: Priya (seller) — two real students, live");
  await pause(3500);
});

// b) Priya browses the feed and posts a Market item
await step("Feed + post", async () => {
  await cap(P, "Feed: verified students only · Campus/Global · Tasks, Market, Rides");
  await cap(A, "Aarav browses his campus feed");
  await P.getByTestId("scope-global").click();
  await P.getByTestId("scope-campus").click();
  for (const k of ["task", "market", "ride", "all"]) await P.getByTestId(`pill-${k}`).click();
  await cap(P, "Priya taps + to sell something on the Market");
  await P.getByTestId("create-post").click();
  await P.getByRole("dialog").getByRole("button", { name: /^Market/ }).click();
  await P.waitForURL(/\/post\/new/);
  await P.getByPlaceholder(/Casio/).fill(`JBL Go 3 Bluetooth speaker #${stamp}`);
  await P.locator("textarea").first().fill("Barely used, box and charger included. Loud enough for a hostel room.");
  await P.locator("form button, main button").filter({ hasText: /^Electronics$/ }).first().click().catch(async () => {
    await P.locator("button.rounded-full.border").first().click();
  });
  await P.locator('input[inputmode="numeric"]').fill("2500");
  await P.getByPlaceholder("e.g. Hostel A").fill("Hostel B, Block 2");
  await P.getByTestId("publish").click();
  await P.waitForURL(/\/post\/[0-9a-f-]{36}/, { timeout: 30000 });
  postId = P.url().split("/post/")[1].split(/[?#]/)[0];
  await cap(P, "Posted! It's live on the campus feed");
  await pause(1500);
});

// Fallback: if posting failed, demo with one of Priya's open Market listings
if (!postId) {
  const { data: fb } = await admin.from("posts").select("id").eq("author_id", priya.id).eq("type", "market").in("status", ["open", "in_deal"]).limit(1).maybeSingle();
  postId = fb?.id ?? null;
  await P.goto(`${BASE}/`).catch(() => {});
}

// c) Aarav opens it → Buy → Deal Card in chat
await step("Buy → Deal Card", async () => {
  if (!postId) throw new Error("no post");
  await cap(A, "Aarav opens Priya's listing and taps Buy");
  await A.goto(`${BASE}/post/${postId}`);
  await A.getByTestId("cta").filter({ hasText: "Buy" }).click({ timeout: 30000 });
  await A.waitForURL(/\/chat\/d\//, { timeout: 30000 });
  await aCard().getByTestId("deal-status").filter({ hasText: "Offer" }).waitFor();
  await cap(A, "A live Deal Card (custom Nexconn message) opens the chat");
  await P.goto(pChat);
  await cap(P, "Priya receives the same Deal Card instantly");
  await pCard().waitFor({ timeout: 30000 });
  await pause(1800);
});

// d) Smart price chip → counter-offer, card updates in place on both screens
await step("Smart price counter", async () => {
  await cap(A, "Aarav just types like a human: “2.2k chalega?”");
  await A.getByTestId("composer").pressSequentially("2.2k chalega?", { delay: 60 });
  await A.getByTestId("smart-price").waitFor();
  await cap(A, "Pactly understood the price → one tap sends it AND counters on the card");
  await pause(1200);
  await A.getByTestId("smart-price").click();
  await both("Same card, price updated in place on BOTH screens (Nexconn message metadata)");
  await aCard().getByTestId("deal-price").filter({ hasText: "2,200" }).waitFor();
  await pCard().getByTestId("deal-price").filter({ hasText: "2,200" }).waitFor({ timeout: 25000 });
  await pause(2000);
});

// e) Priya accepts → Agreed → Pay → Hold → UPI
await step("Agree + Hold + UPI", async () => {
  await cap(P, "Priya accepts ₹2,200 on the card");
  await pCard().getByTestId("act-accept").click();
  await both("Agreed on both screens — only now does the UPI ID unlock");
  await aCard().getByTestId("deal-status").filter({ hasText: "Agreed" }).waitFor({ timeout: 25000 });
  await pause(1200);
  await cap(A, "Pay → Scam Guard HOLD: 5-second pause + 3 safety checks");
  await aCard().getByTestId("pay-btn").click();
  await A.getByTestId("hold-sheet").waitFor();
  for (const i of [0, 1, 2]) await A.getByTestId(`hold-check-${i}`).check();
  await A.getByTestId("hold-continue").filter({ hasText: "Continue to payment" }).waitFor({ timeout: 10000 });
  await A.getByTestId("hold-continue").click();
  await cap(A, "UPI revealed only to the payer, only after both agreed");
  await A.getByTestId("upi-id").waitFor();
  await pause(2200);
  await A.getByLabel("Close").click();
});

// f) Meetup Card
await step("Meetup Card", async () => {
  await cap(A, "Tap the pin → propose a public campus spot (Meetup Card)");
  await A.getByTestId("meetup-btn").click();
  await A.getByTestId("meetup-spot-chip").filter({ hasText: "Library" }).first().click();
  await A.getByTestId("meetup-send").click();
  const pMeet = P.getByTestId("meetup-card").last();
  await pMeet.getByTestId("meetup-status").filter({ hasText: "Proposed" }).waitFor({ timeout: 25000 });
  await cap(P, "Priya taps Accept — the same Meetup Card updates for both");
  await pMeet.getByTestId("meetup-accept").click();
  await both("Meetup confirmed · reminder strip pinned under the chat header");
  await A.getByTestId("meetup-card").last().getByTestId("meetup-status").filter({ hasText: "Confirmed" }).waitFor({ timeout: 25000 });
  await pause(2000);
});

// g) Scam Guard
let scamRow = null;
await step("Scam Guard", async () => {
  const t = `pay first and send OTP, then I'll hand it over #${stamp}`;
  await cap(P, "A scam script: “pay first and send OTP”…");
  await P.getByTestId("composer").fill(t);
  await P.getByTestId("send").click();
  scamRow = A.getByTestId("message-row").filter({ has: A.getByTestId("bubble").filter({ hasText: t }) }).last();
  await cap(A, "Scam Guard warns ONLY the receiver and names the trick");
  await scamRow.getByTestId("scam-banner").first().waitFor({ timeout: 25000 });
  await scamRow.scrollIntoViewIfNeeded();
  await pause(3000);
});

// h) Translate
await step("Translate", async () => {
  const hi = `क्या आप कल शाम लाइब्रेरी आ सकते हो? #${stamp}`;
  await cap(P, "Priya writes in Hindi");
  await P.getByTestId("composer").fill(hi);
  await P.getByTestId("send").click();
  const row = A.getByTestId("message-row").filter({ hasText: `#${stamp}` }).filter({ hasText: "लाइब्रेरी" }).last();
  await row.waitFor({ timeout: 25000 });
  await cap(A, "Aarav taps Translate — Nexconn built-in translation");
  await row.getByTestId("translate-btn").click();
  await row.getByTestId("translation").waitFor({ timeout: 40000 });
  await row.scrollIntoViewIfNeeded();
  await pause(2500);
});

// i) Handover code → Done → Sealed Receipt → Verify
await step("Handover + Receipt", async () => {
  await cap(A, "Only the payer sees the 4-digit handover code — never sent to Priya");
  const code = (await aCard().getByTestId("handover-code").innerText()).trim();
  await aCard().getByTestId("handover-code").scrollIntoViewIfNeeded();
  await pause(1500);
  await cap(P, "At the meetup Priya types Aarav's code → proves they met");
  await pCard().getByTestId("handover-input").scrollIntoViewIfNeeded();
  await pCard().getByTestId("handover-input").pressSequentially(code, { delay: 120 });
  await pCard().getByTestId("handover-submit").click();
  await both("Done for both in one step · Sealed Receipt posted with a SHA-256 seal");
  await aCard().getByTestId("deal-status").filter({ hasText: "Done" }).waitFor({ timeout: 25000 });
  const rec = A.getByTestId("receipt-card").last();
  await rec.waitFor({ timeout: 25000 });
  await rec.scrollIntoViewIfNeeded();
  await pause(1800);
  await cap(A, "Verify seal: the server recomputes the hash from the database");
  await rec.getByTestId("receipt-verify").click();
  await A.getByTestId("seal-result").filter({ hasText: "Seal verified" }).waitFor({ timeout: 25000 });
  await pause(2500);
  await A.goto(aChat);
  await A.getByTestId("composer").waitFor({ timeout: 30000 });
});

// j) Report with evidence
await step("Report", async () => {
  await cap(A, "Long-press any message → Report. 10 messages before/after attached as evidence");
  const row = A.getByTestId("message-row").filter({ hasText: "pay first and send OTP" }).last();
  await row.scrollIntoViewIfNeeded();
  await row.getByTestId("bubble").dispatchEvent("contextmenu");
  await A.getByTestId("menu-report").click();
  await A.getByTestId("reason-scam").click();
  await A.getByTestId("report-submit").click();
  await A.getByTestId("report-done").waitFor({ timeout: 20000 });
  await cap(A, "Report sent to moderators with the chat transcript");
  await pause(2000);
  await A.getByRole("button", { name: "Done" }).click().catch(() => {});
});

// k) Ride Room + Messages filters
await step("Ride Room + Messages", async () => {
  if (ride) {
    await cap(A, "Rides: booking a seat adds you to a Nexconn GROUP chat");
    await A.goto(`${BASE}/post/${ride.id}`);
    await A.getByTestId("cta").filter({ hasText: "Book a seat" }).click({ timeout: 30000 });
    await A.getByTestId("confirm-book").click();
    await A.waitForURL(/\/chat\/g\//, { timeout: 30000 });
    await A.getByTestId("ride-card").waitFor({ timeout: 25000 });
    await cap(A, "Pinned ride card: route, seats left, each passenger's fuel share — live");
    await pause(2500);
  }
  await cap(P, "Chats tab: Nexconn channel tags filter Tasks / Market / Rides with unread badges");
  await P.goto(`${BASE}/messages`);
  await P.getByTestId("chat-row").first().waitFor({ timeout: 30000 });
  for (const k of ["market", "rides", "tasks", "all"]) {
    await P.getByTestId(`chats-${k}`).click();
    await pause(500);
  }
});

// l) End
await step("End", async () => {
  await both("Pactly · Nexconn Chat SDK: custom messages, metadata, groups, translation, tags, blocklist");
  await pause(4000);
});
const END = (Date.now() - T0) / 1000;

// ---------- save + stitch ----------
const vA = await A.video().path();
const vP = await P.video().path();
await ctxA.close();
await ctxP.close();
await browser.close();
for (const r of results) console.log(r);

const demoLen = END - START;
const target = 165; // seconds; speed up only if the raw demo runs long
const speed = demoLen > 180 ? demoLen / target : 1;
const filter = [
  `[0:v]trim=start=${START.toFixed(2)}:end=${END.toFixed(2)},setpts=(PTS-STARTPTS)/${speed.toFixed(4)},scale=640:-2,fps=30[a]`,
  `[1:v]trim=start=${START.toFixed(2)}:end=${END.toFixed(2)},setpts=(PTS-STARTPTS)/${speed.toFixed(4)},scale=640:-2,fps=30[p]`,
  `[a][p]hstack=inputs=2,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]`,
].join(";");
execFileSync(ffmpeg, ["-y", "-i", vA, "-i", vP, "-filter_complex", filter, "-map", "[v]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", OUT], { stdio: "ignore" });
rmSync(VID, { recursive: true, force: true });
console.log(`\nSaved ${OUT}`);
console.log(`Duration ≈ ${(demoLen / speed).toFixed(0)}s (raw ${demoLen.toFixed(0)}s${speed > 1 ? `, sped up ${speed.toFixed(2)}x` : ""}) · ${(statSync(OUT).size / 1e6).toFixed(1)} MB`);
void readdirSync;
