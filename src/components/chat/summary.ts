import type { Message } from "@nexconn/chat";
import { DEAL_CARD_TYPE, DEAL_EVENT_TYPE, MEETUP_TYPE, RECEIPT_TYPE } from "@/lib/nexconn/client";

/** One-line text for a message (conversation list, report evidence). */
export function summarize(m: Pick<Message, "messageType" | "content"> | null | undefined): string {
  if (!m) return "";
  const c = m.content as Record<string, unknown>;
  switch (m.messageType) {
    case "RC:TxtMsg":
      return String(c.text ?? "");
    case "RC:ImgMsg":
      return "📷 Photo";
    case DEAL_CARD_TYPE:
      return `🤝 Deal: ${String(c.title ?? "")}`;
    case DEAL_EVENT_TYPE:
      return String(c.text ?? "");
    case MEETUP_TYPE:
      return `📍 Meetup: ${String((m as { metadata?: Map<string, string> }).metadata?.get?.("spot") ?? c.spot ?? "")}`;
    case RECEIPT_TYPE:
      return `🧾 Sealed receipt: ${String(c.title ?? "")}`;
    default:
      return "Message";
  }
}
