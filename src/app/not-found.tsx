import Link from "next/link";
import { Icon } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Icon name="compass" className="h-7 w-7" /></span>
      <h1 className="mt-3 font-display text-2xl font-bold">Not found</h1>
      <p className="mt-1 text-sm text-muted">This post, chat or profile doesn't exist or was removed.</p>
      <Link href="/" className="btn btn-primary mt-5">Back to Pactly</Link>
    </main>
  );
}
