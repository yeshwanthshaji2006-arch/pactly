import { detectPrice } from "../../src/lib/priceIntent";
// [message, current price on the card, expected price or null]
const cases: [string, number, number | null][] = [
  ["2200 last price?", 2800, 2200],
  ["Can you do ₹2,200?", 2800, 2200],
  ["rs 2400 final", 2800, 2400],
  ["2.2k chalega?", 2800, 2200],
  ["2500/- ok?", 2800, 2500],
  ["Bhai 2300 dunga, kal le lunga", 2800, 2300],
  ["मैं २२०० दूंगा", 2800, 2200],
  ["ok 2800 done", 2800, 2800],
  ["Meet at 5 pm at the main gate", 2800, null],
  ["Let's meet 5:30 near library", 2800, null],
  ["Call me 98765 43210", 2800, null],
  ["It is 1 year old, 21 gears", 2800, null],
  ["I have 2 seats left", 80, null],
  ["my roll is 21BCE1234", 2800, null],
  ["I can give 50", 650, null], // far below the price: not a real counter
  ["600 ok?", 650, 600],
  ["Will you take 1,20,000 for the bike?", 125000, 120000],
  ["I bought it in 2023 for college", 2800, null],
];
let fail = 0;
for (const [t, cur, want] of cases) {
  const got = detectPrice(t, cur)?.price ?? null;
  const ok = got === want;
  if (!ok) fail++;
  console.log(ok ? "✓" : "✗", JSON.stringify(t), `(card ₹${cur}) →`, got ?? "none", ok ? "" : `(expected ${want ?? "none"})`);
}
console.log(detectPrice("ok 2800 done", 2800)?.kind === "accept" ? "✓ same price → accept" : (fail++, "✗ accept kind"));
process.exit(fail ? 1 : 0);
