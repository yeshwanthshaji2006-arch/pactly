"use client";

import { InstallApp } from "@/components/InstallApp";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon, Spinner } from "@/components/ui";
import type { Profile } from "@/lib/types";

export function ProfileEditor({ me, upi, invites }: { me: Profile; upi: string; invites: number }) {
  const router = useRouter();
  const [bio, setBio] = useState(me.bio ?? "");
  const [skills, setSkills] = useState<string[]>(me.skills ?? []);
  const [skill, setSkill] = useState("");
  const [upiId, setUpiId] = useState(upi);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);

  async function save() {
    setMsg(null);
    if (upiId && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) return setMsg({ t: "That UPI ID doesn't look right (e.g. name@okaxis).", ok: false });
    setBusy("save");
    const sb = supabaseBrowser();
    const [a, b] = await Promise.all([
      sb.from("profiles").update({ bio: bio.trim() || null, skills }).eq("id", me.id),
      sb.from("profile_private").update({ upi_id: upiId.trim() || null }).eq("user_id", me.id),
    ]);
    setBusy(null);
    if (a.error || b.error) return setMsg({ t: (a.error || b.error)!.message, ok: false });
    setMsg({ t: "Saved ✓", ok: true });
    router.refresh();
  }

  async function avatar(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy("avatar");
    const sb = supabaseBrowser();
    const path = `${me.id}/avatar-${Date.now()}.${(file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "")}`;
    const up = await sb.storage.from("avatars").upload(path, file, { contentType: file.type });
    if (!up.error) await sb.from("profiles").update({ avatar_url: sb.storage.from("avatars").getPublicUrl(path).data.publicUrl }).eq("id", me.id);
    setBusy(null);
    if (up.error) return setMsg({ t: up.error.message, ok: false });
    router.refresh();
  }

  function addSkill() {
    const s = skill.trim().slice(0, 24);
    if (s && !skills.includes(s) && skills.length < 8) setSkills([...skills, s]);
    setSkill("");
  }

  return (
    <div className="space-y-3">
      <div className="card space-y-3 p-4">
        <p className="text-sm font-semibold">Edit profile</p>
        <label className="btn btn-ghost w-full cursor-pointer">
          {busy === "avatar" ? <Spinner className="h-4 w-4" /> : <Icon name="camera" />} Change photo
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => avatar(e.target.files?.[0])} />
        </label>
        <div>
          <label className="label" htmlFor="bio">Bio</label>
          <textarea id="bio" className="input min-h-16 text-sm" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="Hostel, what you're good at, when you're free" />
        </div>
        <div>
          <span className="label">Skills</span>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <button key={s} onClick={() => setSkills(skills.filter((x) => x !== s))} className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">{s} <Icon name="close" className="ml-0.5 h-3 w-3" /></button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input !py-2 text-sm" value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="e.g. Python, Canva, Notes" aria-label="Add a skill" />
            <button className="btn btn-soft !py-2" onClick={addSkill} type="button">Add</button>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="upi">UPI ID (private)</label>
          <input id="upi" className="input text-sm" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@okaxis" />
          <p className="mt-1 text-[11px] text-muted"><Icon name="lock" className="mr-1 h-[1.05em] w-[1.05em]" />Shown only to your deal partner after you both tap Agree.</p>
        </div>
        {msg ? <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.t}</p> : null}
        <button className="btn btn-primary w-full" onClick={save} disabled={busy === "save"}>
          {busy === "save" ? <Spinner className="h-4 w-4 text-white" /> : null} Save
        </button>
      </div>

      <div className="card p-4 text-sm">
        <p className="font-semibold">Invite classmates</p>
        <p className="mt-1 text-muted">Each verified friend who joins with your code adds to your trust score ({Math.min(invites, 3)}/3).</p>
        <p className="mt-2 rounded-xl bg-bg p-3 text-center font-mono text-lg font-bold tracking-widest">{me.invite_code}</p>
      </div>

      <InstallApp />
      {me.role === "admin" ? <Link href="/admin" className="btn btn-soft w-full"><Icon name="shield" className="mr-1 h-[1.05em] w-[1.05em]" />Open moderation dashboard</Link> : null}
      <button
        className="btn btn-ghost w-full"
        onClick={async () => {
          await supabaseBrowser().auth.signOut();
          window.location.replace("/login");
        }}
      >
        Sign out
      </button>
    </div>
  );
}
