# Pactly: Every deal, sealed in chat

**Nexconn Build Challenge · Track: Marketplace & Support**

| | |
|---|---|
| Live app | https://pactly-liard.vercel.app |
| Nexconn App Key | `e0x9wycferqfq` |
| Platform | Web (responsive, mobile-first) |
| Nexconn products | Chat SDK for Web (`@nexconn/chat` 26.5.1) and the Platform Chat API |

---

## Why we built it

On an Indian campus almost everything is a small deal: a ₹60 parcel pickup, a ₹650 second-hand calculator, a ₹80 shared ride to the station. These deals already happen in chat, but in chats that don't understand deals. Prices get lost in the scroll, nobody is sure what was agreed, and first-year students meet the same scripts every term: *"pay first"*, *"send the OTP"*, *"scan this QR to receive the money"*, *"let's continue on WhatsApp"*.

We wanted the chat itself to carry the deal.

## The problem it solves

1. **Ambiguity.** Negotiation is spread across messages, with no single record of price, status or who pays whom.
2. **Fraud.** Payment-QR, OTP and advance-payment scams rely on rushing people and moving them off-platform.
3. **No accountability.** There's no verified identity, no reputation and no evidence when something goes wrong.

## What Pactly is

A campus peer-to-peer app for **Tasks**, **Market** (buy and rent) and **Rides**, open only to students who verify with a college ID. Every interaction becomes a conversation, and every conversation can hold a live, structured deal.

## Innovation in communication

**1. Deal Cards: the deal lives in the message.**
Tapping *Accept*, *Buy* or *Offer a ride* posts a custom **`Pactly:DealCard`** message into a Nexconn 1:1 chat. The card moves through `Offer → Counter → Agreed → In progress → Done → Review`. A counter-offer changes the price **on the same card, in place, for both people**; nobody re-sends a new offer. We built this on **Nexconn message metadata**. The card is sent with metadata enabled, each transition calls `message.setMetadata()`, and the other client re-renders the card from `onMessageMetadataUpdated`. Because Nexconn history returns the latest metadata, the card survives reloads and device changes. "Done" needs both people to confirm, and then each is asked for a 1–5★ review.

**2. The chat understands deals.**
People don't negotiate by pressing buttons; they type *"2200 last price?"*. Pactly reads prices in plain messages, on the device, in English, Hinglish (*"2.2k chalega?"*, *"2300 dunga"*) and Indian scripts (*"मैं २२०० दूंगा"*), and ignores phone numbers, times, years and roll numbers. The sender gets one chip, **"Send & make ₹2,200 a counter-offer"**, which sends the message *and* updates the Deal Card. The receiver gets **"Accept ₹2,200 on the Deal Card"** under that message. Free-form chat becomes a structured deal in one tap.

**3. Payment details are earned, not exchanged.**
The payee's UPI ID is hidden until both sides tap *Agree*. Even then, the payer passes through a **Hold** step first: a 5-second pause and three quick checks ("I've seen the item", "nobody asked me to scan or share an OTP", "I'm paying this person directly"). Most scams depend on urgency; Hold removes it.

**4. Meetup Card: one card, not twenty "where are you?" messages.**
Tap 📍 to propose a public campus spot (Main gate, Library, Food court…) and a time. The other person taps **Accept** or **Suggest another**, and the *same* card changes in place for both, again through **Nexconn message metadata**. A confirmed meetup pins a reminder strip under the chat header that turns amber 15 minutes before: *"Check the item first, then share your handover code."*

**5. Handover Code + Sealed Receipt: "Done" is proven, and the record can't be quietly changed.**
After both agree, only the payer sees a 4-digit **handover code**. It's never sent to the other person: not in the UI, not in the API, and not readable from the database even with their own login. At the meetup, the person handing over types it in. A match proves they met and completes the deal for both in one step. Every finished deal then posts a **Sealed Receipt** into the chat: final price, who paid whom, the time, and a **SHA-256 seal** of the whole deal record (price, people, handover and every step). **Verify seal** recomputes the hash from the database. If anyone changes the record later, or forwards a receipt with a fake seal, Pactly says so. *Every deal, sealed in chat*, literally.

**6. Scam Guard speaks up for the receiver.**
Incoming messages are checked on the client (instant) and re-checked on the server (recorded for moderators). The receiver, and only the receiver, sees a banner that names the trick, for example *"Scanning a QR never receives money. It only sends."* It detects pay-first and advance requests, OTP requests, "scan to receive", moves to WhatsApp or Telegram, phone numbers, and **payment QR images**. QR images are decoded both on the sender's device (and flagged in message metadata) and on the receiver's device, from the image thumbnail Nexconn carries inside the message.

**7. Ride Rooms: a group chat that knows it's a ride.**
Booking a seat adds the passenger to a **Nexconn group channel** for that ride. A pinned card shows the route, departure, seats left and each passenger's fuel share, and it updates live as others book. When the driver marks the ride complete, the group is **frozen** through the Nexconn API and the room becomes a read-only record.

**8. Evidence is one tap away.**
Long-press any message to report it. The **10 messages before and after** are attached automatically, and moderators see the transcript with the reported line highlighted. Block is enforced by **Nexconn's user blocklist**, so the platform rejects the blocked person's messages, not just our UI.

**9. Every student can read every deal.**
Indian campuses mix Hindi, Tamil, Telugu and English. With **Nexconn built-in translation**, anyone can tap **🌐 Translate** under a message to read it in their own language. *"क्या साइकिल अभी भी उपलब्ध है?"* becomes *"Is the bicycle still available?"*, and an English reply shows in Tamil for a Chennai student. One-tap **quick replies** (including a chip that sends a real counter-offer) make negotiating even faster.

**10. Trust that explains itself.**
Each profile shows a trust score and its breakdown: verified 40, profile 20, completed deals 20, rating 10, campus invites 10. New users show "New", never a fake 5.0★.

## Nexconn SDK features used

| Capability | Nexconn API | Used for |
|---|---|---|
| Initialize and connect | `NCEngine.initialize`, `NCEngine.connect`, `ConnectionStatusHandler` | One connection per session, token from our server |
| Custom message types | `NCEngine.registerCustomMessages`, `SendMessageParams` | `Pactly:DealCard`, `Pactly:DealEvent` (timeline pills), `Pactly:RideCard`, `Pactly:Meetup`, `Pactly:Receipt` |
| **Message metadata** | `SendMessageParams.metadata`, `message.setMetadata`, `onMessageMetadataUpdated` | Deal Cards and Meetup Cards updating in place; sender-side QR flag for Scam Guard |
| Direct channels | `DirectChannel.sendMessage` / `sendMediaMessage` | Deal chats, text and photos |
| Group channels | `GroupChannel`, server `group-channel/create`, `join`, `freeze-list/add` | Ride Rooms and archiving |
| Message history | `BaseChannel.createMessagesQuery` | Chat history, restoring card state, report evidence |
| Read receipts | `needReceipt`, `sendReadReceiptResponse`, `onMessageReceiptResponse`, `getMessageReadReceiptInfo` | ✓ / ✓✓ in chat and in the list |
| Unread counts | `getTotalUnreadCount`, `channel.unreadCount`, `clearUnreadCount` | Nav badge and per-chat badges |
| Conversation list | `BaseChannel.createChannelsQuery` | Messages tab |
| **Channel tags** | `Tag.createTag`, `tag.addChannels`, `Tag.createTaggedChannelsQuery`, `tag.getUnreadCount` | All / Tasks / Market / Rides filters with per-tag unread |
| **Built-in translation** | `NCEngine.translateModule.translateMessages`, `TranslateMessageParam`, `TranslateHandler.onTranslationCompleted` | 🌐 Translate in English, Hindi, Tamil, Telugu, Kannada, Bengali |
| Push config | `SendMessageParams.pushConfig` | Deal notifications |
| Server: users | `auth/access-token/issue` | Registration and tokens (App Secret server-only) |
| Server: blocklist | `user/blocklist/add`, `remove` | Block User |

## How it's built

- **Front end:** Next.js (App Router) + TypeScript + Tailwind, designed at 390px first.
- **Chat:** Nexconn Chat SDK for Web with our own React UI. We chose the SDK over Chat UI because Deal Cards, receiver-only banners and report-with-context need custom rendering inside the message list.
- **Data:** Supabase Postgres with row-level security on every table, Supabase Auth (email OTP) and Storage (a private bucket for ID cards).
- **Integrity:** Postgres is the source of truth for deals. Every transition is validated on the server against a shared state machine, with optimistic concurrency, so two people tapping "Done" at the same moment both succeed. Finished deals are sealed with a SHA-256 hash of their record. Nexconn metadata is the live sync layer.
- **Safety:** the App Secret and service-role keys are server-only, handover codes sit in a table only the server can read, the UPI ID is revealed by the server only to the paying party after Agreed, and ID images are reachable only through short-lived signed URLs on the admin page.
- **Quality:** an automated Playwright suite drives two or three real users through every flow at 390px and fails on any console error.

## Out of scope (by design)

Escrow and in-app payments, referral rewards, tutorials, Circles and live ride location. Pactly never holds money.

## Credits

The concept was inspired by existing campus marketplace apps. **Every line of code in Pactly was written fresh** for this challenge; no code, assets or branding were copied.
