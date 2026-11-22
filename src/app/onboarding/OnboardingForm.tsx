"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon, Spinner } from "@/components/ui";
import type { Campus, Profile } from "@/lib/types";

const YEARS = [1, 2, 3, 4, 5, 6];
const YEAR_TEXT = ["", "1st year", "2nd year", "3rd year", "4th year", "5th year", "Postgrad"];

export function OnboardingForm({ profile, campuses, email }: { profile: Profile; campuses: Campus[]; email: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(profile.onboarded ? 3 : 1);
  const [fullName, setFullName] = useState(profile.full_name);
  const [campusId, setCampusId] = useState(profile.campus_id ?? "");
  const [department, setDepartment] = useState(profile.department ?? "");
  const [year, setYear] = useState<number | null>(profile.year);
  const [invite, setInvite] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(profile.verification_status);

  function next1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError("Enter your full name.");
    if (!campusId) return setError("Pick your campus.");
    if (department.trim().length < 2) return setError("Enter your department.");
    if (!year) return setError("Pick your year.");
    setStep(2);
  }

  function pick(f: File | null) {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Upload a photo of your ID card (JPG or PNG).");
    if (f.size > 6 * 1024 * 1024) return setError("That image is over 6 MB. Try a smaller photo.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!file) return setError("Add a photo of your college ID.");
    setBusy(true);
    setError(null);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${profile.id}/${Date.now()}.${ext}`;
      const up = await supabaseBrowser().storage.from("id-cards").upload(path, file, { contentType: file.type });
      if (up.error) throw new Error(up.error.message);
      const r = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, campusId, department, year, inviteCode: invite, idCardPath: path }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not save.");
      setStatus(j.status);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-8">
      <div className="mb-4 flex items-center justify-between gap-2 text-xs text-muted">
        <span className="truncate">Signed in as <b className="text-ink">{email || "you"}</b></span>
        <button
          className="shrink-0 font-semibold text-primary underline"
          data-testid="onboarding-signout"
          onClick={async () => {
            await supabaseBrowser().auth.signOut();
            router.replace("/login");
            router.refresh();
          }}
        >
          Sign out
        </button>
      </div>
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-line"}`} />
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={next1} className="space-y-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Set up your campus profile</h1>
            <p className="text-sm text-muted">Deals on Pactly happen between verified students.</p>
          </div>
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As on your college ID" />
          </div>
          <div>
            <span className="label">Campus</span>
            <div className="grid gap-2">
              {campuses.map((c) => (
                <button type="button" key={c.id} onClick={() => setCampusId(c.id)} className={`card flex items-center justify-between p-3 text-left ${campusId === c.id ? "!border-primary ring-2 ring-primary-soft" : ""}`}>
                  <span>
                    <span className="block font-semibold">{c.name}</span>
                    <span className="text-xs text-muted">{c.city}</span>
                  </span>
                  {campusId === c.id ? <span className="text-primary">●</span> : null}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="dept">Department</label>
            <input id="dept" className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science" />
          </div>
          <div>
            <span className="label">Year</span>
            <div className="flex flex-wrap gap-2">
              {YEARS.map((y) => (
                <button type="button" key={y} onClick={() => setYear(y)} className={`rounded-full border px-3 py-1.5 text-sm ${year === y ? "border-primary bg-primary text-white" : "border-line bg-surface"}`}>
                  {YEAR_TEXT[y]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="invite">Invite code (optional)</label>
            <input id="invite" className="input" value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="From a friend on Pactly" />
          </div>
          {error ? <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger" role="alert">{error}</p> : null}
          <button className="btn btn-primary w-full">Continue</button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Verify with your college ID</h1>
            <p className="text-sm text-muted">Stored privately and seen only by campus moderators. It's never shown on your profile.</p>
          </div>
          <label className="card flex cursor-pointer flex-col items-center justify-center gap-2 border-dashed p-6 text-center">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="ID preview" className="max-h-56 rounded-xl object-contain" />
            ) : (
              <>
                <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Icon name="idCard" className="h-7 w-7" /></span>
                <span className="font-semibold">Tap to add a photo of your ID</span>
                <span className="text-xs text-muted">JPG or PNG, up to 6 MB</span>
              </>
            )}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} data-testid="id-input" />
          </label>
          <p className="flex items-start gap-2 rounded-xl bg-primary-soft p-3 text-xs text-primary"><Icon name="lock" className="mr-1 h-[1.05em] w-[1.05em]" />Private storage. Only the moderation team can open this image.</p>
          {error ? <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger" role="alert">{error}</p> : null}
          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1" onClick={() => setStep(1)} disabled={busy}>Back</button>
            <button className="btn btn-primary flex-[2]" onClick={submit} disabled={busy || !file}>
              {busy ? <Spinner className="h-4 w-4 text-white" /> : null} Submit for verification
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 pt-6 text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${status === "verified" ? "bg-success-soft text-success-ink" : "bg-warning-soft text-warning-ink"}`}>
            <Icon name={status === "verified" ? "checkCircle" : "hourglass"} className="h-9 w-9" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{status === "verified" ? "You're verified!" : status === "rejected" ? "Verification rejected" : "Verification pending"}</h1>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
              {status === "verified"
                ? "You can post tasks, list items and offer rides on your campus."
                : status === "rejected"
                  ? "A moderator couldn't verify your ID. Upload a clearer photo."
                  : "A campus moderator will review your ID shortly. You can browse in the meantime."}
            </p>
          </div>
          {status === "rejected" ? (
            <button className="btn btn-primary w-full" onClick={() => setStep(2)}>Upload again</button>
          ) : (
            <button className="btn btn-primary w-full" onClick={() => {
                router.replace("/");
                router.refresh();
              }} data-testid="go-feed">Go to Pactly</button>
          )}
        </div>
      )}
    </main>
  );
}
