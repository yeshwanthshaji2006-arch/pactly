"use client";

import { usePathname } from "next/navigation";

/** Re-mounts on every navigation, so each page fades and slides in. The chat screen animates itself (it is position: fixed). */
export default function Template({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/chat")) return <>{children}</>;
  return <div className="page-enter">{children}</div>;
}
