import { launch, newPage, demoLogin, admin, BASE, ok, finish } from "./lib.mjs";
await launch();
const { data: ppl } = await admin.from("profiles").select("full_name, nexconn_user_id").in("full_name", ["Aarav Sharma", "Priya Nair"]);
const aarav = ppl.find((p) => p.full_name === "Aarav Sharma"), priya = ppl.find((p) => p.full_name === "Priya Nair");
const { data: post } = await admin.from("posts").select("id").eq("title", "Hercules Roadeo cycle, 1 year old").single();
await admin.from("deals").update({ status: "cancelled" }).eq("post_id", post.id).not("status", "in", "(cancelled,reviewed)");
await admin.from("posts").update({ status: "open" }).eq("id", post.id);

const A = await newPage("aarav"), P = await newPage("priya");
await Promise.all([demoLogin(A, "aarav"), demoLogin(P, "priya")]);
await A.goto(`${BASE}/post/${post.id}`);
await A.getByTestId("cta").filter({ hasText: "Buy" }).waitFor({ timeout: 30000 });
await A.getByTestId("cta").click();
await A.waitForURL(/\/chat\/d\//, { timeout: 30000 });
await P.goto(`${BASE}/chat/d/${aarav.nexconn_user_id}`);
const pCard = P.getByTestId("deal-card").last();
await pCard.getByTestId("deal-status").filter({ hasText: "Offer" }).waitFor({ timeout: 30000 });

// Seller's quick "Offer ₹2,520" chip (2,800 × 0.9) → real counter on the card, both sides
await P.getByTestId("qr-counter").filter({ hasText: "2,520" }).click();
await pCard.getByTestId("deal-price").filter({ hasText: "2,520" }).waitFor({ timeout: 15000 });
await A.getByTestId("deal-card").last().getByTestId("deal-price").filter({ hasText: "2,520" }).waitFor({ timeout: 20000 });
ok("Quick-reply “Offer ₹2,520” countered on the Deal Card, updated in place for the buyer");

// Text chip
await A.getByTestId("qr-chip").filter({ hasText: "Meet at main gate" }).click();
await P.getByTestId("bubble").filter({ hasText: "main gate at 5 pm" }).last().waitFor({ timeout: 15000 });
ok("Text quick reply delivered");

// Translate (service is on): tapping 🌐 shows a translation under the bubble
await P.getByTestId("translate-btn").last().click();
await P.getByTestId("translation").last().waitFor({ timeout: 20000 });
ok("Translate: Nexconn translation shown under the message");

// Admin stats
const M = await newPage("meera");
await demoLogin(M, "meera");
await M.goto(`${BASE}/admin`);
await M.getByTestId("admin-stats").getByText("Deals started").waitFor({ timeout: 20000 });
ok("Admin “Pactly in numbers” card: " + (await M.getByTestId("admin-stats").innerText()).replaceAll(String.fromCharCode(10), " ").slice(0, 160));
await finish();
