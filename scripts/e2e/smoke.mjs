// Two isolated browser contexts = two "windows" with separate storage.
import { chromium } from "playwright";
const BASE = process.env.BASE || "http://localhost:3000";
const browser = await chromium.launch();
const errors = [];
async function open(me, to) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[${me}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${me}] ${e.message}`));
  await page.goto(`${BASE}/dev/smoke?me=${me}&to=${to}`);
  await page.getByRole("button", { name: "Connect" }).click();
  await page.getByTestId("status").filter({ hasText: `connected as ${me}` }).waitFor({ timeout: 30000 });
  return page;
}
const a = await open("alice", "bob");
const b = await open("bob", "alice");
const stamp = Date.now();
await a.getByTestId("input").fill(`hi bob ${stamp}`);
await a.getByTestId("send").click();
await b.getByTestId("log").getByText(`alice: hi bob ${stamp}`).waitFor({ timeout: 20000 });
console.log("✓ bob received alice's message");
await b.getByTestId("input").fill(`hey alice ${stamp}`);
await b.getByTestId("send").click();
await a.getByTestId("log").getByText(`bob: hey alice ${stamp}`).waitFor({ timeout: 20000 });
console.log("✓ alice received bob's reply");
await a.screenshot({ path: "scripts/e2e/smoke-alice.png" });
await b.screenshot({ path: "scripts/e2e/smoke-bob.png" });
console.log(errors.length ? "Console errors:\n" + errors.join("\n") : "✓ no console errors");
await browser.close();
