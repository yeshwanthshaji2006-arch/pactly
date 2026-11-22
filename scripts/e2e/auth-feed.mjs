import { launch, newPage, demoLogin, admin, BASE, ok, finish } from "./lib.mjs";
import fs from "node:fs";
await launch();

// ── New user via email link → onboarding → verified → feed
const email = `e2e+${Date.now()}@test.pactly.app`;
const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (error) throw error;
const p = await newPage("newuser");
await p.goto(`${BASE}/auth/callback?token_hash=${link.properties.hashed_token}&type=magiclink`);
await p.waitForURL(/\/onboarding/, { timeout: 30000 });
ok("email link signs in and routes a new user to onboarding");
await p.getByLabel("Full name").fill("Test Student");
await p.getByRole("button", { name: /VIT Vellore/ }).click();
await p.getByLabel("Department").fill("Computer Science");
await p.getByRole("button", { name: "2nd year" }).click();
await p.getByRole("button", { name: "Continue" }).click();
// tiny valid PNG
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
fs.writeFileSync("scripts/e2e/id.png", png);
await p.getByTestId("id-input").setInputFiles("scripts/e2e/id.png");
await p.getByRole("button", { name: /Submit for verification/ }).click();
await p.getByText("You're verified!").waitFor({ timeout: 20000 });
ok("ID uploaded to private storage and dev auto-verify marks Verified");
await p.getByTestId("go-feed").click();
await p.waitForURL(`${BASE}/`);
await p.getByTestId("post-card").first().waitFor({ timeout: 20000 });
ok(`feed loads for new user (${await p.getByTestId("post-card").count()} campus posts)`);
// private ID must not be publicly readable
const { data: priv } = await admin.from("profile_private").select("id_card_path").eq("user_id", link.user.id).single();
const pub = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/id-cards/${priv.id_card_path}`);
if (pub.ok) throw new Error("ID card is publicly readable!");
ok(`ID card is not publicly readable (HTTP ${pub.status})`);

// ── Demo student feed: toggle, pills, search
const a = await newPage("aarav");
await demoLogin(a, "aarav");
await a.getByTestId("post-card").first().waitFor({ timeout: 20000 });
const campusCount = await a.getByTestId("post-card").count();
await a.getByTestId("scope-global").click();
await a.waitForTimeout(1500);
const globalCount = await a.getByTestId("post-card").count();
if (!(globalCount > campusCount)) throw new Error(`global ${globalCount} should exceed campus ${campusCount}`);
ok(`Campus/Global toggle: ${campusCount} → ${globalCount} posts`);
await a.getByTestId("pill-ride").click();
await a.waitForTimeout(1500);
const rideBadges = await a.getByTestId("post-card").allInnerTexts();
if (!rideBadges.every((t) => t.includes("RIDE"))) throw new Error("ride pill shows non-ride posts");
ok(`Rides pill: ${rideBadges.length} rides only`);
await a.getByTestId("pill-all").click();
await a.getByLabel("Search posts").fill("calculator");
await a.waitForTimeout(1800);
const found = await a.getByTestId("post-card").allInnerTexts();
if (found.length !== 1 || !found[0].includes("Casio")) throw new Error("search failed: " + found.length);
ok("search finds the Casio calculator");
await a.getByLabel("Search posts").fill("");
await a.getByTestId("scope-campus").click();
await a.waitForTimeout(1500);
const texts = await a.getByTestId("post-card").allInnerTexts();
const rohanCard = texts.find((t) => t.includes("Rohan Verma"));
if (!rohanCard || !rohanCard.includes("New") || rohanCard.includes("★")) throw new Error("new user should show 'New' not stars");
ok("new user Rohan shows “New”, not 5.0★");
await a.screenshot({ path: "scripts/e2e/feed.png" });

await admin.auth.admin.deleteUser(link.user.id);
await finish();
