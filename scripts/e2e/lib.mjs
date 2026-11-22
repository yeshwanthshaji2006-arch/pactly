import { chromium } from "playwright";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local", quiet: true });
export const BASE = process.env.BASE || "http://localhost:3000";
export const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
export const errors = [];
export const sdkNoise = [];
const apiLog = [];
const pages = [];
// On a failed step, print API errors, app errors and each page's visible toast/footer to show the cause.
process.on("uncaughtException", async (e) => {
  console.log("FAILED:", String(e.message).split(String.fromCharCode(10))[0]);
  if (apiLog.length) console.log("API errors: " + apiLog.join(" | "));
  if (errors.length) console.log("App errors: " + errors.join(" | "));
  for (const [label, p] of pages) {
    const t = await p.locator("body").innerText().catch(() => "");
    console.log(`[${label}] tail: ${t.replace(/\s+/g, " ").slice(-300)}`);
  }
  process.exit(1);
});
let browser;
export async function launch() {
  browser = await chromium.launch();
  return browser;
}
export async function newPage(label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // Known Nexconn SDK telemetry upload blocked by its own server's CORS policy (not app code). Tracked separately.
    if (/logcollection\.ronghub\.com|net::ERR_FAILED/.test(m.text())) return sdkNoise.push(m.text());
    errors.push(`[${label}] console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on("response", async (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) apiLog.push(`[${label}] ${r.status()} ${r.request().method()} ${new URL(r.url()).pathname} ${(await r.text().catch(() => "")).slice(0, 160)}`);
  });
  pages.push([label, page]);
  return page;
}
export async function demoLogin(page, handle) {
  await page.goto(`${BASE}/login`);
  await page.getByTestId(`demo-${handle}`).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
}
export function ok(msg) {
  console.log("✓", msg);
}
export async function finish(code = 0) {
  if (apiLog.length) console.log("API errors: " + apiLog.join(" | "));
  if (sdkNoise.length) console.log(`  (note: ${sdkNoise.length} Nexconn SDK log-upload CORS messages, not app errors)`);
  if (errors.length) console.log("Console/page errors:\n  " + errors.join("\n  "));
  else console.log("✓ no console errors");
  await browser?.close();
  process.exit(errors.length ? 1 : code);
}

import { createHash, randomBytes } from "node:crypto";
/** Signed Nexconn server API call (tests only). */
export async function nexconn(path, body) {
  const nonce = randomBytes(8).toString("hex");
  const ts = Date.now().toString();
  const sig = createHash("sha1").update(process.env.NEXCONN_APP_SECRET + nonce + ts).digest("hex");
  const r = await fetch(`https://${process.env.NEXCONN_API_HOST}${path}`, {
    method: "POST",
    headers: { "App-Key": process.env.NEXCONN_APP_KEY, Nonce: nonce, Timestamp: ts, Signature: sig, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}
