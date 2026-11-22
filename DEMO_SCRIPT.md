# Pactly demo video script (about 4:00)

Shows **Deal Cards that understand typed prices, Meetup Cards, Handover Code + Sealed Receipt, Ride Room, Scam Guard and Report-with-evidence** working live between real users, all on Nexconn.

## Before you record

1. Run `npm run demo:cleanup`. It clears earlier test chats, deals and reports and restores the seed data.
2. Open **three browser windows** at phone size (DevTools → device toolbar → 390 × 844):
   - **Left:** normal window, signed in as **Aarav** (the buyer).
   - **Right:** incognito window, signed in as **Priya** (the seller and driver).
   - **Third:** a second browser profile (or another browser) for **Meera**, the admin. You only need it for shots 7 and 9.
   On the login screen, tap the **Aarav / Priya / Meera** demo buttons.
3. Keep `scripts/e2e/pay-qr.png` handy. It's a sample UPI payment QR for the Scam Guard shot.
4. Arrange Aarav and Priya side by side, so viewers see one person's action land on the other screen.

---

## Shot list

### 1 · Hook (0:00–0:15)
**Screen:** Pactly login page, then the feed.
**Voice-over:** "On campus, every small deal happens in chat, but chats don't understand deals. Pactly puts the deal *inside* the chat. Every deal, sealed in chat."
**Action:** Tap **Aarav**. The feed loads.

### 2 · Verified campus feed (0:15–0:35)
**Screen:** Aarav's feed.
**Action:** Toggle **Campus → Global**. Tap the **Rides** pill, then **All**. Type "calc" in search, then clear it. Point at Rohan's card showing **"New"**.
**Voice-over:** "Only students with a verified college ID can deal. Every card shows the poster's rating and trust score, and new users show 'New', not a fake five stars."
*(Optional, 5 s: tap **+** to show the three post types: Task, Market, Ride.)*

### 3 · Deal Card + "the chat understands deals" (0:35–1:10) ⭐
**Screen:** Both windows.
1. **Aarav** opens *Hercules Roadeo cycle* (₹2,800) and taps **Buy · ₹2,800**. A Nexconn chat opens with the **Deal Card** at *Offer*.
2. **Priya** opens **Chats** → Aarav, and just *types* **"2500 final bhai"**. Don't send yet. A chip appears: **"🤝 Send & make ₹2,500 a counter-offer"**. Tap it.
3. **Hold on Aarav's screen:** the message arrives, and the same card flips to **Counter-offer ₹2,500** (₹2,800 crossed out) without a reload. Under Priya's message Aarav sees **"✅ Accept ₹2,500 on the Deal Card"**.

**Voice-over:** "Nobody negotiates by pressing buttons. Pactly reads the price in a normal message, in English, Hinglish or Hindi, and turns it into a real counter-offer. And it's the same card, updated in place for both people with Nexconn message metadata."

### 4 · Agree → Hold → UPI (1:10–1:30)
1. **Aarav** taps **Accept ₹2,500** under Priya's message. Both cards turn **Agreed**.
2. **Aarav** taps **Pay ₹2,500 to Priya via UPI**. The **Hold** sheet: a 5-second countdown and three checks. Tick all three, tap **Continue**. The UPI ID appears. Close the sheet.

**Voice-over:** "Payment details unlock only after both agree, and Scam Guard makes you pause and confirm nobody asked you to scan or share an OTP. Pactly never holds money."

### 4b · Meetup Card (1:30–1:50)
1. **Aarav** taps **📍**, picks **Library entrance**, **Today 5 pm**, then **Send**.
2. **Priya** taps **Suggest another** → **Food court** → **Send**. On Aarav's screen the *same* card changes to Food court.
3. **Aarav** taps **Accept**. Both cards say **Confirmed**, and a 📍 reminder strip pins under both chat headers.

**Voice-over:** "No more twenty 'where are you' messages. One meetup card, public campus spots, edited in place, with a reminder pinned on top."

### 5 · Handover Code → Sealed Receipt (1:50–2:25) ⭐
1. Point at **Aarav's** card: **🔐 Your handover code: 4 8 2 7**. Point at **Priya's** card: no code, just an input box.
2. **Priya** types the code from Aarav's screen and taps **Verify**. Both cards turn **Done** at once.
3. A **🧾 Sealed Receipt** appears in both chats: ₹2,500, paid by Aarav to Priya, *🔐 Handover verified*, and a SHA-256 seal.
4. **Aarav** taps **Verify seal**. The page shows **✅ Seal verified** with the sealed timeline. Go back.
5. **Aarav** gives 5★ and **Priya** gives 4★. Both cards turn **Reviewed**.

**Voice-over:** "Only the buyer sees the handover code, and he shows it only once he has the cycle. When Priya types it, that proves they met, and the deal closes for both. Pactly then seals the deal: a receipt in the chat with a SHA-256 fingerprint of the whole record. Change anything later and the seal breaks. Every deal, sealed in chat."

### 6 · Scam Guard (2:25–2:55)
**Screen:** The same chat.
1. **Priya** sends: *"Bro pay first 500 advance, then I'll keep it for you"*. **Aarav** sees a red **Scam Guard · Pay-first pressure** banner. Point out that Priya, the sender, sees no banner.
2. **Priya** sends: *"I sent you money, just share the OTP to receive it"*. Aarav sees an **OTP request** warning.
3. **Priya** taps 📎 and sends `pay-qr.png`. Aarav sees **"Scanning a QR never *receives* money. It only sends."**

**Voice-over:** "Scam Guard checks every incoming message on the device and again on our server, and warns only the person at risk, in plain words, naming the exact trick."

### 7 · Report with evidence, and Block (2:55–3:15)
1. **Aarav** long-presses the *"pay first"* message (or taps its **⋯**), taps **Report message**, picks **Scam**, then **Send report**. The confirmation reads *"…with N messages of context."*
2. **Meera** opens **Profile → Open moderation dashboard**. The report shows the transcript with the reported line highlighted in red.
3. *(Optional)* **Aarav** taps **⋯ → Block user**. Priya's next message fails with *"This person isn't accepting messages from you."* Then unblock.

**Voice-over:** "One long-press attaches the ten messages before and after as evidence, so moderators see context, not just a screenshot. Block is enforced by Nexconn's platform blocklist."

### 7b · Translate (3:15–3:25)
1. **Priya** sends a Hindi message: *"क्या मैं कल शाम को साइकिल ले सकता हूँ?"*
2. **Aarav** taps **🌐 Translate** under it, and the English appears below the message.
3. *(Optional)* **Priya** opens **⋯ → Translate messages into → தமிழ்** and translates Aarav's English reply into Tamil.

**Voice-over:** "Campuses speak many languages. Nexconn's built-in translation lets every student read every deal, with one tap."

### 8 · Ride Room (3:25–3:45)
1. **Aarav** opens **Campus → Katpadi station, evening drop** (₹80/seat), taps **Book a seat**, then **Book & join Ride Room**. The group chat opens with the pinned card: *2 of 3 seats left · Aarav ₹80*.
2. **Meera** books **2 seats** on the same ride. On Aarav's screen the pinned card updates live: *0 left · Meera ₹160 · Total ₹240*.
3. **Priya** (the driver) opens **Chats → the ride room**, sends *"Leaving at 4:50 from main gate 🚗"*, and both riders receive it.
4. **Priya** taps **Mark ride complete**. Every screen shows *"Ride completed. This room is archived and read-only."* and the composer disappears.

**Voice-over:** "Booking a seat drops you into a Nexconn group for that ride, with fares pinned on top. When the ride's done, the room is frozen as a permanent record."

### 9 · Messages tab, admin, close (3:45–4:00)
1. **Aarav** opens **Chats**. Tap **Market**, **Rides** and **All**. Point at the unread badges and the ✓✓ read receipts.
2. **Meera's** admin page: show **Vikram Rao**'s pending college ID and tap **Approve**.
3. End on the Pactly logo or login screen.

**Voice-over:** "Conversations are organised with Nexconn channel tags, with unread counts and read receipts. Pactly: every deal, sealed in chat."

---

## Recording tips

- Record at 1080p and zoom the browser to 110–125% so the cards are readable.
- Pause about 1 second after each tap on the *other* window, so viewers see the live update land.
- If anything gets out of sync while practising, run `npm run demo:cleanup` and start again.
