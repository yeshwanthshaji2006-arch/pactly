"use client";

import type { ChannelIdentifier, Message } from "@nexconn/chat";
import { DEAL_CARD_TYPE, DEAL_EVENT_TYPE, loadChat } from "./client";
import { dealMetadata } from "@/lib/deals";
import type { Deal, PostType } from "@/lib/types";

export type DealCardContent = {
  dealId: string;
  postId: string;
  postType: PostType;
  title: string;
  image?: string;
  originalPrice: number;
  unit?: string; // "/day", "/seat"
};

/** Meetup card. Live fields (spot, time, status, who proposed) are in metadata so both sides edit one card. */
export type MeetupContent = { spot: string; at: number; dealId?: string };
export type MeetupStatus = "proposed" | "accepted" | "cancelled";
export function meetupMetadata(spot: string, at: number, status: MeetupStatus, by: string): Record<string, string> {
  return { spot, at: String(at), status, by, v: String(Date.now()) };
}

export type ReceiptContent = {
  dealId: string;
  postId: string;
  title: string;
  postType: PostType;
  price: number;
  originalPrice: number;
  buyerName: string;
  sellerName: string;
  payerName: string;
  payeeName: string;
  handover: boolean;
  sealedAt: string;
  hash: string;
};

export type DealEventContent = { text: string; dealId?: string; kind?: "deal" | "ride" | "system" };

/** Send the DealCard custom message with metadata so later status/price changes update it in place. */
export async function sendDealCard(targetNexconnId: string, content: DealCardContent, deal: Deal) {
  const m = await loadChat();
  const params = new m.SendMessageParams<DealCardContent>(content, DEAL_CARD_TYPE);
  params.metadata = dealMetadata(deal); // enables message metadata (expansion) on this message
  params.pushConfig = { pushTitle: "New deal on Pactly", pushContent: `${content.title}: offer ₹${deal.price}`, pushData: content.dealId };
  const r = await new m.DirectChannel(targetNexconnId).sendMessage(params);
  if (!r.isOk || !r.data) throw new Error(`Could not send the deal card (code ${r.code}).`);
  return r.data as Message<DealCardContent>;
}

export async function sendDealEvent(identifier: ChannelIdentifier | { kind: "direct" | "group"; id: string }, content: DealEventContent) {
  const m = await loadChat();
  const ch =
    "kind" in identifier
      ? identifier.kind === "direct"
        ? new m.DirectChannel(identifier.id)
        : new m.GroupChannel(identifier.id)
      : identifier.channelType === m.ChannelType.GROUP
        ? new m.GroupChannel(identifier.channelId)
        : new m.DirectChannel(identifier.channelId);
  const r = await ch.sendMessage(new m.SendMessageParams<DealEventContent>(content, DEAL_EVENT_TYPE));
  return r.isOk ? (r.data as Message<DealEventContent>) : null;
}

/** Sends any Pactly custom message into a direct or group chat, optionally with metadata enabled. */
export async function sendCustom<T extends object>(target: { kind: "direct" | "group"; id: string }, type: string, content: T, metadata?: Record<string, string>, push?: string) {
  const m = await loadChat();
  const ch = target.kind === "direct" ? new m.DirectChannel(target.id) : new m.GroupChannel(target.id);
  const params = new m.SendMessageParams<T>(content, type);
  if (metadata) params.metadata = metadata;
  if (push) params.pushConfig = { pushTitle: "Pactly", pushContent: push, pushData: type };
  const r = await ch.sendMessage(params);
  if (!r.isOk || !r.data) throw new Error(`Could not send (code ${r.code}).`);
  return r.data as Message<T>;
}

export async function directIdentifier(id: string) {
  const m = await loadChat();
  return new m.DirectChannel(id).identifier;
}
export async function groupIdentifier(id: string) {
  const m = await loadChat();
  return new m.GroupChannel(id).identifier;
}

export const tagForPostType = (t: PostType) => (t === "task" ? "tasks" : t === "market" ? "market" : "rides") as "tasks" | "market" | "rides";
