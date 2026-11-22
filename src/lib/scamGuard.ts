/**
 * Scam Guard: pattern rules shared by the client (instant banner for the receiver)
 * and the server (/api/scam/flag re-checks and records hits for moderators).
 */
export type ScamHit = { id: string; title: string; explain: string; severity: "high" | "medium" };

type Rule = ScamHit & { test: (t: string) => boolean };

const RULES: Rule[] = [
  {
    id: "scan_to_receive",
    title: "“Scan to receive” trick",
    explain: "Scanning a QR never receives money. It only sends. No one needs you to scan or approve anything to pay you.",
    severity: "high",
    test: (t) => /\bscan\b.{0,40}\b(receive|get|claim|credit|refund)\b/.test(t) || /\b(approve|accept)\b.{0,30}\b(collect|request)\b.{0,30}\b(receive|get)\b/.test(t),
  },
  {
    id: "otp",
    title: "OTP request",
    explain: "Never share an OTP. Nobody needs your OTP to pay you. Sharing it hands over your UPI or bank access.",
    severity: "high",
    test: (t) => /\b(otp|one[\s-]?time[\s-]?password|verification code|upi pin|mpin)\b/.test(t),
  },
  {
    id: "pay_first",
    title: "Pay-first pressure",
    explain: "Advance-payment scams are common. On Pactly you pay only after the deal is Agreed and you've seen the item or work.",
    severity: "high",
    test: (t) =>
      /\b(pay|send|transfer)\b.{0,20}\b(first|before|upfront|in advance)\b/.test(t) ||
      /\badvance (payment|amount|money)\b/.test(t) ||
      /\b(token|booking|registration|security) (amount|fee|deposit)\b/.test(t),
  },
  {
    id: "off_platform",
    title: "Moving off Pactly",
    explain: "Taking the chat to WhatsApp or Telegram removes your evidence trail and Pactly's protections. Keep the deal here.",
    severity: "medium",
    test: (t) => /\b(whatsapp|whats app|telegram|wa\.me|signal app|dm me on|text me on|call me on)\b/.test(t),
  },
  {
    id: "phone_number",
    title: "Phone number shared",
    explain: "Be careful sharing numbers early. Scammers use them to move you off-platform or send fake payment SMS.",
    severity: "medium",
    test: (t) => /(?:\+?91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/.test(t),
  },
];

export const PAYMENT_QR_HIT: ScamHit = {
  id: "payment_qr",
  title: "Payment QR code",
  explain: "Scanning a QR never receives money. It only sends. If someone says “scan this to get paid”, it's a scam.",
  severity: "high",
};

export function scanText(text: string): ScamHit[] {
  const t = ` ${text.toLowerCase().replace(/\s+/g, " ")} `;
  return RULES.filter((r) => r.test(t)).map(({ id, title, explain, severity }) => ({ id, title, explain, severity }));
}

/** QR payload check (from jsQR on the client). UPI and other pay links count as a payment QR. */
export function isPaymentQrPayload(payload: string) {
  return /^(upi:\/\/|bhim:\/\/|paytmmp:\/\/|phonepe:\/\/|tez:\/\/)/i.test(payload) || /pa=[\w.-]+@[\w]+/i.test(payload);
}

export function ruleById(id: string): ScamHit | undefined {
  if (id === PAYMENT_QR_HIT.id) return PAYMENT_QR_HIT;
  const r = RULES.find((x) => x.id === id);
  return r ? { id: r.id, title: r.title, explain: r.explain, severity: r.severity } : undefined;
}
