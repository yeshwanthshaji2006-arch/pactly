import type { Deal, DealStatus, PostType } from "./types";

/**
 * Deal state machine, shared by the API (enforcement) and the Deal Card (which buttons to show).
 * Offer → Counter → Agreed → In progress → Done → Review.
 * Roles: the post author is `seller_id`; the person who tapped Accept/Buy/Book is `buyer_id`.
 */

export type DealAction = "accept" | "counter" | "decline" | "cancel" | "start" | "done";

export const STATUS_STEPS: { key: DealStatus; label: string }[] = [
  { key: "offer", label: "Offer" },
  { key: "counter", label: "Counter" },
  { key: "agreed", label: "Agreed" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
  { key: "reviewed", label: "Review" },
];

export const STATUS_LABEL: Record<DealStatus, string> = {
  offer: "Offer",
  counter: "Counter-offer",
  agreed: "Agreed",
  in_progress: "In progress",
  done: "Done",
  reviewed: "Reviewed",
  cancelled: "Cancelled",
};

export function stepIndex(status: DealStatus) {
  const i = STATUS_STEPS.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

/** Who receives the money. In the market the author sells; for tasks and ride requests the author pays. */
export function payeeId(deal: Pick<Deal, "buyer_id" | "seller_id">, postType: PostType) {
  return postType === "market" ? deal.seller_id : deal.buyer_id;
}
export function payerId(deal: Pick<Deal, "buyer_id" | "seller_id">, postType: PostType) {
  return postType === "market" ? deal.buyer_id : deal.seller_id;
}

export function allowedActions(deal: Deal, userId: string): DealAction[] {
  const isParty = userId === deal.buyer_id || userId === deal.seller_id;
  if (!isParty) return [];
  const myTurn = deal.last_actor_id !== userId;
  switch (deal.status) {
    case "offer":
    case "counter":
      return myTurn ? ["accept", "counter", "decline"] : ["cancel"];
    case "agreed":
      return ["start", "cancel"];
    case "in_progress": {
      const mine = userId === deal.buyer_id ? deal.buyer_done : deal.seller_done;
      return mine ? [] : ["done"];
    }
    default:
      return [];
  }
}

export type Transition = { patch: Partial<Deal>; event: string; completed?: boolean };

/** Pure transition: returns the DB patch and a short human event line, or throws. */
export function applyAction(deal: Deal, userId: string, action: DealAction, price?: number): Transition {
  if (!allowedActions(deal, userId).includes(action)) {
    throw new Error(`"${action}" isn't available while the deal is ${STATUS_LABEL[deal.status].toLowerCase()}.`);
  }
  switch (action) {
    case "accept":
      return { patch: { status: "agreed", last_actor_id: userId }, event: `agreed at ₹${deal.price}` };
    case "counter": {
      if (price == null || !Number.isFinite(price) || price < 0 || price > 1_000_000) throw new Error("Enter a valid price.");
      if (Math.round(price) === deal.price) throw new Error("Counter with a different price.");
      return { patch: { status: "counter", price: Math.round(price), last_actor_id: userId }, event: `countered at ₹${Math.round(price)}` };
    }
    case "decline":
      return { patch: { status: "cancelled", last_actor_id: userId }, event: "declined the offer" };
    case "cancel":
      return { patch: { status: "cancelled", last_actor_id: userId }, event: "cancelled the deal" };
    case "start":
      return { patch: { status: "in_progress", last_actor_id: userId }, event: "started the deal" };
    case "done": {
      const isBuyer = userId === deal.buyer_id;
      const buyer_done = isBuyer ? true : deal.buyer_done;
      const seller_done = isBuyer ? deal.seller_done : true;
      const both = buyer_done && seller_done;
      return {
        patch: { buyer_done, seller_done, status: both ? "done" : "in_progress", last_actor_id: userId },
        event: both ? "confirmed. Deal done ✅" : "marked it done, waiting for the other side",
        completed: both,
      };
    }
  }
}

export function ctaLabel(type: PostType, details: { listing?: string; ride_kind?: string }) {
  if (type === "task") return "Accept task";
  if (type === "market") return details.listing === "rent" ? "Rent this" : "Buy";
  return details.ride_kind === "offer" ? "Book a seat" : "Offer a ride";
}

/** Metadata written onto the Nexconn DealCard message so both clients update the card in place. */
export function dealMetadata(deal: Deal): Record<string, string> {
  return {
    status: deal.status,
    price: String(deal.price),
    buyerDone: deal.buyer_done ? "1" : "0",
    sellerDone: deal.seller_done ? "1" : "0",
    actor: deal.last_actor_id ?? "",
    v: String(new Date(deal.updated_at).getTime()),
  };
}
