"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/components/ProfileProvider";
import { useChat } from "@/components/chat/ChatProvider";
import { Icon, Sheet, Spinner } from "@/components/ui";
import { ctaLabel } from "@/lib/deals";
import { rideGroupId, rupees } from "@/lib/format";
import { directIdentifier, groupIdentifier, sendDealCard, sendDealEvent, tagForPostType } from "@/lib/nexconn/messages";
import { priceSuffix } from "@/components/PostCard";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";
import type { DealView } from "@/lib/dealServer";

export function PostActions({ post, myBooking }: { post: Post; myBooking: { seats: number; fare: number } | null }) {
  const me = useMe();
  const chat = useChat();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seatSheet, setSeatSheet] = useState(false);
  const [seats, setSeats] = useState(1);
  const mine = post.author_id === me.id;
  const d = post.details;
  const isRideOffer = post.type === "ride" && d.ride_kind === "offer";
  const chatReady = chat.status === "connected";

  async function startDeal() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: post.id }) });
      const view = (await r.json()) as DealView & { created: boolean; error?: string };
      if (!r.ok) throw new Error(view.error || "Could not start the deal.");
      const sellerNx = view.seller.nexconn_user_id;
      if (!view.deal.nexconn_message_id) {
        // Post the DealCard custom message into the 1:1 Nexconn chat, then link it to the deal.
        const msg = await sendDealCard(
          sellerNx,
          { dealId: view.deal.id, postId: post.id, postType: post.type, title: post.title, image: post.images[0], originalPrice: post.price, unit: priceSuffix(post) },
          view.deal,
        );
        await fetch(`/api/deals/${view.deal.id}/attach`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: msg.messageId }) });
      }
      chat.tagChannel(await directIdentifier(sellerNx), tagForPostType(post.type)).catch(() => {});
      router.push(`/chat/d/${sellerNx}?deal=${view.deal.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  async function book() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/rides/${post.id}/book`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seats }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Booking failed.");
      const gid = rideGroupId(post.id);
      if (!j.booking.already) {
        await sendDealEvent({ kind: "group", id: gid }, { kind: "ride", text: `${me.full_name.split(" ")[0]} booked ${seats} seat${seats > 1 ? "s" : ""} · ${rupees(j.booking.fare)} fuel share` });
      }
      chat.tagChannel(await groupIdentifier(gid), "rides").catch(() => {});
      router.push(`/chat/g/${gid}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed.");
      setBusy(false);
      setSeatSheet(false);
    }
  }

  async function closePost() {
    if (!confirm("Close this post? It will disappear from the feed.")) return;
    setBusy(true);
    const { error } = await supabaseBrowser().from("posts").update({ status: "closed" }).eq("id", post.id);
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.refresh();
    setBusy(false);
  }

  if (mine) {
    return (
      <div className="space-y-2">
        <p className="rounded-xl bg-primary-soft p-3 text-sm text-primary">This is your post. Deals people start show up in Chats.</p>
        {isRideOffer && d.seats_left! < d.seats_total! ? (
          <button className="btn btn-primary w-full" onClick={() => router.push(`/chat/g/${rideGroupId(post.id)}`)}>Open Ride Room</button>
        ) : null}
        {post.status === "open" ? (
          <button className="btn btn-ghost w-full" onClick={closePost} disabled={busy}>Close post</button>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  if (isRideOffer && myBooking) {
    return (
      <div className="space-y-2">
        <p className="rounded-xl bg-success-soft p-3 text-sm text-success-ink"><Icon name="checkCircle" className="mr-1.5" />You booked {myBooking.seats} seat{myBooking.seats > 1 ? "s" : ""} · {rupees(myBooking.fare)} fuel share</p>
        <button className="btn btn-primary w-full" onClick={() => router.push(`/chat/g/${rideGroupId(post.id)}`)}>Open Ride Room</button>
      </div>
    );
  }

  const closed = !["open", "in_deal"].includes(post.status) || (isRideOffer && (d.seats_left ?? 0) < 1) || d.ride_status === "completed";
  const unverified = me.verification_status !== "verified";

  return (
    <div className="action-bar sticky bottom-[4.5rem] z-20 -mx-4 space-y-2 px-4 pb-3">
      {error ? <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger" role="alert">{error}</p> : null}
      {unverified ? <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning-ink">You can make deals once your college ID is verified.</p> : null}
      <button
        className="btn btn-primary w-full !py-3.5 text-base"
        disabled={busy || closed || unverified || !chatReady}
        onClick={() => (isRideOffer ? setSeatSheet(true) : startDeal())}
        data-testid="cta"
      >
        {busy || !chatReady ? <Spinner className="h-4 w-4 text-white" /> : null}
        {closed ? (isRideOffer ? "Ride full" : "No longer available") : !chatReady ? "Connecting chat…" : `${ctaLabel(post.type, d)} · ${rupees(post.price)}${priceSuffix(post)}`}
      </button>
      <p className="text-center text-[11px] text-muted">Opens a private chat with a live Deal Card. No payment until you both agree.</p>
      <Sheet open={seatSheet} onClose={() => setSeatSheet(false)} title="Book seats">
        <p className="text-sm text-muted">{d.pickup} → {d.destination}</p>
        <div className="my-4 flex gap-2">
          {Array.from({ length: Math.min(d.seats_left ?? 1, 4) }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setSeats(n)} className={`h-12 flex-1 rounded-[14px] border font-semibold transition active:scale-[0.97] ${seats === n ? "border-primary bg-primary text-white" : "border-line bg-surface"}`}>
              {n} seat{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
        <p className="mb-3 text-sm">Your fuel share: <b>{rupees(seats * post.price)}</b>. You'll join the Ride Room group chat with the driver and other riders.</p>
        <button className="btn btn-success w-full !py-3" onClick={book} disabled={busy} data-testid="confirm-book">
          {busy ? <Spinner className="h-4 w-4 text-white" /> : null} Book & join Ride Room
        </button>
      </Sheet>
    </div>
  );
}
