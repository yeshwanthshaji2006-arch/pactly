"use client";

/**
 * Browser-side Nexconn Chat SDK bootstrap.
 * Order per docs: initialize (once) → register custom messages → add handlers → connect (once).
 * The SDK is imported dynamically so it never runs during server rendering.
 */

type ChatModule = typeof import("@nexconn/chat");

let modPromise: Promise<ChatModule> | null = null;
let initializedKey: string | null = null;
let connectPromise: Promise<string> | null = null;

export const DEAL_CARD_TYPE = "Pactly:DealCard";
export const RIDE_CARD_TYPE = "Pactly:RideCard";
/** Small timeline events ("Priya countered at ₹450") rendered as centered pills; counted as unread. */
export const DEAL_EVENT_TYPE = "Pactly:DealEvent";
/** Meetup proposal (place + time). Accept / suggest-another update it in place via message metadata. */
export const MEETUP_TYPE = "Pactly:Meetup";
/** Sealed Receipt posted when a deal completes: the final terms plus a SHA-256 seal of the deal record. */
export const RECEIPT_TYPE = "Pactly:Receipt";

export function loadChat(): Promise<ChatModule> {
  if (!modPromise) modPromise = import("@nexconn/chat");
  return modPromise;
}

function areaFromEnv(m: ChatModule) {
  const key = (process.env.NEXT_PUBLIC_NEXCONN_AREA || "SG") as keyof typeof m.AreaCode;
  return m.AreaCode[key] ?? m.AreaCode.SG;
}

/** Initialize exactly once per page lifecycle. */
export async function initChat(appKey: string) {
  const m = await loadChat();
  if (initializedKey === appKey) return m;
  if (initializedKey && initializedKey !== appKey) throw new Error("Nexconn already initialized with another App Key");
  m.NCEngine.initialize({
    appKey,
    areaCode: areaFromEnv(m),
    // DEBUG while integrating (NEXT_PUBLIC_NEXCONN_LOG=DEBUG); WARN otherwise. At DEBUG the SDK also
    // attempts a remote log upload that browsers block via CORS, which shows up as console noise.
    logLevel: process.env.NEXT_PUBLIC_NEXCONN_LOG === "DEBUG" ? m.LogLevel.DEBUG : m.LogLevel.WARN,
  });
  m.NCEngine.registerCustomMessages([
    { messageType: DEAL_CARD_TYPE, isPersisted: true, isCounted: true },
    { messageType: RIDE_CARD_TYPE, isPersisted: true, isCounted: true },
    { messageType: DEAL_EVENT_TYPE, isPersisted: true, isCounted: true },
    { messageType: MEETUP_TYPE, isPersisted: true, isCounted: true },
    { messageType: RECEIPT_TYPE, isPersisted: true, isCounted: true },
  ]);
  initializedKey = appKey;
  return m;
}

/** Connect once; the SDK reconnects on its own afterwards. Resolves to the connected userId. */
export function connectChat(token: string): Promise<string> {
  if (!connectPromise) {
    connectPromise = loadChat().then(async (m) => {
      const res = await m.NCEngine.connect({ token });
      if (!res.isOk || !res.data) {
        connectPromise = null;
        throw new Error(`Nexconn connect failed (code ${res.code})`);
      }
      return res.data.userId;
    });
  }
  return connectPromise;
}
