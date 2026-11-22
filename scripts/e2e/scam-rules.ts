import { scanText, isPaymentQrPayload } from "../../src/lib/scamGuard";
const cases: [string, string[]][] = [
  ["Please pay first, then I'll hand over the calculator", ["pay_first"]],
  ["Need 500 advance payment to book it", ["pay_first"]],
  ["Just send me the OTP you got, it's to receive the money", ["otp"]],
  ["Scan this QR to receive your refund", ["scan_to_receive"]],
  ["contact me on WhatsApp 98765 43210", ["off_platform", "phone_number"]],
  ["call me +91 9876543210", ["phone_number"]],
  ["Can we meet at the library at 5?", []],
  ["Price is 2500, final", []],
  ["I'll pay after I see the cycle", []],
  ["My roll number is 21BCE1234", []],
];
let fail = 0;
for (const [t, want] of cases) {
  const got = scanText(t).map((h) => h.id).sort();
  const ok = JSON.stringify(got) === JSON.stringify([...want].sort());
  if (!ok) fail++;
  console.log(ok ? "✓" : "✗", JSON.stringify(t), "→", got.join(",") || "(none)");
}
console.log(isPaymentQrPayload("upi://pay?pa=scam@ybl&pn=X&am=1") ? "✓ upi QR detected" : "✗ upi QR");
console.log(!isPaymentQrPayload("https://pactly.app") ? "✓ normal URL QR not payment" : "✗ url QR");
process.exit(fail ? 1 : 0);
