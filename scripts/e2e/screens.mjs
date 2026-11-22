import { launch, newPage, demoLogin, admin, BASE, ok, finish } from "./lib.mjs";
await launch();
const { data: ppl } = await admin.from("profiles").select("id, full_name, nexconn_user_id").in("full_name", ["Aarav Sharma", "Priya Nair", "Vikram Rao"]);
const aarav = ppl.find((p) => p.full_name === "Aarav Sharma");
const priya = ppl.find((p) => p.full_name === "Priya Nair");
const vikram = ppl.find((p) => p.full_name === "Vikram Rao");
await admin.from("profiles").update({ verification_status: "pending" }).eq("id", vikram.id);

const A = await newPage("aarav");
const P = await newPage("priya");
await Promise.all([demoLogin(A, "aarav"), demoLogin(P, "priya")]);

// Messages tab: list from Nexconn, tag filters
await A.goto(`${BASE}/messages`);
await A.getByTestId("chat-row").first().waitFor({ timeout: 30000 });
const all = await A.getByTestId("chat-row").count();
await A.getByTestId("chats-market").click();
await A.getByTestId("chat-row").filter({ hasText: "Priya Nair" }).waitFor({ timeout: 10000 });
const market = await A.getByTestId("chat-row").count();
await A.getByTestId("chats-rides").click();
await A.getByTestId("chat-row").filter({ hasText: "Katpadi" }).waitFor({ timeout: 10000 });
const rides = await A.getByTestId("chat-row").count();
await A.getByTestId("chats-tasks").click();
await A.waitForTimeout(500);
const tasks = await A.getByTestId("chat-row").count();
ok(`Messages: All ${all} · Market ${market} · Rides ${rides} · Tasks ${tasks} (Nexconn channel tags)`);

// Unread count: Priya sends while Aarav is on the list
await A.getByTestId("chats-all").click();
const t = `unread check ${Date.now() % 10000}`;
await P.goto(`${BASE}/chat/d/${aarav.nexconn_user_id}`);
await P.getByTestId("composer").waitFor({ timeout: 30000 });
await P.getByTestId("composer").fill(t);
await P.getByTestId("send").click();
const row = A.getByTestId("chat-row").filter({ hasText: t });
await row.getByTestId("row-unread").waitFor({ timeout: 20000 });
await A.getByTestId("nav-unread").waitFor({ timeout: 10000 });
ok(`Unread badge on row (${await row.getByTestId("row-unread").innerText()}) and bottom nav`);
await row.click();
await A.getByTestId("bubble").filter({ hasText: t }).waitFor({ timeout: 15000 });
await A.waitForTimeout(1500); // a person reading the message
await A.goto(`${BASE}/messages`);
await A.getByTestId("chat-row").filter({ hasText: t }).waitFor({ timeout: 30000 });
if (await A.getByTestId("chat-row").filter({ hasText: t }).getByTestId("row-unread").count()) throw new Error("unread not cleared");
ok("Opening the chat clears unread");
// Priya's list shows ✓✓ (read) for her last message
await P.goto(`${BASE}/messages`);
await P.getByTestId("chat-row").first().waitFor({ timeout: 30000 });
await P.waitForTimeout(3000);
console.log("  PRIYA ROWS:", (await P.getByTestId("chat-row").allInnerTexts()).map((x) => x.replaceAll(String.fromCharCode(10), " ")).join(" || "));
await P.getByTestId("chat-row").filter({ hasText: `✓✓ ${t}` }).waitFor({ timeout: 20000 });
ok("Sender's list shows read receipt ✓✓");

// Deals tab
await A.goto(`${BASE}/deals`);
await A.getByRole("button", { name: "Past" }).click();
await A.getByTestId("deal-row").filter({ hasText: "Hercules" }).first().waitFor({ timeout: 20000 });
ok("Deals tab lists the completed cycle deal under Past");

// Profile: UPI save + trust breakdown
await A.goto(`${BASE}/profile`);
await A.getByText("How trust is calculated").waitFor({ timeout: 20000 });
await A.getByLabel("UPI ID (private)").fill("not a upi");
await A.getByRole("button", { name: "Save" }).click();
await A.getByText("doesn't look right").waitFor();
await A.getByLabel("UPI ID (private)").fill("aarav.sharma@okaxis");
await A.getByRole("button", { name: "Save" }).click();
await A.getByText("Saved ✓").waitFor({ timeout: 10000 });
ok(`Profile: trust ${await A.getByTestId("trust-score").innerText()} with breakdown; UPI validated + saved privately`);

// Public profile has no UPI / ID
await P.goto(`${BASE}/u/${aarav.id}`);
await P.getByText("Reviews").first().waitFor({ timeout: 20000 });
const pub = await P.locator("body").innerText();
if (/okaxis|id-cards/.test(pub)) throw new Error("private data on public profile");
ok("Public profile shows trust, rating, reviews and no private data");

// Admin: non-admin blocked
await A.goto(`${BASE}/admin`);
await A.getByText("Admins only").waitFor({ timeout: 20000 });
const forbidden = (await A.context().request.post(`${BASE}/api/admin/verify`, { data: { userId: vikram.id, decision: "verified" } })).status();
if (forbidden !== 403) throw new Error("admin API not protected: " + forbidden);
ok("Non-admins get “Admins only” and 403 from admin APIs");

// Admin: Meera approves Vikram and reviews report evidence
const M = await newPage("meera");
await demoLogin(M, "meera");
await M.goto(`${BASE}/admin`);
const vrow = M.getByTestId("pending-row").filter({ hasText: "Vikram Rao" });
await vrow.waitFor({ timeout: 20000 });
await vrow.locator("img").waitFor();
const loaded = await vrow.locator("img").evaluate((img) => img.complete && img.naturalWidth > 0);
if (!loaded) throw new Error("ID image didn't load via signed URL");
ok("Admin sees Vikram's private ID via a signed URL");
await vrow.getByTestId("approve").click();
await vrow.waitFor({ state: "detached", timeout: 15000 });
const { data: v } = await admin.from("profiles").select("verification_status").eq("id", vikram.id).single();
if (v.verification_status !== "verified") throw new Error("not verified");
ok("Approve → Vikram verified");
const rep = M.getByTestId("report-row").first();
await rep.getByTestId("evidence").waitFor();
const ev = await rep.getByTestId("evidence").innerText();
if (!ev.includes("← reported")) throw new Error("evidence missing reported marker");
ok(`Report evidence transcript shown (${ev.split("\n").length} lines, reported message highlighted)`);
await M.screenshot({ path: "scripts/e2e/admin.png", fullPage: true });
await A.screenshot({ path: "scripts/e2e/profile.png" });
// restore demo state: Vikram pending again for the demo
await admin.from("profiles").update({ verification_status: "pending" }).eq("id", vikram.id);
await finish();
