import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto("http://localhost:3000/dev/smoke?me=alice&to=bob");
await page.getByRole("button", { name: "Connect" }).click();
await page.getByTestId("status").filter({ hasText: "connected as alice" }).waitFor({ timeout: 30000 });
const out = await page.evaluate(async () => {
  const m = window.__nc;
  const q = m.BaseChannel.createMessagesQuery({ channelIdentifier: new m.DirectChannel("bob").identifier, startTime: Date.now(), pageSize: 10, isAscending: false });
  const r = await q.loadNextPage();
  const list = r.data.data;
  return list.map((x) => ({ id: x.messageId, type: x.messageType, c: JSON.stringify(x.content).slice(0, 60), meta: Object.fromEntries(x.metadata || []) }));
});
console.log(out);
await browser.close();
