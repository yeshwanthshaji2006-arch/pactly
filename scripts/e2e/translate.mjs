import { launch, newPage, demoLogin, admin, BASE, ok, finish } from "./lib.mjs";
await launch();
const { data: ppl } = await admin.from("profiles").select("full_name, nexconn_user_id").in("full_name", ["Aarav Sharma", "Priya Nair"]);
const aarav = ppl.find((p) => p.full_name === "Aarav Sharma"), priya = ppl.find((p) => p.full_name === "Priya Nair");
const A = await newPage("aarav"), P = await newPage("priya");
P.on("console", (m) => /pactly|translat/i.test(m.text()) && console.log("P>", m.text().slice(0, 200)));
await Promise.all([demoLogin(A, "aarav"), demoLogin(P, "priya")]);
await A.goto(`${BASE}/chat/d/${priya.nexconn_user_id}`);
await P.goto(`${BASE}/chat/d/${aarav.nexconn_user_id}`);
await P.getByTestId("composer").waitFor({ timeout: 30000 });
await A.getByTestId("composer").waitFor({ timeout: 30000 });

// Priya writes in Hindi → Aarav translates to English
const tag = `#${Date.now() % 100000}`;
const hi = `क्या साइकिल अभी भी उपलब्ध है? मैं कल शाम को आ सकता हूँ। ${tag}`;
await P.getByTestId("composer").fill(hi);
await P.getByTestId("send").click();
const row = A.getByTestId("message-row").filter({ hasText: tag }).last();
await row.waitFor({ timeout: 20000 });
await row.getByTestId("translate-btn").click();
const tr = row.getByTestId("translation");
const t1 = Date.now();
await tr.waitFor({ timeout: 40000 });
console.log(`  (English arrived in ${((Date.now() - t1) / 1000).toFixed(1)}s)`);
ok(`Hindi → English: “${(await tr.innerText()).replace("🌐 ", "")}”`);

// Priya switches her language to Tamil and translates Aarav's English
await A.getByTestId("composer").fill(`Yes, it's available. Can we meet at the main gate at 5 pm? ${tag}`);
await A.getByTestId("send").click();
await P.getByTestId("chat-menu").click();
await P.getByTestId("lang-ta").click();
await P.getByLabel("Close").click();
const prow = P.getByTestId("message-row").filter({ hasText: `5 pm? ${tag}` }).last();
await prow.waitFor({ timeout: 20000 });
await prow.getByTestId("translate-btn").click();
const ptr = prow.getByTestId("translation");
const t0 = Date.now();
try {
  await ptr.waitFor({ timeout: 25000 });
} catch (e) {
  console.log("PRIYA ROW:", (await prow.innerText()).replaceAll(String.fromCharCode(10), " | "));
  console.log("PRIYA TAIL:", (await P.locator("body").innerText()).slice(-300).replaceAll(String.fromCharCode(10), " | "));
  throw e;
}
console.log(`  (Tamil arrived in ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
ok(`English → Tamil: “${(await ptr.innerText()).replace("🌐 ", "")}”`);
await A.screenshot({ path: "scripts/e2e/translate.png" });
await finish();
