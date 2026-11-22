/**
 * "The chat understands deals": finds a price in a plain chat message so Pactly can offer to put it
 * on the Deal Card ("2200 last price?" → counter-offer ₹2,200). Runs on the device, no network.
 *
 * Handles ₹ / Rs / rupees / /- , "2.2k", "2 hazaar", Indian digit grouping (2,200 / 1,20,000),
 * Hindi, Tamil, Telugu, Kannada and Bengali digits, and Hinglish/Hindi price words.
 * Ignores phone numbers, times ("5 pm", "5:30"), durations, years, seats, km and percentages,
 * and anything far from the deal's current price.
 */

export type PriceIntent = { price: number; kind: "counter" | "accept" };

const INDIC_ZERO = [0x0966 /* Devanagari */, 0x0be6 /* Tamil */, 0x09e6 /* Bengali */, 0x0c66 /* Telugu */, 0x0ce6 /* Kannada */];

function asciiDigits(s: string) {
  return s.replace(/[०-९௦-௯০-৯౦-౯೦-೯]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const zero = INDIC_ZERO.find((z) => code >= z && code <= z + 9)!;
    return String(code - zero);
  });
}

const CURRENCY_BEFORE = /(₹|rs\.?|inr|rupees?|रु\.?|रुपये|रुपए)\s*$/i;
const CURRENCY_AFTER = /^\s*(\/-|₹|rs\b|rupees?\b|bucks\b|रुपये|रुपए|रु)/i;
const THOUSAND_AFTER = /^\s*(k\b|thousand\b|hazaa?r\b|हज़ार|हजार)/i;
// A number followed by these is a time, duration, count or distance, not a price.
const NOT_PRICE_AFTER = /^\s*(:\d|am\b|pm\b|baje\b|बजे|o'?clock|mins?\b|minutes?\b|hrs?\b|hours?\b|days?\b|din\b|weeks?\b|months?\b|years?\b|yrs?\b|saal\b|km\b|kms\b|kg\b|seats?\b|people\b|persons?\b|%|st\b|nd\b|rd\b|th\b|gb\b|mb\b)/i;
const PRICE_WORDS =
  /\b(price|last|final|offer|give|pay|deal|best|less|lower|max|budget|rate|ok|okay|done|fixed|lagao|lelo|le lo|dedo|de do|dunga|doonga|dungi|chalega|kitna|kar do|kardo|bech|sell|buy|for|at|only|bas)\b|दूंगा|दूँगा|दूंगी|चलेगा|कीमत|दाम|लास्ट|फाइनल|ले लो|दे दो|விலை|ధర|ಬೆಲೆ|দাম/i;

/** Returns the price the message is talking about, or null. `current` is the price on the Deal Card. */
export function detectPrice(raw: string, current: number): PriceIntent | null {
  if (!raw || current <= 0) return null;
  // Phone numbers (10+ digits, with or without spaces/dashes) are never prices.
  const text = asciiDigits(raw).replace(/(\+?\d[\d\s-]{8,}\d)/g, (m) => (m.replace(/\D/g, "").length >= 10 ? " " : m));
  const re = /\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?/g;
  const found: { value: number; currency: boolean }[] = [];
  for (let m; (m = re.exec(text)); ) {
    const before = text.slice(0, m.index);
    const after = text.slice(m.index + m[0].length);
    if (/[:\d\p{L}]$/u.test(before) || /^[a-z]/i.test(after) && !THOUSAND_AFTER.test(after) && !CURRENCY_AFTER.test(after)) continue; // "21BCE", "5:30"
    if (NOT_PRICE_AFTER.test(after)) continue;
    let value = Number(m[0].replace(/,/g, ""));
    if (THOUSAND_AFTER.test(after)) value *= 1000;
    else if (!Number.isInteger(value)) continue; // "2.5" alone is not a rupee price
    value = Math.round(value);
    const currency = CURRENCY_BEFORE.test(before) || CURRENCY_AFTER.test(after);
    // "in 2023", "since 2021", "2022 batch" are years.
    if (!currency && value >= 1990 && value <= 2035 && (/\b(in|since|of|year|from|till|until|batch|model)\s*$/i.test(before) || /^\s*(batch|model)\b/i.test(after))) continue;
    // Plausible for this deal: between 30% and 300% of the current price.
    if (value < 10 || value < current * 0.3 || value > current * 3) continue;
    found.push({ value, currency });
  }
  if (!found.length) return null;
  const pick = found.find((f) => f.currency) ?? found[0];
  const shortMessage = text.trim().split(/\s+/).length <= 4; // "2200?", "2200 ok"
  if (!pick.currency && !PRICE_WORDS.test(text) && !shortMessage) return null;
  return { price: pick.value, kind: pick.value === current ? "accept" : "counter" };
}
