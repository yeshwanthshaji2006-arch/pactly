"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Message } from "@nexconn/chat";
import { useChannel, msgKey, type ChatKind } from "@/components/chat/useChannel";
import { channelKeyOf, useChat } from "@/components/chat/ChatProvider";
import { DealCard } from "@/components/chat/DealCard";
import { ScamBanner, useScamHits } from "@/components/chat/ScamGuard";
import { ReportSheet } from "@/components/chat/ReportSheet";
import { RideRoomCard } from "@/components/chat/RideRoomCard";
import { summarize } from "@/components/chat/summary";
import { useMe } from "@/components/ProfileProvider";
import { Avatar, ErrorState, Icon, RatingChip, Sheet, Spinner, Toast, TrustBadge } from "@/components/ui";
import { MeetupCard, MeetupSheet, meetupState, countdown, meetupWhen } from "@/components/chat/MeetupCard";
import { ReceiptCard } from "@/components/chat/ReceiptCard";
import { DEAL_CARD_TYPE, DEAL_EVENT_TYPE, MEETUP_TYPE, RECEIPT_TYPE } from "@/lib/nexconn/client";
import { meetupMetadata, sendCustom, sendDealEvent, type DealCardContent, type DealEventContent, type MeetupContent, type ReceiptContent } from "@/lib/nexconn/messages";
import { detectPrice } from "@/lib/priceIntent";
import { classifyQr } from "@/lib/qr";
import { supabaseBrowser } from "@/lib/supabase/client";
import { clock, nexconnIdFromUuid, uuidFromNexconnId } from "@/lib/format";
import { PUBLIC_PROFILE_COLUMNS, type PublicProfile } from "@/lib/types";
import type { RideManifest } from "@/lib/rideServer";
import { allowedActions, dealMetadata } from "@/lib/deals";
import type { DealView } from "@/lib/dealServer";

const LANGS: [string, string][] = [["en", "English"], ["hi", "हिंदी"], ["ta", "தமிழ்"], ["te", "తెలుగు"], ["kn", "ಕನ್ನಡ"], ["bn", "বাংলা"]];

export function ChatScreen({ kind, targetId }: { kind: ChatKind; targetId: string }) {
  const me = useMe();
  const myNx = nexconnIdFromUuid(me.id);
  const chat = useChat();
  const router = useRouter();
  const ch = useChannel(kind, targetId);
  const [other, setOther] = useState<PublicProfile | null>(null);
  const [ride, setRide] = useState<RideManifest | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [people, setPeople] = useState<Record<string, PublicProfile>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone?: "danger" | "success" } | null>(null);
  const [menuFor, setMenuFor] = useState<Message | null>(null);
  const [reportFor, setReportFor] = useState<Message | null>(null);
  const [headerMenu, setHeaderMenu] = useState(false);
  const [lang, setLang] = useState("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [activeDeal, setActiveDeal] = useState<{ msg: Message<DealCardContent>; view: DealView } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [meetupOpen, setMeetupOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stick = useRef(true);

  const flash = useCallback((t: string, tone?: "danger" | "success") => {
    setToast({ text: t, tone });
    setTimeout(() => setToast(null), 2600);
  }, []);

  // Header data: the other person (direct) or the ride manifest (group)
  const loadRide = useCallback(async () => {
    const postId = uuidFromNexconnId(targetId.replace(/^ride/, ""));
    if (!postId) return setHeaderError("Unknown ride room.");
    const r = await fetch(`/api/rides/${postId}`);
    const j = await r.json();
    if (!r.ok) return setHeaderError(j.error || "Could not load ride.");
    setRide(j);
    const map: Record<string, PublicProfile> = { [j.driver.nexconn_user_id]: j.driver };
    for (const p of j.passengers) if (p.profile) map[p.profile.nexconn_user_id] = p.profile;
    setPeople(map);
  }, [targetId]);

  useEffect(() => {
    if (kind === "g") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadRide();
      return;
    }
    const sb = supabaseBrowser();
    sb.from("profiles")
      .select(PUBLIC_PROFILE_COLUMNS)
      .eq("nexconn_user_id", targetId)
      .maybeSingle()
      .then(({ data }: { data: PublicProfile | null }) => {
        if (!data) return setHeaderError("This user no longer exists.");
        setOther(data);
        setPeople({ [data.nexconn_user_id]: data });
        sb.from("blocks").select("blocked_id").eq("blocker_id", me.id).eq("blocked_id", data.id).maybeSingle().then(({ data: b }: { data: unknown }) => setBlocked(!!b));
      });
  }, [kind, targetId, loadRide, me.id]);

  // Ride Room: refresh the pinned card whenever a ride event arrives
  useEffect(() => {
    if (kind !== "g") return;
    return chat.subscribe((e) => {
      if (e.type !== "messages") return;
      if (e.messages.some((m) => m.channelIdentifier.channelId === targetId && m.messageType === DEAL_EVENT_TYPE)) loadRide();
    });
  }, [chat, kind, targetId, loadRide]);

  // Clock for the meetup reminder strip
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll to the newest message when already near the bottom
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [ch.messages]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      stick.current = true;
      await ch.sendText(t);
      setText("");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Not sent", "danger");
    } finally {
      setSending(false);
    }
  }

  async function sendImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return flash("Only images can be sent.", "danger");
    setSending(true);
    try {
      // Sender-side Scam Guard: flag QR images in message metadata so the receiver is warned even if decode fails there.
      const qr = await classifyQr(file);
      stick.current = true;
      await ch.sendImage(file, qr ? { scan: qr === "payment" ? "payment_qr" : "qr" } : undefined);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Image not sent", "danger");
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Preferred translation language (per device)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pactly-lang");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setLang(saved);
    } catch {}
  }, []);
  function pickLang(l: string) {
    setLang(l);
    setTranslations({});
    try {
      localStorage.setItem("pactly-lang", l);
    } catch {}
  }

  const pendingTr = useRef(new Set<string>());
  const retriedTr = useRef(new Map<string, number>());
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Nexconn translation results
  useEffect(() => {
    return chat.subscribe((e) => {
      if (e.type === "translation") {
        pendingTr.current.delete(e.messageId);
        setTranslations((t) => ({ ...t, [e.messageId]: e.text }));
      } else if (e.type === "translationFailed") {
        const tries = retriedTr.current.get(e.messageId) ?? 0;
        // 28401 TRANS_FAILED / 28402 TRANS_INTERNAL_ERROR are temporary: retry once quietly.
        if ((e.code === 28401 || e.code === 28402) && tries < 1 && pendingTr.current.has(e.messageId)) {
          retriedTr.current.set(e.messageId, tries + 1);
          const msg = (ch.messages ?? []).find((x) => x.messageId === e.messageId);
          if (msg) {
            setTimeout(() => chat.translate(e.messageId, (msg.content as { text?: string }).text ?? "", langRef.current), 800);
            return;
          }
        }
        pendingTr.current.delete(e.messageId);
        flash("Couldn't translate that message. Try again.", "danger");
      }
    });
  }, [chat, flash, ch.messages]);

  async function translateMsg(m: Message) {
    const text = (m.content as { text?: string }).text ?? "";
    pendingTr.current.add(m.messageId);
    const ok = await chat.translate(m.messageId, text, lang);
    if (!ok) {
      pendingTr.current.delete(m.messageId);
      return flash("Translation isn't switched on for this app yet.", "danger");
    }
    flash("Translating…");
    setTimeout(() => {
      if (pendingTr.current.delete(m.messageId)) flash("Translation is taking too long. Try again.", "danger");
    }, 15000);
  }

  // The most recent Deal Card in this chat drives the quick-reply chips
  const latestDealMsg = kind === "d" ? ([...(ch.messages ?? [])].reverse().find((m) => m.messageType === DEAL_CARD_TYPE) as Message<DealCardContent> | undefined) : undefined;
  const latestDealId = latestDealMsg?.content.dealId;
  useEffect(() => {
    if (!latestDealMsg || !latestDealId) return;
    let alive = true;
    fetch(`/api/deals/${latestDealId}`)
      .then((r) => r.json())
      .then((j) => alive && !j.missing && !j.error && setActiveDeal({ msg: latestDealMsg, view: j }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [latestDealId, latestDealMsg, ch.metaTick]);

  async function quickCounter(price: number) {
    return dealAction("counter", price);
  }

  /** Runs a deal action from outside the card (quick replies, smart price chips) and syncs the card. */
  async function dealAction(action: "counter" | "accept", price?: number) {
    if (!activeDeal) return;
    setSending(true);
    try {
      const r = await fetch(`/api/deals/${activeDeal.view.deal.id}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, price }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Couldn't send the offer.");
      await activeDeal.msg.setMetadata(dealMetadata(j.deal)); // in-place update for both people
      window.dispatchEvent(new CustomEvent("pactly:deal-refresh", { detail: j.deal.id }));
      setActiveDeal({ msg: activeDeal.msg, view: j });
      await postEvent(`${me.full_name.split(" ")[0]} ${j.event}`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Couldn't send the offer.", "danger");
    } finally {
      setSending(false);
    }
  }

  async function quickText(t: string) {
    setSending(true);
    try {
      stick.current = true;
      await ch.sendText(t);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Not sent", "danger");
    } finally {
      setSending(false);
    }
  }

  /** Smart price chip: send what the person typed, and put that price on the Deal Card in the same tap. */
  async function sendWithDeal(action: "counter" | "accept", price: number) {
    const t = text.trim();
    if (t) {
      setSending(true);
      try {
        stick.current = true;
        await ch.sendText(t);
        setText("");
      } catch (err) {
        setSending(false);
        return flash(err instanceof Error ? err.message : "Not sent", "danger");
      }
      setSending(false);
    }
    await dealAction(action, action === "counter" ? price : undefined);
  }

  /** Sends a Pactly custom message (meetup, receipt) and shows it immediately. */
  const postCustom = useCallback(
    async <T extends object>(type: string, content: T, metadata?: Record<string, string>, push?: string) => {
      const msg = await sendCustom({ kind: kind === "d" ? "direct" : "group", id: targetId }, type, content, metadata, push);
      stick.current = true;
      ch.merge([msg]);
    },
    [ch, kind, targetId],
  );

  const postReceipt = useCallback(
    (r: ReceiptContent) => {
      postCustom(RECEIPT_TYPE, r, undefined, `🧾 Sealed receipt: ${r.title}`).catch(() => flash("The deal is done, but posting the receipt failed.", "danger"));
    },
    [postCustom, flash],
  );

  async function proposeMeetup(spot: string, at: number) {
    try {
      await postCustom<MeetupContent>(MEETUP_TYPE, { spot, at, dealId: activeDeal?.view.deal.id }, meetupMetadata(spot, at, "proposed", myNx), `📍 Meetup: ${spot}, ${meetupWhen(at)}`);
      setMeetupOpen(false);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Couldn't send the meetup", "danger");
    }
  }

  const postEvent = useCallback(
    async (t: string) => {
      const msg = await sendDealEvent({ kind: kind === "d" ? "direct" : "group", id: targetId }, { text: t, kind: kind === "d" ? "deal" : "ride" });
      if (msg) ch.merge([msg]);
    },
    [ch, kind, targetId],
  );

  async function completeRide() {
    if (!ride) return;
    const r = await fetch(`/api/rides/${ride.post.id}/complete`, { method: "POST" });
    const j = await r.json();
    if (!r.ok) return flash(j.error || "Could not complete ride", "danger");
    setRide(j);
    // Tell riders (their pinned card refetches on this event), then freeze the group.
    await postEvent("🏁 Ride completed. This room is now archived.");
    const f = await fetch(`/api/rides/${ride.post.id}/complete?step=freeze`, { method: "POST" });
    if (!f.ok) flash("Ride completed, but archiving the room failed. Try again.", "danger");
    else flash("Ride completed 🎉", "success");
  }

  async function submitReport(reason: string, note: string) {
    const target = reportFor!;
    let list = ch.messages ?? [];
    let idx = list.findIndex((m) => msgKey(m) === msgKey(target));
    // Make sure 10 earlier messages are loaded for context
    for (let i = 0; i < 3 && idx < 10 && ch.hasMore; i++) {
      const older = await ch.loadOlder();
      if (!older.length) break;
      list = [...older, ...list].filter((m, j, arr) => arr.findIndex((x) => msgKey(x) === msgKey(m)) === j).sort((a, b) => a.sentTime - b.sentTime);
      idx = list.findIndex((m) => msgKey(m) === msgKey(target));
    }
    const slice = list.slice(Math.max(0, idx - 10), idx + 11);
    const evidence = slice.map((m) => ({
      id: m.messageId,
      from: m.senderUserId,
      fromName: m.senderUserId === myNx ? me.full_name : people[m.senderUserId]?.full_name ?? m.senderUserId,
      type: m.messageType,
      text: summarize(m),
      at: m.sentTime,
    }));
    const r = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportedNexconnId: target.senderUserId,
        reason,
        note,
        messageId: target.messageId,
        channelKey: channelKeyOf(target.channelIdentifier),
        evidence,
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Could not send report.");
    return j.evidenceCount as number;
  }

  async function toggleBlock() {
    if (!other) return;
    if (!blocked && !confirm(`Block ${other.full_name}? They won't be able to message you.`)) return;
    const r = await fetch("/api/blocks", { method: blocked ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetNexconnId: other.nexconn_user_id }) });
    const j = await r.json();
    if (!r.ok) return flash(j.error || "Failed", "danger");
    setBlocked(j.blocked);
    setHeaderMenu(false);
    flash(j.blocked ? `${other.full_name.split(" ")[0]} is blocked` : "Unblocked", j.blocked ? "danger" : "success");
  }

  const archived = !!ride?.archived;

  // Meetup reminder: the next confirmed meetup in this chat, pinned under the header.
  const nextMeetup = (ch.messages ?? [])
    .filter((m) => m.messageType === MEETUP_TYPE)
    .map((m) => meetupState(m as Message<MeetupContent>))
    .filter((x) => x.status === "accepted" && x.at - now > -30 * 60_000 && x.at - now < 24 * 3_600_000)
    .sort((a, b) => a.at - b.at)[0];

  // "The chat understands deals": a price typed in the composer, or in their latest message.
  const dealNow = activeDeal?.view.deal;
  const dealActs = dealNow ? allowedActions(dealNow, me.id) : [];
  const priceChip = (t: string) => {
    if (!dealNow || !(dealNow.status === "offer" || dealNow.status === "counter")) return null;
    const hit = detectPrice(t, dealNow.price);
    if (!hit) return null;
    if (hit.kind === "counter" && dealActs.includes("counter")) return hit;
    if (hit.kind === "accept" && dealActs.includes("accept")) return hit;
    return null;
  };
  const typedHit = text.trim() ? priceChip(text) : null;
  const lastTheirsText = kind === "d" ? [...(ch.messages ?? [])].reverse().find((m) => m.messageType !== DEAL_EVENT_TYPE) : undefined;
  const theirHit = lastTheirsText && lastTheirsText.senderUserId !== myNx && lastTheirsText.messageType === "RC:TxtMsg" ? priceChip((lastTheirsText.content as { text: string }).text) : null;
  const lastMine = [...(ch.messages ?? [])].reverse().find((m) => m.senderUserId === myNx && m.messageType === "RC:TxtMsg");
  const title = kind === "d" ? other?.full_name : ride ? `${ride.post.details.pickup} → ${ride.post.details.destination}` : "Ride Room";

  return (
    <div className="page-enter fixed inset-0 z-40 mx-auto flex max-w-md flex-col bg-bg sm:border-x sm:border-line sm:shadow-md">
      <header className="flex items-center gap-2 border-b border-line bg-surface/95 px-2 py-2 backdrop-blur-md">
        <button onClick={() => (history.length > 1 ? router.back() : router.push("/messages"))} className="rounded-full p-2 text-ink transition hover:bg-bg" aria-label="Back"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg></button>
        {kind === "d" && other ? (
          <Link href={`/u/${other.id}`} className="flex min-w-0 flex-1 items-center gap-2">
            <Avatar name={other.full_name} url={other.avatar_url} size={36} id={other.id} />
            <span className="min-w-0">
              <span className="block truncate font-semibold leading-tight" data-testid="chat-title">{title}</span>
              <span className="flex items-center gap-1.5">
                <RatingChip avg={other.rating_avg} count={other.rating_count} />
                <TrustBadge profile={other} compact />
              </span>
            </span>
          </Link>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate font-semibold" data-testid="chat-title">{ride ? <Icon name="car" className="h-4 w-4 text-success-ink" /> : null}{title ?? <span className="skeleton inline-block h-4 w-32" />}</p>
            {ride ? <p className="text-xs text-muted">Ride Room · {ride.passengers.length + 1} people</p> : null}
          </div>
        )}
        <span className={`h-2 w-2 rounded-full ${chat.status === "connected" ? "bg-success" : "bg-warning"}`} title={chat.status} />
        <button className="rounded-full p-2 text-muted transition hover:bg-bg hover:text-ink" aria-label="Chat options" onClick={() => setHeaderMenu(true)} data-testid="chat-menu"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg></button>
      </header>

      {ride ? <RideRoomCard m={ride} onComplete={completeRide} /> : null}
      {nextMeetup ? (
        <div className={`flex items-center gap-2 border-b border-line px-3 py-2 text-xs ${nextMeetup.at - now <= 15 * 60_000 ? "bg-warning-soft text-warning-ink" : "bg-success-soft text-success-ink"}`} data-testid="meetup-strip">
          <Icon name="pin" className="h-3.5 w-3.5" />
          <span className="min-w-0 flex-1 truncate">
            <b>{nextMeetup.spot}</b> · {meetupWhen(nextMeetup.at, now)}
          </span>
          <span className="shrink-0 font-semibold">{countdown(nextMeetup.at, now)}</span>
        </div>
      ) : null}
      {headerError ? <p className="bg-danger-soft px-4 py-2 text-sm text-danger">{headerError}</p> : null}
      {chat.status === "error" ? <ErrorState message={chat.error ?? "Chat is offline."} onRetry={chat.retry} /> : null}

      <div
        ref={listRef}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-3"
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        data-testid="message-list"
      >
        {ch.messages === null ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted">
            <Spinner /> {chat.status === "connected" ? "Loading messages…" : "Connecting to chat…"}
          </div>
        ) : (
          <>
            {ch.hasMore && ch.messages.length >= 30 ? (
              <button className="mx-auto block rounded-full bg-surface px-3 py-1 text-xs text-muted ring-1 ring-line" onClick={() => { stick.current = false; ch.loadOlder(); }} disabled={ch.loadingMore}>
                {ch.loadingMore ? "Loading…" : "Load earlier messages"}
              </button>
            ) : null}
            {ch.messages.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Icon name="wave" className="h-6 w-6" /></span>
                <p className="mt-2">{kind === "d" ? "Say hi! Keep the whole deal in this chat. It's your evidence if anything goes wrong." : "Welcome to the Ride Room. Coordinate pickup here."}</p>
              </div>
            ) : null}
            {ch.messages.map((m) => (
              <MessageRow
                key={msgKey(m)}
                m={m}
                mine={m.senderUserId === myNx}
                showSender={kind === "g"}
                sender={people[m.senderUserId]}
                metaTick={ch.metaTick}
                read={ch.readIds.has(m.messageId)}
                isLastMine={kind === "d" && lastMine?.messageId === m.messageId}
                onMenu={() => setMenuFor(m)}
                onReport={() => setReportFor(m)}
                onEvent={postEvent}
                myNx={myNx}
                otherFirst={other?.full_name.split(" ")[0] ?? "They"}
                onReceipt={postReceipt}
                dealHint={
                  theirHit && lastTheirsText?.messageId === m.messageId
                    ? {
                        label: theirHit.kind === "accept" ? `Accept ₹${theirHit.price.toLocaleString("en-IN")} on the Deal Card` : `Put ₹${theirHit.price.toLocaleString("en-IN")} on the Deal Card`,
                        run: () => dealAction(theirHit.kind, theirHit.price),
                        disabled: sending,
                      }
                    : undefined
                }
                translation={translations[m.messageId]}
                canTranslate={chat.translationAvailable !== false}
                onTranslate={() => translateMsg(m)}
              />
            ))}
          </>
        )}
      </div>

      {blocked ? (
        <div className="border-t border-line bg-surface p-3 text-center text-sm text-muted">
          You blocked {other?.full_name.split(" ")[0]}. <button className="font-semibold text-primary underline" onClick={toggleBlock}>Unblock</button>
        </div>
      ) : archived ? (
        <div className="border-t border-line bg-surface p-3 text-center text-sm text-muted"><Icon name="archive" className="mr-1.5 h-4 w-4" />This Ride Room is archived.</div>
      ) : (
        <>
        {typedHit ? (
          <div className="border-t border-line bg-surface px-2 pt-2">
            <button
              type="button"
              disabled={sending || chat.status !== "connected"}
              onClick={() => sendWithDeal(typedHit.kind, typedHit.price)}
              className="w-full rounded-[14px] border border-primary/40 bg-primary-soft px-3 py-2 text-left text-sm font-semibold text-primary transition active:scale-[0.985] disabled:opacity-50"
              data-testid="smart-price"
            >
              {typedHit.kind === "accept"
                ? `Send & accept ₹${typedHit.price.toLocaleString("en-IN")} on the Deal Card`
                : `Send & make ₹${typedHit.price.toLocaleString("en-IN")} a counter-offer`}
              <span className="block text-[11px] font-normal text-primary/80">Pactly spotted a price in your message. Or just press send to keep it as chat.</span>
            </button>
          </div>
        ) : null}
        {ch.messages !== null && !text ? (
          <QuickReplies
            kind={kind}
            deal={activeDeal?.view ?? null}
            meId={me.id}
            disabled={sending || chat.status !== "connected"}
            onText={quickText}
            onCounter={quickCounter}
          />
        ) : null}
        <form onSubmit={send} className="flex items-end gap-2 border-t border-line bg-surface p-2 pb-safe">
          <button type="button" className="rounded-full p-2.5 text-muted transition hover:bg-bg hover:text-ink" aria-label="Send a photo" onClick={() => fileRef.current?.click()} disabled={sending || chat.status !== "connected"}>
            <Icon name="clip" className="h-5 w-5" />
          </button>
          {kind === "d" ? (
            <button type="button" className="-ml-1.5 rounded-full p-2.5 text-muted transition hover:bg-bg hover:text-ink" aria-label="Propose a meetup" onClick={() => setMeetupOpen(true)} disabled={sending || chat.status !== "connected"} data-testid="meetup-btn">
              <Icon name="pin" className="h-5 w-5" />
            </button>
          ) : null}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => sendImage(e.target.files?.[0])} data-testid="image-input" />
          <textarea
            rows={1}
            className="input max-h-28 flex-1 resize-none !rounded-2xl !py-2.5"
            placeholder={chat.status === "connected" ? "Message" : "Connecting…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            aria-label="Message"
            data-testid="composer"
          />
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white transition hover:bg-primary-hover active:scale-95 disabled:opacity-40" style={{ boxShadow: "var(--shadow-glow)" }} disabled={!text.trim() || sending || chat.status !== "connected"} aria-label="Send" data-testid="send">
            {sending ? <Spinner className="h-4 w-4 text-white" /> : <Icon name="send" className="h-5 w-5" />}
          </button>
        </form>
        </>
      )}

      <Sheet open={!!menuFor} onClose={() => setMenuFor(null)} title="Message">
        <div className="grid gap-2">
          {menuFor?.messageType === "RC:TxtMsg" ? (
            <button className="btn btn-ghost justify-start" onClick={() => { navigator.clipboard?.writeText(summarize(menuFor)).catch(() => {}); setMenuFor(null); flash("Copied"); }}><Icon name="copy" /> Copy text</button>
          ) : null}
          {menuFor && menuFor.senderUserId !== myNx ? (
            <button className="btn btn-danger justify-start" onClick={() => { setReportFor(menuFor); setMenuFor(null); }} data-testid="menu-report"><Icon name="flag" /> Report message</button>
          ) : (
            <p className="text-sm text-muted">You can report messages that other people send.</p>
          )}
        </div>
      </Sheet>

      <Sheet open={headerMenu} onClose={() => setHeaderMenu(false)} title="Options">
        <div className="grid gap-2">
          {other ? <Link href={`/u/${other.id}`} className="btn btn-ghost justify-start"><Icon name="user" /> View profile</Link> : null}
          {ride ? <Link href={`/post/${ride.post.id}`} className="btn btn-ghost justify-start"><Icon name="car" /> Ride details</Link> : null}
          {kind === "d" && other ? (
            <button className="btn btn-danger justify-start" onClick={toggleBlock} data-testid="block-toggle">{blocked ? <><Icon name="checkCircle" /> Unblock</> : <><Icon name="ban" /> Block user</>}</button>
          ) : null}
          {chat.translationAvailable !== false ? (
            <div className="rounded-[14px] border border-line p-3">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Icon name="globe" /> Translate messages into</p>
              <div className="flex flex-wrap gap-1.5">
                {LANGS.map(([code, label]) => (
                  <button key={code} onClick={() => pickLang(code)} className="pill !px-3 !py-1" data-active={lang === code} data-testid={`lang-${code}`}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted">Tap “Translate” under any message. Powered by Nexconn built-in translation.</p>
            </div>
          ) : null}
          <p className="px-1 text-xs text-muted">To report something specific, long-press the message or tap its ⋯.</p>
        </div>
      </Sheet>

      <MeetupSheet open={meetupOpen} onClose={() => setMeetupOpen(false)} onSubmit={proposeMeetup} />
      <ReportSheet open={!!reportFor} onClose={() => setReportFor(null)} onSubmit={submitReport} preview={summarize(reportFor)} />
      <Toast text={toast?.text ?? null} tone={toast?.tone} />
    </div>
  );
}

function MessageRow(props: {
  m: Message;
  mine: boolean;
  showSender: boolean;
  sender?: PublicProfile;
  metaTick: number;
  read: boolean;
  isLastMine: boolean;
  onMenu: () => void;
  onReport: () => void;
  onEvent: (t: string) => void;
  translation?: string;
  canTranslate: boolean;
  onTranslate: () => void;
  myNx: string;
  otherFirst: string;
  onReceipt: (r: ReceiptContent) => void;
  dealHint?: { label: string; run: () => void; disabled: boolean };
}) {
  const { m, mine } = props;
  const hits = useScamHits(m, !mine);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (m.messageType === DEAL_EVENT_TYPE) {
    return (
      <p className="mx-auto w-fit max-w-[90%] rounded-full bg-primary-soft px-3 py-1 text-center text-xs font-medium text-primary" data-testid="deal-event">
        {(m.content as DealEventContent).text}
      </p>
    );
  }

  const longPress = {
    onPointerDown: () => {
      press.current = setTimeout(props.onMenu, 450);
    },
    onPointerUp: () => press.current && clearTimeout(press.current),
    onPointerLeave: () => press.current && clearTimeout(press.current),
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      props.onMenu();
    },
  };

  let body: React.ReactNode;
  if (m.messageType === DEAL_CARD_TYPE) {
    body = <DealCard message={m as Message<DealCardContent>} metaTick={props.metaTick} onEvent={props.onEvent} onReceipt={props.onReceipt} />;
  } else if (m.messageType === MEETUP_TYPE) {
    body = <MeetupCard message={m as Message<MeetupContent>} metaTick={props.metaTick} myNx={props.myNx} otherFirst={props.otherFirst} onEvent={props.onEvent} />;
  } else if (m.messageType === RECEIPT_TYPE) {
    body = <ReceiptCard message={m as Message<ReceiptContent>} />;
  } else if (m.messageType === "RC:TxtMsg") {
    body = (
      <div className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md border border-line bg-surface shadow-sm"}`} data-testid="bubble">
        {(m.content as { text: string }).text}
      </div>
    );
  } else if (m.messageType === "RC:ImgMsg") {
    const c = m.content as { remoteUrl?: string; thumbnailBase64?: string };
    const src = c.remoteUrl || (c.thumbnailBase64 ? `data:image/jpeg;base64,${c.thumbnailBase64}` : "");
    body = src ? (
      <a href={c.remoteUrl || src} target="_blank" rel="noreferrer" data-testid="image-bubble">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Shared photo" loading="lazy" decoding="async" className="max-h-64 max-w-[70vw] rounded-2xl border border-line object-cover sm:max-w-[260px]" />
      </a>
    ) : (
      <div className="flex items-center gap-1.5 rounded-2xl bg-surface px-3 py-2 text-sm text-muted"><Icon name="camera" /> Photo</div>
    );
  } else {
    body = <div className="rounded-2xl bg-surface px-3 py-2 text-sm text-muted">Unsupported message</div>;
  }

  return (
    <div className={`group flex flex-col ${mine ? "items-end" : "items-start"}`} data-testid="message-row" data-mid={m.messageId}>
      {props.showSender && !mine ? <span className="mb-0.5 ml-1 text-[11px] font-medium text-muted">{props.sender?.full_name ?? "Member"}</span> : null}
      <div className={`flex max-w-[88%] items-end gap-1 ${mine ? "flex-row-reverse" : ""}`}>
        <div {...longPress} className="select-text">{body}</div>
        <button onClick={props.onMenu} className="mb-1 rounded-full p-0.5 text-muted opacity-40 transition hover:opacity-100" aria-label="Message options" data-testid="msg-menu"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg></button>
      </div>
      <span className="mx-1 mt-0.5 text-[10px] text-muted">
        {clock(m.sentTime)}
        {props.isLastMine ? <span data-testid="receipt"> · {props.read ? "Read ✓✓" : "Sent ✓"}</span> : null}
      </span>
      {m.messageType === "RC:TxtMsg" && !mine ? (
        props.translation ? (
          <p className="mx-1 mt-1 max-w-[80%] rounded-xl bg-primary-soft px-3 py-1.5 text-sm text-primary" data-testid="translation"><Icon name="globe" className="mr-1 h-3.5 w-3.5" />{props.translation}</p>
        ) : props.canTranslate ? (
          <button className="mx-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary" onClick={props.onTranslate} data-testid="translate-btn"><Icon name="globe" className="h-3 w-3" /> Translate</button>
        ) : null
      ) : null}
      {props.dealHint ? (
        <button className="mx-1 mt-1 rounded-full border border-primary bg-primary-soft px-3 py-1 text-xs font-semibold text-primary disabled:opacity-50" disabled={props.dealHint.disabled} onClick={props.dealHint.run} data-testid="smart-price-incoming">
          {props.dealHint.label}
        </button>
      ) : null}
      <ScamBanner hits={hits} onReport={props.onReport} />
    </div>
  );
}


/** One-tap replies. In a deal chat the price chip sends a real counter-offer on the Deal Card. */
function QuickReplies({ kind, deal, meId, disabled, onText, onCounter }: { kind: ChatKind; deal: DealView | null; meId: string; disabled: boolean; onText: (t: string) => void; onCounter: (p: number) => void }) {
  const chips: { label: string; run: () => void; testid?: string; strong?: boolean }[] = [];
  if (kind === "g") {
    for (const t of ["On my way 🚶", "Running 5 min late ⏱️", "Reached pickup ✅"]) chips.push({ label: t.replace(/\s*\p{Extended_Pictographic}\uFE0F?$/u, ""), run: () => onText(t) });
  } else {
    const st = deal?.deal.status;
    if (deal && (st === "offer" || st === "counter") && allowedActions(deal.deal, meId).includes("counter")) {
      const lower = Math.max(0, Math.round((deal.deal.price * 0.9) / 10) * 10);
      if (lower > 0 && lower !== deal.deal.price) chips.push({ label: `Offer ₹${lower.toLocaleString("en-IN")}`, run: () => onCounter(lower), testid: "qr-counter", strong: true });
    }
    if (!st || st === "offer" || st === "counter") chips.push({ label: "Is it still available?", run: () => onText("Hi! Is this still available?") });
    if (st === "agreed" || st === "offer" || st === "counter") chips.push({ label: "Meet at main gate, 5 pm?", run: () => onText("Can we meet at the main gate at 5 pm?") });
    if (st === "in_progress" || st === "agreed") chips.push({ label: "On my way", run: () => onText("On my way 🚶") });
    if (st === "done" || st === "reviewed") chips.push({ label: "Thanks!", run: () => onText("Thanks, great dealing with you! 🙏") });
  }
  if (!chips.length) return null;
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line bg-surface px-2 pt-2" data-testid="quick-replies">
      {chips.map((c) => (
        <button
          key={c.label}
          type="button"
          disabled={disabled}
          onClick={c.run}
          data-testid={c.testid ?? "qr-chip"}
          className="pill disabled:opacity-50" data-active={!!c.strong}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
