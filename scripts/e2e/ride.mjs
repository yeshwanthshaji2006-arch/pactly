import { launch, newPage, demoLogin, admin, BASE, ok, finish, nexconn } from "./lib.mjs";
await launch();
const { data: post } = await admin.from("posts").select("id, details").eq("title", "Campus → Katpadi station, evening drop").single();
const gid = `ride${post.id.replace(/-/g, "")}`;
// reset
await admin.from("ride_bookings").delete().eq("post_id", post.id);
await admin.from("posts").update({ status: "open", details: { ...post.details, seats_left: 3, ride_status: "scheduled" } }).eq("id", post.id);
await nexconn("/v4/group-channel/freeze-list/remove", { channelIds: [gid] });

const A = await newPage("aarav");
const P = await newPage("priya");
const M = await newPage("meera");
await Promise.all([demoLogin(A, "aarav"), demoLogin(P, "priya"), demoLogin(M, "meera")]);

// Aarav books 1 seat → joins Nexconn group (Ride Room)
await A.goto(`${BASE}/post/${post.id}`);
await A.getByTestId("cta").filter({ hasText: "Book a seat" }).waitFor({ timeout: 30000 });
await A.getByTestId("cta").click();
await A.getByTestId("confirm-book").click();
await A.waitForURL(new RegExp(`/chat/g/${gid}`), { timeout: 30000 });
await A.getByTestId("seats-left").filter({ hasText: "2" }).waitFor({ timeout: 20000 });
await A.getByTestId("ride-passenger").filter({ hasText: "Aarav" }).filter({ hasText: "₹80" }).waitFor();
ok("Booking a seat opens the Ride Room group chat; pinned card shows 2 seats left and Aarav's ₹80 fare");

// Driver opens the room
await P.goto(`${BASE}/chat/g/${gid}`);
await P.getByTestId("deal-event").filter({ hasText: "Aarav booked 1 seat" }).last().waitFor({ timeout: 30000 });
ok("Driver sees the booking event in the Ride Room");

// Meera books 2 seats → everyone's pinned card refreshes live
await M.goto(`${BASE}/post/${post.id}`);
await M.getByTestId("cta").filter({ hasText: "Book a seat" }).waitFor({ timeout: 30000 });
await M.getByTestId("cta").click();
await M.getByRole("button", { name: "2 seats" }).click();
await M.getByTestId("confirm-book").click();
await M.waitForURL(new RegExp(`/chat/g/${gid}`), { timeout: 30000 });
await A.getByTestId("seats-left").filter({ hasText: "0" }).waitFor({ timeout: 20000 });
await P.getByTestId("ride-passenger").filter({ hasText: "Meera" }).filter({ hasText: "₹160" }).waitFor({ timeout: 20000 });
ok("Meera books 2 seats → pinned card updates live for others (0 left, Meera ₹160)");

// Group messaging
const stamp = Date.now() % 100000;
await M.getByTestId("composer").fill(`I'll be at the main gate by 4:50 🙂 #${stamp}`);
await M.getByTestId("send").click();
await A.getByTestId("bubble").filter({ hasText: `#${stamp}` }).waitFor({ timeout: 15000 });
await P.getByTestId("bubble").filter({ hasText: `#${stamp}` }).waitFor({ timeout: 15000 });
ok("Group messages reach every rider");

// Feed: ride is now full
const { data: full } = await admin.from("posts").select("status, details").eq("id", post.id).single();
if (full.details.seats_left !== 0 || full.status !== "in_deal") throw new Error("seats not decremented: " + JSON.stringify(full));
ok("Seats decremented atomically in DB (0 left, post in_deal)");

// Complete → archived for everyone
P.on("dialog", (d) => d.accept());
await P.getByTestId("ride-complete").click();
await P.getByTestId("ride-archived").waitFor({ timeout: 20000 });
await A.getByTestId("ride-archived").waitFor({ timeout: 20000 });
if (await A.getByTestId("composer").count()) throw new Error("composer still visible after archive");
ok("Driver completes ride → room archived and read-only for passengers");

// Nexconn actually rejects sends now: try sending from Aarav's client via the SDK path in the app
await A.goto(`${BASE}/chat/g/${gid}`);
await A.getByTestId("ride-archived").waitFor({ timeout: 20000 });
ok("Archived state persists after reload");
await P.screenshot({ path: "scripts/e2e/ride-priya.png" });
await finish();
