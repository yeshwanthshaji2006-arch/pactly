// Seeds Pactly with 2 campuses, 8 users, 15 posts and a few reviews. Safe to re-run (idempotent by email/title).
// Usage: node scripts/seed.mjs
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, DEMO_PASSWORD: password } = process.env;
if (!url || !key || !password) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_PASSWORD in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const campuses = [
  { slug: "vit-vellore", name: "VIT Vellore", city: "Vellore" },
  { slug: "ceg-chennai", name: "CEG, Anna University", city: "Chennai" },
];

const users = [
  { handle: "aarav", name: "Aarav Sharma", campus: "vit-vellore", dept: "Computer Science", year: 3, skills: ["React", "DSA tutoring", "Video editing"], bio: "Hostel A. Happy to help with code or carry stuff across campus.", role: "admin" },
  { handle: "priya", name: "Priya Nair", campus: "vit-vellore", dept: "Electronics (ECE)", year: 2, skills: ["Canva", "Arduino", "Notes"], bio: "Day scholar, drive to campus from Katpadi most days." },
  { handle: "meera", name: "Meera Iyer", campus: "vit-vellore", dept: "Mechanical", year: 4, skills: ["CAD", "Moderation"], bio: "Student safety volunteer and Pactly campus moderator.", role: "admin" },
  { handle: "rohan", name: "Rohan Verma", campus: "vit-vellore", dept: "Civil", year: 1, skills: [], bio: "" },
  { handle: "sneha", name: "Sneha Reddy", campus: "vit-vellore", dept: "Biotechnology", year: 3, skills: ["Lab reports", "Photography"], bio: "Weekend trips to Chennai, always looking for co-riders." },
  { handle: "kabir", name: "Kabir Singh", campus: "ceg-chennai", dept: "Computer Science", year: 4, skills: ["Python", "Interview prep"], bio: "Final year, selling off hostel stuff before placements." },
  { handle: "ananya", name: "Ananya Das", campus: "ceg-chennai", dept: "Architecture", year: 2, skills: ["Sketching", "Model making", "Posters"], bio: "Studio rat. Will design your fest poster." },
  { handle: "vikram", name: "Vikram Rao", campus: "ceg-chennai", dept: "Electrical (EEE)", year: 3, skills: ["Soldering"], bio: "", pending: true },
];
// Aarav is not an admin in the story; only Meera is. Keep role on Meera.
users[0].role = "user";

const inDays = (d, h = 18) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  t.setHours(h, 0, 0, 0);
  return t.toISOString();
};

const posts = [
  // Tasks
  { by: "rohan", type: "task", title: "Help debug my DSA assignment (C++ linked lists)", description: "Segfault in my doubly linked list delete function. Need someone to walk me through it on a call, around 1 hour.", category: "Academics", price: 300, location: "Online", details: { mode: "online", needed_by: inDays(1, 21) } },
  { by: "sneha", type: "task", title: "Pick up my Amazon parcel from the main gate", description: "Parcel arrives today, medium box. Drop it at Ladies Hostel G-block reception.", category: "Errands", price: 60, location: "Main Gate → G-block", details: { mode: "on_campus", needed_by: inDays(0, 19) } },
  { by: "kabir", type: "task", title: "Design a poster for our coding club hackathon", description: "A3 poster plus Instagram square. Theme: retro arcade. I'll share the logo and text.", category: "Design", price: 500, location: "Online", details: { mode: "online", needed_by: inDays(3) } },
  { by: "rohan", type: "task", title: "Handwritten notes for Engineering Mechanics Unit 3", description: "Need clear notes on friction and virtual work for the CAT-2 exam. Photos are fine.", category: "Academics", price: 150, location: "SJT library", details: { mode: "on_campus", needed_by: inDays(2) } },
  { by: "ananya", type: "task", title: "Return 3 library books before 5 pm", description: "Stuck in studio. Books are at my desk in the Arch block, returning them to the central library.", category: "Errands", price: 40, location: "Arch block → Central library", details: { mode: "on_campus", needed_by: inDays(0, 17) } },
  // Market
  { by: "kabir", type: "market", title: "Casio fx-991ES Plus calculator", description: "Works perfectly, allowed in all exams. Cover included.", category: "Electronics", price: 650, location: "CEG hostel", details: { listing: "sale" } },
  { by: "priya", type: "market", title: "Hercules Roadeo cycle, 1 year old", description: "21 gears, new tyres last month. Lock included. Moving to day-scholar so selling.", category: "Cycles", price: 2800, location: "VIT main parking", details: { listing: "sale" } },
  { by: "ananya", type: "market", title: "Drafter + A1 drawing board on rent", description: "For the ED/BEE drawing classes. Clean, mini-drafter with full scale set.", category: "Academics", price: 30, location: "CEG Arch block", details: { listing: "rent" } },
  { by: "kabir", type: "market", title: "Mini fridge (Godrej 30L) for hostel room", description: "Perfect for hostel, low power. Pick up only.", category: "Hostel", price: 4500, location: "CEG hostel, Block 4", details: { listing: "sale" } },
  { by: "sneha", type: "market", title: "Canon 1500D DSLR for fest weekends", description: "18-55mm kit lens, 2 batteries, 64 GB card. Aadhaar-verified students only.", category: "Electronics", price: 400, location: "VIT, Ladies Hostel", details: { listing: "rent" } },
  // Rides
  { by: "priya", type: "ride", title: "Campus → Katpadi station, evening drop", description: "Leaving after the 4:30 lab. Space for a small bag each.", category: "Station", price: 80, location: "VIT main gate", details: { ride_kind: "offer", vehicle: "Car: Swift (white)", pickup: "VIT main gate", destination: "Katpadi Jn railway station", depart_start: inDays(1, 17), depart_end: inDays(1, 18), seats_total: 3, seats_left: 3 } },
  { by: "sneha", type: "ride", title: "Vellore → Chennai airport on Friday", description: "Cab booked, splitting the fare. Toll is included in the share.", category: "Airport", price: 450, location: "VIT main gate", details: { ride_kind: "offer", vehicle: "Cab: Innova", pickup: "VIT main gate", destination: "Chennai Airport (MAA) T1", depart_start: inDays(4, 14), depart_end: inDays(4, 15), seats_total: 4, seats_left: 4 } },
  { by: "rohan", type: "ride", title: "Need a ride to Vellore Fort / VIT Mall, Saturday", description: "Going for shopping, can share fuel. Coming back by myself.", category: "City", price: 100, location: "VIT main gate", details: { ride_kind: "need", vehicle: "Any", pickup: "VIT main gate", destination: "Velocity Mall, Vellore", depart_start: inDays(2, 11), depart_end: inDays(2, 13), seats_total: 1, seats_left: 1 } },
  { by: "kabir", type: "ride", title: "Guindy → Anna Nagar after classes", description: "Bike, one pillion. Helmet provided.", category: "City", price: 60, location: "CEG main gate", details: { ride_kind: "offer", vehicle: "Bike: Activa 6G", pickup: "CEG main gate", destination: "Anna Nagar Tower Park", depart_start: inDays(1, 16), depart_end: inDays(1, 17), seats_total: 1, seats_left: 1 } },
  { by: "ananya", type: "ride", title: "Need airport pickup Sunday night", description: "Flight lands 11:40 pm, two bags. Will pay fuel plus parking.", category: "Airport", price: 600, location: "Chennai Airport", details: { ride_kind: "need", vehicle: "Car", pickup: "Chennai Airport (MAA)", destination: "CEG hostel", depart_start: inDays(5, 23), depart_end: inDays(6, 1), seats_total: 1, seats_left: 1 } },
];

const reviews = [
  // reviewer, reviewee, rating, comment
  ["priya", "aarav", 5, "Fixed my React bug in 20 mins and explained it properly."],
  ["sneha", "aarav", 5, "Super quick parcel pickup, very polite."],
  ["kabir", "ananya", 5, "Poster was 🔥. Delivered a day early."],
  ["aarav", "priya", 4, "Smooth drive to Katpadi, a bit late but informed in chat."],
  ["meera", "priya", 5, "Calculator exactly as described."],
  ["ananya", "kabir", 5, "Honest seller. Fridge works great."],
  ["priya", "sneha", 5, "DSLR was in perfect condition."],
  ["aarav", "meera", 5, "Helped me report a scammer quickly."],
];
const completed = { aarav: 4, priya: 5, ananya: 3, kabir: 6, sneha: 2, meera: 3 };

// Placeholder ID card for the pending user (shown only to admins)
const ID_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" rx="24" fill="#eef0ff"/><rect x="24" y="24" width="592" height="64" rx="12" fill="#4338ca"/><text x="48" y="66" font-family="Arial" font-size="26" fill="#fff">CEG, ANNA UNIVERSITY · STUDENT ID</text><rect x="48" y="120" width="160" height="200" rx="12" fill="#c7c9f5"/><text x="240" y="160" font-family="Arial" font-size="24" fill="#16142b">VIKRAM RAO</text><text x="240" y="200" font-family="Arial" font-size="20" fill="#444">B.E. Electrical &amp; Electronics</text><text x="240" y="236" font-family="Arial" font-size="20" fill="#444">Year III · Reg 2023105112</text><text x="240" y="300" font-family="Arial" font-size="16" fill="#888">SAMPLE · DEMO DATA</text></svg>`;

async function must(p, label) {
  const { data, error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

// 1. Campuses
await must(db.from("campuses").upsert(campuses, { onConflict: "slug" }), "campuses");
const campusRows = await must(db.from("campuses").select("id, slug"), "campuses read");
const campusId = Object.fromEntries(campusRows.map((c) => [c.slug, c.id]));

// 2. Users
const { data: existing } = await db.auth.admin.listUsers({ perPage: 1000 });
const ids = {};
for (const u of users) {
  const email = `${u.handle}@demo.pactly.app`;
  let authUser = existing.users.find((x) => x.email === email);
  if (!authUser) {
    authUser = (await must(db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: u.name } }), `create ${email}`)).user;
  } else {
    await must(db.auth.admin.updateUserById(authUser.id, { password }), `pw ${email}`);
  }
  ids[u.handle] = authUser.id;
  await must(
    db.from("profiles").update({
      full_name: u.name,
      campus_id: campusId[u.campus],
      department: u.dept,
      year: u.year,
      skills: u.skills,
      bio: u.bio || null,
      role: u.role || "user",
      onboarded: true,
      verification_status: u.pending ? "pending" : "verified",
      completed_deals: completed[u.handle] ?? 0,
    }).eq("id", authUser.id),
    `profile ${u.handle}`,
  );
  let idPath = `${authUser.id}/seed-id.svg`;
  if (u.pending) {
    await db.storage.from("id-cards").upload(idPath, new Blob([ID_SVG], { type: "image/svg+xml" }), { upsert: true, contentType: "image/svg+xml" });
  }
  await must(
    db.from("profile_private").upsert({
      user_id: authUser.id,
      upi_id: `${u.handle}.${u.name.split(" ")[1].toLowerCase()}@okaxis`,
      id_card_path: idPath,
      id_submitted_at: new Date().toISOString(),
    }),
    `private ${u.handle}`,
  );
}

// 3. Posts (skip ones that already exist by title)
const existingTitles = new Set((await must(db.from("posts").select("title"), "posts read")).map((p) => p.title));
const author = (h) => users.find((u) => u.handle === h);
const newPosts = posts
  .filter((p) => !existingTitles.has(p.title))
  .map((p, i) => ({
    author_id: ids[p.by],
    campus_id: campusId[author(p.by).campus],
    type: p.type,
    title: p.title,
    description: p.description,
    category: p.category,
    price: p.price,
    location: p.location,
    details: p.details,
    created_at: new Date(Date.now() - (i + 1) * 47 * 60 * 1000).toISOString(),
  }));
if (newPosts.length) await must(db.from("posts").insert(newPosts), "posts insert");

// 4. Reviews (seeded history without deals)
const haveReviews = (await must(db.from("reviews").select("id").is("deal_id", null), "reviews read")).length;
if (!haveReviews) {
  await must(
    db.from("reviews").insert(reviews.map(([a, b, rating, comment]) => ({ reviewer_id: ids[a], reviewee_id: ids[b], rating, comment }))),
    "reviews insert",
  );
}

console.log(`Seeded: ${campuses.length} campuses, ${users.length} users, ${posts.length} posts (${newPosts.length} new), reviews ${haveReviews ? "kept" : "added"}.`);
console.log("Demo logins: aarav / priya / meera (admin) @demo.pactly.app, password = DEMO_PASSWORD in .env.local");
