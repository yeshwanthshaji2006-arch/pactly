import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
async function open(me, to) {
  const page = await (await browser.newContext()).newPage();
  page.on("pageerror", (e) => console.log(`[${me}] pageerror`, e.message));
  await page.goto(`${BASE}/dev/smoke?me=${me}&to=${to}`);
  await page.getByRole("button", { name: "Connect" }).click();
  await page.getByTestId("status").filter({ hasText: `connected as ${me}` }).waitFor({ timeout: 30000 });
  return page;
}
const a = await open("alice", "bob");
const b = await open("bob", "alice");
const tag = String(Date.now());
// 1. Alice sends a custom DealCard with metadata
const sent = await a.evaluate(async (tag) => {
  const m = window.__nc;
  const p = new m.SendMessageParams({ dealId: tag, title: "Probe", price: 100 }, "Pactly:DealCard");
  p.metadata = { status: "offer", price: "100" };
  const r = await new m.DirectChannel("bob").sendMessage(p);
  return { code: r.code, id: r.data?.messageId, meta: r.data ? Object.fromEntries(r.data.metadata || []) : null };
}, tag);
console.log("alice sent:", sent);
// 2. Bob receives it with metadata
await b.waitForFunction((tag) => window.__received.some((x) => x.content?.dealId === tag), tag, { timeout: 20000 });
const recv = await b.evaluate((tag) => {
  const x = window.__received.find((x) => x.content?.dealId === tag);
  return { type: x.messageType, id: x.messageId, meta: Object.fromEntries(x.metadata || []) };
}, tag);
console.log("bob received:", recv);
// 3. Bob counters: setMetadata on the received message
const upd = await b.evaluate(async (tag) => {
  const x = window.__received.find((x) => x.content?.dealId === tag);
  const r = await x.setMetadata({ status: "counter", price: "80" });
  return r.code;
}, tag);
console.log("bob setMetadata code:", upd);
// 4. Alice gets onMessageMetadataUpdated
await a.waitForFunction((id) => window.__metaEvents.some((e) => e.messageId === id), sent.id, { timeout: 20000 });
console.log("alice meta event:", await a.evaluate((id) => window.__metaEvents.find((e) => e.messageId === id).metadata, sent.id));
// 5. History fetch reflects latest metadata
const hist = await a.evaluate(async (id) => {
  const m = window.__nc;
  const q = m.BaseChannel.createMessagesQuery({ channelIdentifier: new m.DirectChannel("bob").identifier, startTime: Date.now(), pageSize: 10, isAscending: false });
  const r = await q.loadNextPage();
  const list = r.data?.data || r.data || [];
  const x = list.find((x) => x.messageId === id);
  return { code: r.code, shape: Array.isArray(r.data) ? "array" : Object.keys(r.data || {}), meta: x ? Object.fromEntries(x.metadata || []) : "not found" };
}, sent.id);
console.log("alice history:", hist);
await browser.close();
