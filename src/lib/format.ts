export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function timeAgo(iso: string | number) {
  const t = typeof iso === "number" ? iso : new Date(iso).getTime();
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function clock(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function when(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function initials(name: string) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

export function yearLabel(y: number | null | undefined) {
  if (!y) return "";
  return ["", "1st yr", "2nd yr", "3rd yr", "4th yr", "5th yr", "PG"][y] ?? `${y}th yr`;
}

/** Nexconn user id is the profile uuid without dashes; this reverses it. */
export function uuidFromNexconnId(id: string) {
  if (!/^[0-9a-f]{32}$/i.test(id)) return null;
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}
export const nexconnIdFromUuid = (uuid: string) => uuid.replace(/-/g, "");

export const rideGroupId = (postId: string) => `ride${postId.replace(/-/g, "")}`;
