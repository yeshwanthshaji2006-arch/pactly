// Smart price chips, Meetup Card, Handover Code and Sealed Receipt, end to end with two real users.
import { launch, newPage, demoLogin, admin, BASE, ok, finish, errors } from "./lib.mjs";
import { createClient } from "@supabase/supabase-js";
await launch();
const { data: people } = await admin.from("profiles").select("id, full_name, nexconn_user_id, completed_deals").in("full_name", ["Aarav Sharma", "Priya Nair"]);
const aarav = people.find((p) => p.full_name === "Aarav Sharma");
const priya = people.find((p) => p.full_name === "Priya Nair");
const { data: post } = await admin.from("posts").select("id, title").eq("title", "Hercules Roadeo cycle, 1 year old").single();
await admin.from("deals").update({ status: "cancelled" }).eq("post_id", post.id).not("status", "in", "(cancelled,reviewed,done)");
await admin.from("posts").update({ status: "open" }).eq("id", post.id);

const A = await newPage("aarav");
const P = await newPage("priya");
await Promise.all([demoLogin(A, "aarav"), demoLogin(P, "priya")]);

// Aarav taps Buy → Deal Card at ₹2,800
await A.goto(`${BASE}/post/${post.id}`);
await A.getByTestId("cta").filter({ hasText: "Buy" }).click({ timeout: 30000 });
await A.waitForURL(new RegExp(`/chat/d/${priya.nexconn_user_id}`), { timeout: 30000 });
const { data: deal0 } = await admin.from("deals").select("id").eq("post_id", post.id).eq("buyer_id", aarav.id).order("created_at", { ascending: false }).limit(1).single();
const aCard = A.locator(`[data-testid="deal-card"]`).last();
await aCard.getByTestId("deal-status").filter({ hasText: "Offer" }).waitFor({ timeout: 20000 });

// 1. The chat understands deals: Priya TYPES a price; Pactly offers to make it a counter-offer
await P.goto(`${BASE}/chat/d/${aarav.nexconn_user_id}`);
const pCard = P.getByTestId("deal-card").last();
await pCard.getByTestId("act-counter").waitFor({ timeout: 30000 });
const tag = `#${Date.now() % 100000}`;
await P.getByTestId("composer").fill(`2600 final bhai, kal le lo ${tag}`);
const chip = P.getByTestId("smart-price");
await chip.filter({ hasText: "₹2,600" }).waitFor({ timeout: 5000 });
ok(`Typed "2600 final bhai…" → chip: "${(await chip.innerText()).split("\n")[0]}"`);
await chip.click();
await P.getByTestId("bubble").filter({ hasText: tag }).waitFor({ timeout: 15000 });
await pCard.getByTestId("deal-price").filter({ hasText: "2,600" }).waitFor({ timeout: 15000 });
await aCard.getByTestId("deal-price").filter({ hasText: "2,600" }).waitFor({ timeout: 20000 });
ok("One tap sent the message AND countered ₹2,600 on the Deal Card, live for Aarav");

// Aarav sees a chip under Priya's message to accept that price
const incoming = A.getByTestId("smart-price-incoming");
await incoming.filter({ hasText: "Accept ₹2,600" }).waitFor({ timeout: 20000 });
ok(`Under Priya's message Aarav sees: "${await incoming.innerText()}"`);
await incoming.click();
await aCard.getByTestId("deal-status").filter({ hasText: "Agreed" }).waitFor({ timeout: 15000 });
await pCard.getByTestId("deal-status").filter({ hasText: "Agreed" }).waitFor({ timeout: 20000 });
ok("Accepted from the chat chip → Agreed on both cards");

// 2. Meetup Card: propose → suggest another → accept, all on ONE card
await A.getByTestId("meetup-btn").click();
await A.getByTestId("meetup-spot-chip").filter({ hasText: "Library entrance" }).click();
await A.getByTestId("meetup-send").click();
const aMeet = A.getByTestId("meetup-card").last();
await aMeet.getByTestId("meetup-spot").filter({ hasText: "Library entrance" }).waitFor({ timeout: 15000 });
const pMeet = P.getByTestId("meetup-card").last();
await pMeet.getByTestId("meetup-status").filter({ hasText: "Proposed" }).waitFor({ timeout: 20000 });
ok("Aarav proposed Library entrance; Priya received the Meetup Card");
await pMeet.getByTestId("meetup-suggest").click();
await P.getByTestId("meetup-spot-chip").filter({ hasText: "Food court" }).click();
await P.getByTestId("meetup-time-chip").filter({ hasText: "Tomorrow 10 am" }).click();
await P.getByTestId("meetup-send").click();
await aMeet.getByTestId("meetup-spot").filter({ hasText: "Food court" }).waitFor({ timeout: 20000 });
await aMeet.getByTestId("meetup-time").filter({ hasText: "Tomorrow, 10:00" }).waitFor({ timeout: 5000 });
ok("Priya suggested Food court, tomorrow 10 am → the SAME card changed in place for Aarav");
await aMeet.getByTestId("meetup-accept").click();
await aMeet.getByTestId("meetup-status").filter({ hasText: "Confirmed" }).waitFor({ timeout: 15000 });
await pMeet.getByTestId("meetup-status").filter({ hasText: "Confirmed" }).waitFor({ timeout: 20000 });
await A.getByTestId("meetup-strip").filter({ hasText: "Food court" }).waitFor({ timeout: 10000 });
await P.getByTestId("meetup-strip").filter({ hasText: "Food court" }).waitFor({ timeout: 10000 });
ok("Aarav accepted → Confirmed on both; reminder strip pinned in both chats");

// 3. Handover Code: only the payer (Aarav) sees it; Priya must type it
const code = (await aCard.getByTestId("handover-code").innerText({ timeout: 15000 })).trim();
if (!/^\d{4}$/.test(code)) throw new Error("bad code " + code);
if (await pCard.getByTestId("handover-code").count()) throw new Error("Seller must not see the code!");
const leak = await P.evaluate(async (id) => (await (await fetch(`/api/deals/${id}`)).json()).handoverCode, deal0.id);
if (leak) throw new Error("Code leaked to seller via API");
// Even with her own login, Priya can't read the code table directly (RLS, no policies)
const asPriya = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: signErr } = await asPriya.auth.signInWithPassword({ email: "priya@demo.pactly.app", password: process.env.DEMO_PASSWORD });
if (signErr) throw new Error("priya sign-in: " + signErr.message);
const { data: rows } = await asPriya.from("deal_secrets").select("*");
if (rows?.length) throw new Error("deal_secrets readable by a participant!");
ok(`Aarav sees handover code ${code}; Priya's card, the API and direct DB access never reveal it`);
const wrong = code === "0000" ? "1111" : "0000";
await pCard.getByTestId("handover-input").fill(wrong);
await pCard.getByTestId("handover-submit").click();
await pCard.getByRole("alert").filter({ hasText: "doesn't match" }).waitFor({ timeout: 15000 });
ok("Wrong code rejected (tries counted)");
// That 400 was intentional; don't count it as an app error.
for (let i = errors.length - 1; i >= 0; i--) if (errors[i].includes("400")) errors.splice(i, 1);
await pCard.getByTestId("handover-input").fill(code);
await pCard.getByTestId("handover-submit").click();
await pCard.getByTestId("deal-status").filter({ hasText: "Done" }).waitFor({ timeout: 15000 });
await aCard.getByTestId("deal-status").filter({ hasText: "Done" }).waitFor({ timeout: 20000 });
ok("Right code → Done for BOTH in one step (no double 'Mark done')");

// 4. Sealed Receipt in the chat, verifiable
const { data: sealed } = await admin.from("deals").select("receipt_hash, sealed_at, handover_verified_at, price").eq("id", deal0.id).single();
if (!sealed.receipt_hash || !sealed.handover_verified_at) throw new Error("deal not sealed");
const pRec = P.getByTestId("receipt-card").last();
const aRec = A.getByTestId("receipt-card").last();
await pRec.waitFor({ timeout: 15000 });
await aRec.waitFor({ timeout: 20000 });
const seal = (await aRec.getByTestId("receipt-seal").innerText()).replace(/[\s…]/g, "");
if (!sealed.receipt_hash.startsWith(seal)) throw new Error(`seal mismatch ${seal}`);
ok(`Sealed Receipt delivered to both: ₹2,600 · seal ${seal.slice(0, 8)}… · "${(await aRec.innerText()).includes("Handover verified") ? "🔐 Handover verified" : "?"}"`);
await aRec.getByTestId("receipt-verify").click();
await A.getByTestId("seal-result").filter({ hasText: "Seal verified" }).waitFor({ timeout: 20000 });
ok("Verify seal → server recomputed SHA-256 → ✅ Seal verified");

// Tamper with the record: the seal must break
await admin.from("deals").update({ price: 1 }).eq("id", deal0.id);
await A.reload();
await A.getByTestId("seal-result").filter({ hasText: "does not match" }).waitFor({ timeout: 20000 });
await admin.from("deals").update({ price: sealed.price }).eq("id", deal0.id);
await A.reload();
await A.getByTestId("seal-result").filter({ hasText: "Seal verified" }).waitFor({ timeout: 20000 });
ok("Tampering with the price in the database breaks the seal; restoring it verifies again");
// A forged receipt (wrong hash in the link) is flagged
await A.goto(`${BASE}/receipt/${deal0.id}?h=${"f".repeat(64)}`);
await A.getByTestId("seal-result").filter({ hasText: "does not match" }).waitFor({ timeout: 20000 });
ok("A receipt with a forged seal is flagged as not genuine");

const { data: after } = await admin.from("profiles").select("id, completed_deals").in("id", [aarav.id, priya.id]);
const inc = after.every((x) => x.completed_deals === people.find((p) => p.id === x.id).completed_deals + 1);
if (!inc) throw new Error("completed_deals not incremented");
ok("completed_deals incremented for both (trust score)");
await finish();
