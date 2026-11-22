"use client";
import jsQR from "jsqr";
import { isPaymentQrPayload } from "./scamGuard";

/** Decode a QR code from an image source (File, data URL or same-origin URL). Returns payload or null. */
export async function decodeQr(src: File | string): Promise<string | null> {
  try {
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("image load failed"));
      img.src = url;
    });
    const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    if (typeof src !== "string") URL.revokeObjectURL(url);
    return jsQR(data.data, w, h)?.data ?? null;
  } catch {
    return null; // tainted canvas / undecodable: fall back to other signals
  }
}

/** "payment" if the image holds a UPI/pay QR, "qr" for any other QR, null otherwise. */
export async function classifyQr(src: File | string): Promise<"payment" | "qr" | null> {
  const payload = await decodeQr(src);
  if (!payload) return null;
  return isPaymentQrPayload(payload) ? "payment" : "qr";
}
