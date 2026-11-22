import { launch, newPage, demoLogin, admin, BASE, ok, finish, nexconn } from "./lib.mjs";
await launch();
const { data: people } = await admin.from("profiles").select("id, full_name, nexconn_user_id").in("full_name", ["Aarav Sharma", "Priya Nair"]);
const aarav = people.find((p) => p.full_name === "Aarav Sharma");
const priya = people.find((p) => p.full_name === "Priya Nair");
await admin.from("blocks").delete().in("blocker_id", [aarav.id, priya.id]);
await nexconn("/v4/user/blocklist/remove", { userId: aarav.nexconn_user_id, blockedUserIds: [priya.nexconn_user_id] });
const stamp = Date.now() % 100000;

const A = await newPage("aarav");
const P = await newPage("priya");
await Promise.all([demoLogin(A, "aarav"), demoLogin(P, "priya")]);
await A.goto(`${BASE}/chat/d/${priya.nexconn_user_id}`);
await P.goto(`${BASE}/chat/d/${aarav.nexconn_user_id}`);
await A.getByTestId("composer").waitFor({ timeout: 30000 });
await P.getByTestId("composer").waitFor({ timeout: 30000 });
await P.waitForTimeout(1500);

async function priyaSays(t) {
  await P.getByTestId("composer").fill(t);
  await P.getByTestId("send").click();
  await A.getByTestId("bubble").filter({ hasText: t }).waitFor({ timeout: 15000 });
  return A.getByTestId("message-row").filter({ has: A.getByTestId("bubble").filter({ hasText: t }) });
}

// Text scams → receiver gets a named warning; sender doesn't
const r1 = await priyaSays(`Bro pay first 500 advance, then I'll keep it for you #${stamp}`);
await r1.getByTestId("scam-banner").filter({ hasText: "Pay-first" }).waitFor({ timeout: 5000 });
const senderRow = P.getByTestId("message-row").filter({ hasText: `#${stamp}` });
await senderRow.first().waitFor();
if (await senderRow.getByTestId("scam-banner").count()) throw new Error("sender should not see the banner");
ok("“pay first / advance” → receiver sees Pay-first warning; sender does not");
const r2 = await priyaSays(`I sent you money, just share the OTP to receive it #${stamp}`);
await r2.getByTestId("scam-banner").filter({ hasText: "OTP" }).waitFor({ timeout: 5000 });
ok("“share the OTP” → OTP warning");
const r3 = await priyaSays(`Ping me on WhatsApp 98765 43210 #${stamp}`);
await r3.getByTestId("scam-banner").filter({ hasText: "Moving off Pactly" }).waitFor({ timeout: 5000 });
ok("WhatsApp + phone number → off-platform warning");
const clean = await priyaSays(`Can we meet at the main gate at 5? #${stamp}`);
if (await clean.getByTestId("scam-banner").count()) throw new Error("false positive on a normal message");
ok("Normal message → no warning");

// Payment QR image → "Scanning a QR never receives money"
await P.getByTestId("image-input").setInputFiles("scripts/e2e/pay-qr.png");
const imgRow = A.getByTestId("message-row").filter({ has: A.getByTestId("image-bubble") }).last();
await imgRow.getByTestId("scam-banner").filter({ hasText: "Scanning a QR never receives money" }).waitFor({ timeout: 30000 });
ok("UPI payment QR image → “Scanning a QR never receives money. It only sends.”");

// Server-side check recorded the hits
await A.waitForTimeout(2000);
const { data: flags } = await admin.from("scam_flags").select("rule_ids, excerpt").eq("sender_id", priya.id).order("created_at", { ascending: false }).limit(10);
const ids = new Set(flags.flatMap((f) => f.rule_ids));
for (const need of ["pay_first", "otp", "off_platform", "payment_qr"]) if (!ids.has(need)) throw new Error("server flag missing " + need);
ok(`Server re-checked and recorded flags: ${[...ids].join(", ")}`);

// Report from the message menu with automatic evidence
await r1.getByTestId("msg-menu").click();
await A.getByTestId("menu-report").click();
await A.getByTestId("reason-scam").click();
await A.getByPlaceholder(/Anything else/).fill("Asked for advance before showing the item");
await A.getByTestId("report-submit").click();
await A.getByTestId("report-done").waitFor({ timeout: 20000 });
const { data: rep } = await admin.from("reports").select("reason, evidence, reported_user_id, message_id").eq("reporter_id", aarav.id).order("created_at", { ascending: false }).limit(1).single();
const idx = rep.evidence.findIndex((e) => e.reported);
if (rep.reason !== "scam" || rep.reported_user_id !== priya.id || idx < 0) throw new Error("bad report " + JSON.stringify(rep).slice(0, 300));
const before = idx, after = rep.evidence.length - idx - 1;
if (before > 10 || after > 10) throw new Error("evidence window too large");
ok(`Report saved with evidence: ${before} before + reported + ${after} after (${rep.evidence.length} msgs)`);
await A.getByRole("button", { name: "Done" }).click();

// Long-press opens the same menu
await clean.getByTestId("bubble").dispatchEvent("contextmenu");
await A.getByTestId("menu-report").waitFor({ timeout: 5000 });
await A.getByLabel("Close").click();
ok("Long-press / right-click opens the message menu");

// Block → Nexconn blocklist rejects Priya's messages
A.on("dialog", (d) => d.accept());
await A.getByTestId("chat-menu").click();
await A.getByTestId("block-toggle").click();
await A.getByText("You blocked Priya").waitFor({ timeout: 15000 });
await P.getByTestId("composer").fill(`are you there? #${stamp}`);
await P.getByTestId("send").click();
await P.getByText("isn't accepting messages from you").waitFor({ timeout: 15000 });
ok("Block → Priya's message rejected by Nexconn (blocklist, code 405)");
await A.getByRole("button", { name: "Unblock" }).click();
await A.getByTestId("composer").waitFor({ timeout: 15000 });
ok("Unblock restores the chat");
await A.screenshot({ path: "scripts/e2e/scam-aarav.png", fullPage: false });
await finish();
