"use client";
import { InstallApp } from "@/components/InstallApp";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Logo, Icon, Spinner } from "@/components/ui";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const DEV_EMAIL = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_EMAIL_LOGIN === "true";

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

function Login() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(params.get("error") ? "That sign-in link expired. Request a new code." : null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    setBusy("email");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(null);
    if (error)
      return setError(
        /rate|limit/i.test(error.message)
          ? "Login email limit reached. The free email service only allows a few emails per hour. Try again later, or use a demo student below."
          : error.message,
      );
    setStage("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("code");
    const { error } = await supabaseBrowser().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(null);
    if (error) return setError("That code didn't work. Check it, or use the link in the email.");
    router.replace(next);
    router.refresh();
  }

  async function devEmailLogin() {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    setBusy("dev");
    const r = await fetch("/api/auth/dev-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setBusy(null);
      return setError(j.error || "Dev sign-in failed.");
    }
    // Full navigation: /auth/callback is a route handler that sets the session cookie.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/auth/callback?token_hash=${encodeURIComponent(j.tokenHash)}&type=email&next=${encodeURIComponent(next)}`);
  }

  async function demo(handle: string) {
    setError(null);
    setBusy(handle);
    const r = await fetch("/api/auth/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setBusy(null);
      return setError(j.error || "Demo sign-in failed.");
    }
    window.location.assign(next);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-10">
      <div className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary font-display text-2xl font-extrabold text-white" style={{ boxShadow: "var(--shadow-glow)" }}>P</div>
        <h1><Logo className="text-4xl" /></h1>
        <p className="mt-1 text-lg text-muted">Every deal, sealed in chat.</p>
        <ul className="mt-5 space-y-2 text-sm text-ink/80 [&>li]:flex [&>li]:items-start [&>li]:gap-1.5 [&_svg]:mt-0.5 [&_svg]:text-primary">
          <li><Icon name="bolt" className="mr-1 h-[1.05em] w-[1.05em]" />Tasks, Market and Rides from verified students on your campus</li>
          <li><Icon name="handshake" className="mr-1 h-[1.05em] w-[1.05em]" />Negotiate with live Deal Cards right inside the chat</li>
          <li><Icon name="shield" className="mr-1 h-[1.05em] w-[1.05em]" />Scam Guard warns you before you pay</li>
        </ul>
      </div>

      <InstallApp className="mb-4" />
      <div className="card p-5">
        {stage === "email" ? (
          <form onSubmit={sendCode} className="space-y-3">
            <label className="label" htmlFor="email">College or personal email</label>
            <input id="email" className="input" type="email" inputMode="email" autoComplete="email" placeholder="you@college.edu.in" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-primary w-full" disabled={!!busy}>
              {busy === "email" ? <Spinner className="h-4 w-4 text-white" /> : null} Send login code
            </button>
            {DEV_EMAIL ? (
              <button type="button" onClick={devEmailLogin} disabled={!!busy} className="btn btn-ghost w-full text-sm" data-testid="dev-email">
                {busy === "dev" ? <Spinner className="h-4 w-4" /> : <Icon name="flask" />} Local test: sign in without email
              </button>
            ) : null}
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <p className="text-sm text-muted">
              We sent a code and a sign-in link to <b className="text-ink">{email}</b>. Enter the code, or just tap the link in the email.
            </p>
            <label className="label" htmlFor="code">Code from email</label>
            <input id="code" className="input text-center text-2xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
            <button className="btn btn-primary w-full" disabled={!!busy || code.length < 6}>
              {busy === "code" ? <Spinner className="h-4 w-4 text-white" /> : null} Verify & continue
            </button>
            <button type="button" className="w-full text-sm text-muted underline" onClick={() => setStage("email")}>
              Use a different email
            </button>
          </form>
        )}
        {error ? <p className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger" role="alert">{error}</p> : null}
      </div>

      {DEMO ? (
        <div className="mt-6">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted">Demo students</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["aarav", "Aarav", "CSE · 3rd yr"],
              ["priya", "Priya", "ECE · 2nd yr"],
              ["meera", "Meera", "Admin"],
            ].map(([h, n, s]) => (
              <button key={h} onClick={() => demo(h)} disabled={!!busy} className="card flex flex-col items-center p-3 text-sm active:scale-[0.98]" data-testid={`demo-${h}`}>
                {busy === h ? <Spinner /> : <span className="font-semibold">{n}</span>}
                <span className="text-[11px] text-muted">{s}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
