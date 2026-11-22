import { launch, newPage, demoLogin, admin, BASE, ok, finish } from "./lib.mjs";
await launch();
const { data: people } = await admin.from("profiles").select("id, full_name, nexconn_user_id").in("full_name", ["Aarav Sharma", "Priya Nair"]);
const aarav = people.find((p) => p.full_name === "Aarav Sharma");
const priya = people.find((p) => p.full_name === "Priya Nair");
const { data: post } = await admin.from("posts").select("id, title").eq("title", "Hercules Roadeo cycle, 1 year old").single();
// reset state from earlier runs
await admin.from("reviews").delete().not("deal_id", "is", null);
await admin.from("deals").update({ status: "cancelled" }).eq("post_id", post.id).not("status", "in", "(cancelled,reviewed)");
await admin.from("posts").update({ status: "open" }).eq("id", post.id);
const { data: before } = await admin.from("profiles").select("id, completed_deals").in("id", [aarav.id, priya.id]);

const A = await newPage("aarav");
const P = await newPage("priya");
await demoLogin(A, "aarav");
await demoLogin(P, "priya");

// 1. Aarav taps Buy → Nexconn 1:1 chat with a DealCard
await A.goto(`${BASE}/post/${post.id}`);
await A.getByTestId("cta").filter({ hasText: "Buy" }).waitFor({ timeout: 30000 });
await A.getByTestId("cta").click();
await A.waitForURL(new RegExp(`/chat/d/${priya.nexconn_user_id}`), { timeout: 30000 });
const aCard = A.getByTestId("deal-card").last();
await aCard.waitFor({ timeout: 20000 });
await aCard.getByTestId("deal-status").filter({ hasText: "Offer" }).waitFor();
ok("Buy opens a Nexconn 1:1 chat with a DealCard (Offer ₹2,800)");

// 2. Priya opens the chat, sees the card live, counters at ₹2,500
await P.goto(`${BASE}/chat/d/${aarav.nexconn_user_id}`);
const pCard = P.getByTestId("deal-card").last();
await pCard.getByTestId("act-counter").waitFor({ timeout: 30000 });
const upiBefore = await pCard.innerText();
if (/okaxis/.test(upiBefore)) throw new Error("UPI visible before Agreed!");
ok("Seller sees Accept / Counter / Decline; UPI hidden before Agreed");
await pCard.getByTestId("act-counter").click();
await pCard.getByTestId("counter-input").fill("2500");
await pCard.getByTestId("counter-send").click();
await pCard.getByTestId("deal-status").filter({ hasText: "Counter" }).waitFor({ timeout: 15000 });

// 3. Aarav's card updates IN PLACE (no reload) via message metadata
await aCard.getByTestId("deal-price").filter({ hasText: "2,500" }).waitFor({ timeout: 20000 });
await aCard.getByTestId("deal-status").filter({ hasText: "Counter" }).waitFor();
ok("Counter-offer updated the same card in place for the buyer (₹2,800 → ₹2,500)");
await A.getByTestId("deal-event").filter({ hasText: "countered at ₹2500" }).last().waitFor({ timeout: 15000 });
ok("Timeline event pill delivered (Pactly:DealEvent)");

// 4. Aarav accepts → Agreed on both; UPI unlocks for payer behind the Hold step
await aCard.getByTestId("act-accept").click();
await aCard.getByTestId("deal-status").filter({ hasText: "Agreed" }).waitFor({ timeout: 15000 });
await pCard.getByTestId("deal-status").filter({ hasText: "Agreed" }).waitFor({ timeout: 20000 });
ok("Accept → Agreed on both screens");
await pCard.getByText("Your UPI ID is now visible").waitFor({ timeout: 10000 });
await aCard.getByTestId("pay-btn").click();
await A.getByTestId("hold-sheet").waitFor();
const cont = A.getByTestId("hold-continue");
if (!(await cont.isDisabled())) throw new Error("Hold should block immediately");
for (const i of [0, 1, 2]) await A.getByTestId(`hold-check-${i}`).check();
await cont.filter({ hasText: "Continue to payment" }).waitFor({ timeout: 8000 });
await cont.click();
const upi = await A.getByTestId("upi-id").innerText();
if (!upi.includes("priya.nair@okaxis")) throw new Error("wrong UPI " + upi);
ok(`Hold step (5s countdown + 3 checks) then UPI revealed: ${upi}`);
await A.getByLabel("Close").click();

// 5. Start → In progress → both mark done → Done
await pCard.getByTestId("act-start").click();
await aCard.getByTestId("deal-status").filter({ hasText: "In progress" }).waitFor({ timeout: 20000 });
await aCard.getByTestId("act-done").click();
await aCard.getByTestId("deal-line").filter({ hasText: "In progress" }).waitFor({ timeout: 10000 });
const stillProgress = await pCard.getByTestId("deal-status").innerText();
await pCard.getByTestId("act-done").waitFor({ timeout: 20000 });
ok(`One side done → still "${stillProgress}" until both confirm`);
await pCard.getByTestId("act-done").click();
await pCard.getByTestId("deal-status").filter({ hasText: "Done" }).waitFor({ timeout: 15000 });
await aCard.getByTestId("deal-status").filter({ hasText: "Done" }).waitFor({ timeout: 20000 });
ok("Both confirmed → Done on both screens");

// 6. Review prompts → Reviewed
await aCard.getByTestId("review-prompt").waitFor({ timeout: 10000 });
await aCard.getByTestId("star-5").click();
await aCard.getByTestId("review-submit").click();
await pCard.getByTestId("review-prompt").waitFor({ timeout: 10000 });
await pCard.getByTestId("star-4").click();
await pCard.getByTestId("review-submit").click();
await pCard.getByTestId("deal-status").filter({ hasText: "Reviewed" }).waitFor({ timeout: 15000 });
await aCard.getByTestId("deal-status").filter({ hasText: "Reviewed" }).waitFor({ timeout: 20000 });
ok("Both reviewed → status Review complete");
await A.screenshot({ path: "scripts/e2e/deal-aarav.png" });
await P.screenshot({ path: "scripts/e2e/deal-priya.png" });

// 7. Reload: card restores latest state from Nexconn history metadata
await A.reload();
await A.getByTestId("deal-card").last().getByTestId("deal-status").filter({ hasText: "Reviewed" }).waitFor({ timeout: 30000 });
ok("After reload the card shows the latest state (history keeps metadata)");

// 8. Read receipts: Aarav sends text, Priya has the chat open → Aarav sees Read
await A.getByTestId("composer").fill("Thanks Priya, cycle is great!");
await A.getByTestId("send").click();
await P.getByTestId("bubble").filter({ hasText: "cycle is great" }).last().waitFor({ timeout: 15000 });
await A.getByTestId("receipt").filter({ hasText: "Read" }).waitFor({ timeout: 20000 });
ok("Read receipt: Sent → Read ✓✓");

const { data: after } = await admin.from("profiles").select("id, completed_deals").in("id", [aarav.id, priya.id]);
const inc = after.every((x) => x.completed_deals === before.find((b) => b.id === x.id).completed_deals + 1);
if (!inc) throw new Error("completed_deals not incremented");
ok("completed_deals incremented for both");
await finish();
