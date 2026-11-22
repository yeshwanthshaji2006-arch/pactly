import { notFound } from "next/navigation";
import { SmokeClient } from "./SmokeClient";

/** Step-0 two-window Nexconn smoke test. Local development only. */
export default function SmokePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SmokeClient />;
}
