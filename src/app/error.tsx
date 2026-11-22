"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.warn("[pactly] page error", error.digest ?? error.message);
  }, [error]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Icon name="tool" className="h-7 w-7" /></span>
      <h1 className="mt-3 font-display text-2xl font-bold">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted">Please try again. Your deals and chats are safe.</p>
      <div className="mt-5 flex gap-2">
        <button className="btn btn-primary" onClick={reset}>Try again</button>
        <Link href="/" className="btn btn-ghost">Home</Link>
      </div>
    </main>
  );
}
