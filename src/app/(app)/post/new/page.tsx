"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useMe } from "@/components/ProfileProvider";
import { IconTile, Icon, Spinner, TYPE_META } from "@/components/ui";
import type { PostType } from "@/lib/types";

const CATEGORIES: Record<PostType, string[]> = {
  task: ["Academics", "Errands", "Design", "Tech help", "Other"],
  market: ["Books", "Electronics", "Cycles", "Hostel", "Academics", "Other"],
  ride: ["Station", "Airport", "City", "Home town", "Other"],
};

function hoursFromNow(h: number) {
  return localInput(new Date(Date.now() + h * 3600 * 1000));
}

function localInput(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 16);
}

export default function NewPostPage() {
  return (
    <Suspense>
      <NewPost />
    </Suspense>
  );
}

function NewPost() {
  const params = useSearchParams();
  const t = params.get("type");
  const type: PostType = t === "market" || t === "ride" ? t : "task";
  const me = useMe();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[type][0]);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  // task
  const [mode, setMode] = useState<"on_campus" | "online">("on_campus");
  const [neededBy, setNeededBy] = useState(() => hoursFromNow(24));
  // market
  const [listing, setListing] = useState<"sale" | "rent">("sale");
  const [files, setFiles] = useState<File[]>([]);
  // ride
  const [rideKind, setRideKind] = useState<"offer" | "need">("offer");
  const [vehicle, setVehicle] = useState("");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [departStart, setDepartStart] = useState(() => hoursFromNow(1));
  const [departEnd, setDepartEnd] = useState(() => hoursFromNow(2));
  const [seats, setSeats] = useState(2);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (me.verification_status !== "verified") {
    return (
      <div className="p-6 text-center">
        <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Icon name="hourglass" className="h-7 w-7" /></span>
        <h1 className="mt-2 font-display text-xl font-bold">Verification pending</h1>
        <p className="mt-1 text-sm text-muted">You can post once a moderator verifies your college ID.</p>
        <Link href="/" className="btn btn-primary mt-4">Back to feed</Link>
      </div>
    );
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list).filter((f) => f.type.startsWith("image/") && f.size < 6 * 1024 * 1024)].slice(0, 4);
    setFiles(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = Number(price);
    const rideTitle = `${pickup.trim()} → ${destination.trim()}`;
    const finalTitle = type === "ride" ? (title.trim() || rideTitle) : title.trim();
    if (type === "ride") {
      if (!pickup.trim() || !destination.trim()) return setError("Add pickup and destination.");
      if (new Date(departEnd) <= new Date(departStart)) return setError("The departure window must end after it starts.");
      if (new Date(departStart).getTime() < Date.now() - 5 * 60000) return setError("Departure can't be in the past.");
      if (rideKind === "offer" && !vehicle.trim()) return setError("Tell riders what vehicle you're taking.");
    }
    if (finalTitle.length < 3) return setError("Add a short title.");
    if (finalTitle.length > 90) return setError("Keep the title under 90 characters.");
    if (!Number.isFinite(amount) || amount < 0 || price === "") return setError("Enter an amount in ₹ (0 is fine for free).");
    if (amount > 200000) return setError("That amount looks too high.");
    if (type === "task" && new Date(neededBy).getTime() < Date.now()) return setError("“Needed by” must be in the future.");

    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const images: string[] = [];
      for (const f of files) {
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${me.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const up = await sb.storage.from("post-images").upload(path, f, { contentType: f.type });
        if (up.error) throw new Error(up.error.message);
        images.push(sb.storage.from("post-images").getPublicUrl(path).data.publicUrl);
      }
      const details =
        type === "task"
          ? { mode, needed_by: new Date(neededBy).toISOString() }
          : type === "market"
            ? { listing }
            : {
                ride_kind: rideKind,
                vehicle: vehicle.trim() || "Any",
                pickup: pickup.trim(),
                destination: destination.trim(),
                depart_start: new Date(departStart).toISOString(),
                depart_end: new Date(departEnd).toISOString(),
                seats_total: rideKind === "offer" ? seats : 1,
                seats_left: rideKind === "offer" ? seats : 1,
                ride_status: "scheduled",
              };
      const { data, error } = await sb
        .from("posts")
        .insert({
          author_id: me.id,
          campus_id: me.campus_id,
          type,
          title: finalTitle,
          description: description.trim(),
          category,
          price: Math.round(amount),
          location: (type === "ride" ? pickup : type === "task" && mode === "online" ? "Online" : location).trim() || null,
          images,
          details,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      router.replace(`/post/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the post.");
      setBusy(false);
    }
  }

  const priceLabel = type === "task" ? "Reward (₹)" : type === "market" ? (listing === "rent" ? "Daily rate (₹/day)" : "Price (₹)") : "Fuel share (₹ per seat)";

  return (
    <form onSubmit={submit} className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-full p-2 transition hover:bg-surface" aria-label="Back"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg></button>
        <h1 className="font-display text-xl font-bold">
          <IconTile name={TYPE_META[type].icon} className={`mr-1 h-8 w-8 !rounded-xl ${TYPE_META[type].tile}`} iconClass="h-4 w-4" /> New {type === "task" ? "task" : type === "market" ? "listing" : "ride"}
        </h1>
      </div>

      {type === "market" && (
        <Segmented value={listing} onChange={setListing} options={[["sale", "Sell"], ["rent", "Rent out"]]} />
      )}
      {type === "ride" && (
        <Segmented value={rideKind} onChange={setRideKind} options={[["offer", "Offering seats"], ["need", "Need a ride"]]} />
      )}

      {type !== "ride" ? (
        <Field label="Title">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "task" ? "e.g. Pick up my parcel from the main gate" : "e.g. Casio fx-991ES calculator"} maxLength={90} />
        </Field>
      ) : null}

      {type === "ride" && (
        <>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Pickup"><input className="input" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. VIT main gate" /></Field>
            <Field label="Destination"><input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Katpadi railway station" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Leaving from"><input type="datetime-local" className="input !px-2 text-sm" value={departStart} onChange={(e) => setDepartStart(e.target.value)} /></Field>
            <Field label="Until"><input type="datetime-local" className="input !px-2 text-sm" value={departEnd} onChange={(e) => setDepartEnd(e.target.value)} /></Field>
          </div>
          <Field label={rideKind === "offer" ? "Vehicle" : "Preferred vehicle (optional)"}>
            <input className="input" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g. Car: Swift (white) or Bike: Activa" />
          </Field>
          {rideKind === "offer" && (
            <Field label="Seats available">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button type="button" key={n} onClick={() => setSeats(n)} className={`h-10 w-10 rounded-xl border text-sm font-semibold ${seats === n ? "border-primary bg-primary text-white" : "border-line bg-surface"}`}>{n}</button>
                ))}
              </div>
            </Field>
          )}
        </>
      )}

      {type === "market" && (
        <Field label="Photos (up to 4)">
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt="" loading="lazy" className="h-20 w-20 rounded-xl object-cover" />
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white" aria-label="Remove photo"><Icon name="close" className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {files.length < 4 && (
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line bg-surface text-2xl text-muted">
                +<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
              </label>
            )}
          </div>
        </Field>
      )}

      <Field label={type === "ride" ? "Notes for riders" : type === "task" ? "Details" : "Description"}>
        <textarea className="input min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "task" ? "What exactly needs doing? Anything they should bring?" : type === "market" ? "Condition, age, what's included" : "Luggage space, meeting point, stops"} maxLength={800} />
      </Field>

      <Field label="Category">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES[type].map((c) => (
            <button type="button" key={c} onClick={() => setCategory(c)} className={`rounded-full border px-3 py-1.5 text-sm ${category === c ? "border-ink bg-ink text-white" : "border-line bg-surface"}`}>{c}</button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={priceLabel}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted">₹</span>
            <input className="input !pl-7" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))} placeholder="0" aria-label={priceLabel} />
          </div>
        </Field>
        {type === "task" ? (
          <Field label="Needed by"><input type="datetime-local" className="input !px-2 text-sm" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} /></Field>
        ) : type === "market" ? (
          <Field label="Pickup spot"><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Hostel A" /></Field>
        ) : null}
      </div>

      {type === "task" && (
        <>
          <Segmented value={mode} onChange={setMode} options={[["on_campus", "On campus"], ["online", "Online"]]} />
          {mode === "on_campus" && (
            <Field label="Where"><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Main gate → G-block" /></Field>
          )}
        </>
      )}

      {error ? <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger" role="alert">{error}</p> : null}
      <button className="btn btn-primary w-full !py-3" disabled={busy} data-testid="publish">
        {busy ? <Spinner className="h-4 w-4 text-white" /> : null} Publish
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="grid grid-flow-col rounded-xl border border-line bg-surface p-1">
      {options.map(([v, l]) => (
        <button type="button" key={v} onClick={() => onChange(v)} className={`rounded-lg py-2 text-sm font-semibold ${value === v ? "bg-primary text-white" : "text-muted"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}
