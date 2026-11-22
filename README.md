# Pactly
Live app : https://pactly-live.vercel.app
**Every deal, sealed in chat.**

Pactly is a campus peer-to-peer app for verified students. You can post a **task** (errands, notes, design work), **sell or rent** things, or **share a ride**. Every deal then happens inside a Nexconn-powered chat: the offer, the counter-offer, the agreement, the payment hand-off and the review all happen on a live **Deal Card**, so both people always see the same state.

Built for the **Nexconn Build Challenge**, track **Marketplace & Support**.

---

## The problem

Campus trading runs on WhatsApp groups and notice boards. That causes three recurring problems:

1. **Deals drift.** Price, time and "who pays whom" are spread across dozens of messages. Nobody knows what was actually agreed.
2. **Scams target students.** "Pay first", "send me the OTP", "scan this QR to receive money" and "let's move to WhatsApp" are the standard scripts.
3. **There's no accountability.** If something goes wrong there is no evidence trail, no reputation and no one to report to.

Pactly keeps the negotiation and the record in one place: the chat. The chat is structured, safe by default and backed by verified campus identity.

## Features

| # | Feature | What it does |
|---|---|---|
| 1 | **Campus verification** | Email OTP (or a sign-in link) → pick campus → department and year → upload a college ID to **private** storage. Status is Pending or Verified, and only moderators can see the ID. A `DEV_AUTO_VERIFY` flag exists for testing. |
| 2 | **Feed** | Campus/Global toggle, category pills (All, Tasks, Market, Rides), search, and cards showing type badge, price, location, and the poster's rating and trust badge. New users show **"New"**, not a fake 5.0★. |
| 3 | **Post creation** | Centre **+** button with three forms: Task (reward, on campus or online, needed-by), Market (sale or rent, up to 4 photos, price or daily rate), Ride (offer or need, vehicle, pickup → destination, departure window, seats, fuel share per seat). |
| 4 | **Deal Cards** ⭐ | Accept / Buy / Rent / Offer-a-ride opens a Nexconn 1:1 chat with a custom **`Pactly:DealCard`** message. The status flow `Offer → Counter → Agreed → In progress → Done → Review` **updates the same card in place for both people**. Counter-offers change the price on the card. The UPI ID unlocks only after Agreed, behind a **Hold** safety step. "Done" needs both sides to confirm, then each side gets a 1–5★ review prompt. |
| 5 | **Ride Rooms** | Booking a seat adds you to a **Nexconn group channel** for that ride. A pinned card shows the route, time, seats left and each passenger's fare, and it updates live as people book. When the driver completes the ride, the room is **archived** (the group is frozen, so it becomes read-only). |
| 6 | **Scam Guard** | Checks incoming messages on the client and again on the server. The **receiver** sees a banner that names the scam (pay-first, OTP request, "scan to receive", moving to WhatsApp/Telegram, phone numbers, **payment QR images**). A **Hold** step (5-second pause plus a 3-item checklist) comes before any payment action. |
| 7 | **Report from any message** | Long-press, right-click or **⋯** on a message → Report (Harassment / Scam / Safety / Inappropriate / Other). The **10 messages before and after** are attached as evidence automatically. **Block User** is enforced by Nexconn's platform blocklist. |
| 8 | **Profile** | Avatar, department and year, **trust score with breakdown**, rating, completed deals, skill tags, reviews, invite code, and a private UPI ID. Trust = verified 40% + profile complete 20% + completed deals 20% + rating 10% + campus invites 10%. |
| 9 | **Messages tab** | Conversation list straight from the Nexconn SDK, filtered by All / Tasks / Market / Rides using **Nexconn channel tags**, with per-tag unread badges, per-chat unread counts and ✓ / ✓✓ read receipts. |
| 10 | **Admin** (`/admin`) | Role-gated moderation: approve or reject IDs (shown through short-lived signed URLs), review reports with their evidence transcript, and see server-checked Scam Guard flags. |
| 11 | **Translate chat** 🌐 | Tap **Translate** under any message to read it in English, हिंदी, தமிழ், తెలుగు, ಕನ್ನಡ or বাংলা. Pick your language in the chat menu. |
| 12 | **Quick replies** | One-tap chips above the message box. **"Offer ₹X"** sends a real counter-offer on the Deal Card. Ride Rooms get "On my way" and "Running late". |
| 13 | **The chat understands deals** 🧠 | Type *"2200 last price?"*, *"2.2k chalega?"* or *"मैं २२०० दूंगा"* and a chip offers **"Send & make ₹2,200 a counter-offer"**. When the other person names a price, a chip under their message offers **"Accept ₹2,200 on the Deal Card"**. Runs on the device; ignores phone numbers, times, years and roll numbers. |
| 14 | **Meetup Card** 📍 | Tap 📍 to propose a public campus spot and a time. The other person taps **Accept** or **Suggest another**, and the **same card** changes in place. A reminder strip pins the confirmed meetup under the chat header and turns amber 15 minutes before. |
| 15 | **Handover Code + Sealed Receipt** 🔐🧾 | After Agreed, only the payer sees a 4-digit code. The other person types it at the meetup: a match proves they met and completes the deal for both in one step (5 tries, then fallback to "Mark done"). Every finished deal posts a **Sealed Receipt** into the chat: final terms plus a **SHA-256 seal** of the deal record. **Verify seal** recomputes it from the database, so any later change, or a forged receipt, is flagged. |

## Exactly how Pactly uses the Nexconn SDK

Messaging runs **only** on Nexconn: no Supabase Realtime, Firebase or custom sockets. We use the **Nexconn Chat SDK for Web** (`@nexconn/chat` + `@nexconn/engine` 26.5.1) with our own React UI. We chose it over Chat UI because Deal Cards, receiver-only scam banners and report-with-context need custom rendering inside the message list. Server work uses the **Nexconn Platform Chat API** with SHA1-signed requests.

### Client SDK (browser)

| Pactly feature | Nexconn API | Where |
|---|---|---|
| Init and connect (once per app) | `NCEngine.initialize({ appKey, areaCode, logLevel })`, `NCEngine.connect({ token })`, `ConnectionStatusHandler` | [`src/lib/nexconn/client.ts`](src/lib/nexconn/client.ts), [`ChatProvider.tsx`](src/components/chat/ChatProvider.tsx) |
| Custom message types | `NCEngine.registerCustomMessages([...])`: `Pactly:DealCard`, `Pactly:DealEvent`, `Pactly:RideCard`, `Pactly:Meetup`, `Pactly:Receipt` | `client.ts` |
| **Deal Card sent** | `new SendMessageParams(content, 'Pactly:DealCard')` with **`params.metadata`** (enables message metadata), `DirectChannel.sendMessage`, `pushConfig` | [`src/lib/nexconn/messages.ts`](src/lib/nexconn/messages.ts) |
| **Deal Card updates in place** | **`message.setMetadata({status, price, …})`** on the original card; the other client receives **`MessageHandler.onMessageMetadataUpdated`** and re-renders the same card | [`DealCard.tsx`](src/components/chat/DealCard.tsx), [`useChannel.ts`](src/components/chat/useChannel.ts) |
| Deal timeline pills | `Pactly:DealEvent` custom messages (counted as unread) | `messages.ts` |
| **Meetup Card edited in place** | `Pactly:Meetup` sent with `params.metadata` (spot, time, status, proposer); **Accept / Suggest another** call `message.setMetadata()` and the other side re-renders from `onMessageMetadataUpdated` | [`MeetupCard.tsx`](src/components/chat/MeetupCard.tsx) |
| **Sealed Receipt** | `Pactly:Receipt` custom message with `pushConfig`, posted by whoever completed the deal | [`ReceiptCard.tsx`](src/components/chat/ReceiptCard.tsx) |
| Text and photos | `SendTextMessageParams`, `Helper.createSendImageMessageParams(file)` + `sendMediaMessage` | `useChannel.ts` |
| Live messages | `NCEngine.addMessageHandler` → `onMessageReceived`, `onMessagesUpdated`, `onOfflineMessageSyncCompleted` | `ChatProvider.tsx` |
| History (and restoring card state) | `BaseChannel.createMessagesQuery(...).loadNextPage()`. History returns the **latest metadata**, so a reloaded Deal Card shows its current state | `useChannel.ts` |
| Read receipts | `needReceipt`, `channel.sendReadReceiptResponse(ids)`, `onMessageReceiptResponse`, `channel.getMessageReadReceiptInfo(ids)` | `useChannel.ts`, [`messages/page.tsx`](src/app/(app)/messages/page.tsx) |
| Unread counts | `BaseChannel.getTotalUnreadCount()`, `channel.unreadCount`, `channel.clearUnreadCount()` | `ChatProvider.tsx`, `useChannel.ts` |
| Conversation list | `BaseChannel.createChannelsQuery({ channelTypes: [DIRECT, GROUP] })`, `channel.latestMessage` | `messages/page.tsx` |
| **Tasks / Market / Rides filters** | **Channel tags**: `Tag.createTag`, `tag.addChannels`, `Tag.createTaggedChannelsQuery`, `tag.getUnreadCount` | `ChatProvider.tsx`, `messages/page.tsx` |
| **Translate messages** | **Built-in translation**: `NCEngine.translateModule.translateMessages([new TranslateMessageParam(id, "auto", lang, text)])`, results via `TranslateHandler.onTranslationCompleted`; temporary `TRANS_FAILED` errors are retried once | `ChatProvider.tsx`, `ChatScreen.tsx` |
| Ride Room chat | `GroupChannel` send and history | `useChannel.ts`, [`ChatScreen.tsx`](src/app/(app)/chat/[kind]/[id]/ChatScreen.tsx) |
| Blocked / frozen handling | SDK `ErrorCode` 405 `REJECTED_BY_BLACKLIST`, 22406 `NOT_IN_GROUP`, 22408 `FORBIDDEN_IN_GROUP` | `useChannel.ts` |

### Server (Platform Chat API, App Secret never leaves the server)

| Pactly feature | Endpoint | Where |
|---|---|---|
| Register user and issue token | `POST /v4/auth/access-token/issue` | [`src/lib/nexconn/server.ts`](src/lib/nexconn/server.ts), [`/api/nexconn/token`](src/app/api/nexconn/token/route.ts) (returns a token only for the signed-in user) |
| Create Ride Room | `POST /v4/group-channel/create` (owner = driver) | [`/api/rides/[postId]/book`](src/app/api/rides/[postId]/book/route.ts) |
| Join Ride Room | `POST /v4/group-channel/join` | same |
| Archive Ride Room | `POST /v4/group-channel/freeze-list/add` | [`/api/rides/[postId]/complete`](src/app/api/rides/[postId]/complete/route.ts) |
| Block / unblock user | `POST /v4/user/blocklist/add` / `remove` | [`/api/blocks`](src/app/api/blocks/route.ts) |
| Demo reset (tooling) | `POST /v4/channel/message/history/delete`, `freeze-list/remove` | [`scripts/reset-demo.mjs`](scripts/reset-demo.mjs) |

Signing follows the docs: `Signature = SHA1(AppSecret + Nonce + Timestamp)`. Requests time out after 5 s and fail over to the backup domain (`api-b.*`).

## Architecture

```
 Browser (Next.js client, 390px-first)                 Next.js server (Vercel)                 Services
┌─────────────────────────────────────┐   fetch   ┌───────────────────────────────┐
│ ChatProvider ── @nexconn/chat SDK ──┼───────────┼──────────────────────────────►│  Nexconn IM (WebSocket)
│   DealCard · RideRoomCard · Scam    │ token     │ /api/nexconn/token  ──signed──┼─► Nexconn Platform API
│   Guard · Report · Messages (tags)  │◄──────────┤ /api/rides/* (group, freeze)  │    (user, group, blocklist)
│ Supabase JS (RLS) for feed/profile  │           │ /api/deals/* (state machine)  │
└─────────────────────────────────────┘           │ /api/reports · /api/scam/flag │─► Supabase Postgres + Storage
                                                   │ proxy.ts (auth refresh/gate)  │    (RLS on every table)
                                                   └───────────────────────────────┘
```

**Deal Card round trip:**
1. A user taps **Accept**.
2. `POST /api/deals/:id/action` checks the move against the shared state machine ([`src/lib/deals.ts`](src/lib/deals.ts)), with optimistic concurrency and automatic retry, then updates Postgres.
3. The client calls `message.setMetadata()` on the Nexconn DealCard.
4. The other client receives `onMessageMetadataUpdated`, reconciles against `/api/deals/:id`, and updates the card in place.

**Handover Code and seal.** The code lives in `deal_secrets` (RLS on, no policies: only the server can read it) and is returned by `/api/deals/:id` only to the payer. `POST /api/deals/:id/handover` checks it with a constant-time compare and counts wrong tries. When a deal completes, the server stores `sealed_at` and `receipt_hash = SHA-256(canonical deal record)` covering price, people, handover time and every timeline step ([`src/lib/dealServer.ts`](src/lib/dealServer.ts)); `/receipt/:id` recomputes it.

Postgres is the source of truth, so a modified client can't fake a state. Nexconn metadata is the live sync channel.

### Data model (Supabase, RLS on every table)

`campuses` · `profiles` (public: verification_status, trust_score, rating_avg, completed_deals, invite_code, `nexconn_user_id` = uuid without dashes) · `profile_private` (UPI ID and ID-card path, owner-only) · `posts` (type task/market/ride, type-specific `details` JSON, status) · `deals` (buyer, seller, price, status, done flags, `nexconn_message_id`, history, `handover_verified_at`, `sealed_at`, `receipt_hash`) · `deal_secrets` (handover codes, server-only) · `ride_bookings` · `reviews` · `reports` (evidence JSON) · `blocks` · `scam_flags`.

Triggers keep `trust_score` and `rating_avg` current. `book_ride()` books seats atomically with a row lock. Users can only update safe profile columns (column-level grants). UPI is revealed only by the server, only to the paying party, and only after Agreed.

Migrations: [`supabase/migrations`](supabase/migrations).

## Run it locally

Requirements: Node 20+, a Nexconn app (console.nexconn.ai), and a Supabase project.

```bash
npm install
cp .env.example .env.local          # fill in the values below
npm run db:migrate                  # needs SUPABASE_DB_URL (local tooling only)
npm run db:seed                     # 2 campuses, 8 students, 15 posts
npm run dev                         # http://localhost:3000
```

| Variable | Where | Notes |
|---|---|---|
| `NEXCONN_APP_KEY` | server | Sent to the browser through the token route (the App Key is public) |
| `NEXCONN_APP_SECRET` | **server only** | Signs Platform API calls |
| `NEXCONN_API_HOST` | server | `api.sg-light-api.com` (Singapore), `api.us-light-api.com` or `api.sau-light-api.com` |
| `NEXT_PUBLIC_NEXCONN_AREA` | client | `SG`, `NA`, `SA` or `OM`. Must match the data center |
| `NEXT_PUBLIC_NEXCONN_LOG` | client | `WARN` (default) or `DEBUG` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | |
| `DEV_AUTO_VERIFY` | server | `true` auto-verifies uploaded IDs (testing) |
| `NEXT_PUBLIC_DEMO_MODE`, `DEMO_PASSWORD` | server | One-tap demo logins for Aarav, Priya and Meera (admin) |
| `DEV_EMAIL_LOGIN`, `NEXT_PUBLIC_DEV_EMAIL_LOGIN` | local only | `true` shows "Local test: sign in without email" (works around Supabase's hourly email limit). Ignored in production |
| `SUPABASE_DB_URL` | **local only** | Migrations and seed. Never deploy it |

**Two-user testing:** open a normal window and an incognito window and sign in as different demo students.

## Tests

```bash
npm run test:rules   # Scam Guard rules + price-detection unit checks
npm run test:e2e     # Playwright, two or three real users at 390px against the running dev server
npm run demo:cleanup # remove test activity among demo students only (safe with real users)
npm run demo:reset   # WIPES ALL activity incl. real users (only before launch)
```

The e2e suite drives real browsers through Nexconn. It covers:
- smart price chips, Meetup Card (propose → suggest → accept, in place), Handover Code (hidden from the seller in UI, API and DB) and Sealed Receipt (verify, tamper and forgery detection)
- the full Deal Card lifecycle (counter updates in place, Hold → UPI, double-confirm Done, reviews, reload persistence, read receipts)
- Ride Rooms with three users (live seat updates, archiving)
- Scam Guard (text and payment-QR, server re-check)
- report-with-evidence, block via Nexconn's blocklist
- Messages tag filters and unread counts, profile and admin flows
- that the console has no app errors

## Deploy (Vercel)

1. Push this repo to GitHub, then create a Vercel project from it at vercel.com/new (framework: Next.js). Alternatively, run `npx vercel` in this folder.
2. Add the environment variables above **except** `SUPABASE_DB_URL`. Set `DEV_AUTO_VERIFY=false` if you want manual approval.
3. Deploy. Then in **Supabase → Authentication → URL Configuration**, set **Site URL** to your Vercel URL and add `https://<your-app>.vercel.app/auth/callback` to the **Redirect URLs**.
4. Optional but recommended: in **Supabase → Authentication → Email Templates → Magic Link**, add `Your code: {{ .Token }}` so users can type the 6-digit code as well as tapping the link. For real traffic, also configure custom SMTP, since Supabase's built-in mailer sends only a few emails per hour.

## Known limitations

- The Nexconn Web SDK sometimes tries to upload its internal logs to `logcollection.ronghub.com`. The browser blocks this with a CORS error in the console. It comes from the SDK (no init option turns it off) and has no effect on Pactly.
- On Web, Nexconn doesn't cache the conversation list locally, so the Messages tab refreshes from the server on new messages and receipts, on focus, and every 20 s.
- No escrow or in-app payments, by design. Pactly never holds money; people pay each other by UPI after agreeing.

## License and originality

All code in this repository was written fresh for the Nexconn Build Challenge. The concept is inspired by existing campus marketplace apps; no code, assets or branding were copied.
