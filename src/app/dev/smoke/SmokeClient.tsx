"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { initChat, connectChat, loadChat } from "@/lib/nexconn/client";

type Line = { id: string; from: string; text: string; time: number };

export function SmokeClient() {
  return (
    <Suspense>
      <Smoke />
    </Suspense>
  );
}

function Smoke() {
  const params = useSearchParams();
  const [me, setMe] = useState(params.get("me") || "alice");
  const [to, setTo] = useState(params.get("to") || "bob");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [text, setText] = useState("");
  const started = useRef(false);

  async function connect() {
    if (started.current) return;
    started.current = true;
    setError(null);
    setStatus("getting token…");
    try {
      const r = await fetch("/api/nexconn/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: me, name: me }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "token failed");
      const m = await initChat(j.appKey);
      m.NCEngine.addConnectionStatusHandler(
        "smoke-conn",
        new m.ConnectionStatusHandler({
          onConnectionStatusChanged({ status: s }) {
            setStatus(`connection status ${s}`);
          },
        }),
      );
      m.NCEngine.addMessageHandler(
        "smoke-msg",
        new m.MessageHandler({
          onMessageReceived({ messages }) {
            setLines((prev) => [
              ...prev,
              ...messages.map((x) => ({
                id: x.messageId,
                from: x.senderUserId,
                text: x.messageType === m.MessageType.TEXT ? (x.content as { text: string }).text : `[${x.messageType}]`,
                time: x.sentTime,
              })),
            ]);
          },
        }),
      );
      // Dev-only probe hooks for automated tests
      const w = window as unknown as { __nc: unknown; __received: unknown[]; __metaEvents: unknown[] };
      w.__nc = m;
      w.__received = [];
      w.__metaEvents = [];
      m.NCEngine.addMessageHandler(
        "smoke-probe",
        new m.MessageHandler({
          onMessageReceived({ messages }) {
            w.__received.push(...messages);
          },
          onMessageMetadataUpdated(ev) {
            w.__metaEvents.push(ev);
          },
        }),
      );
      setStatus("connecting…");
      const uid = await connectChat(j.token);
      setStatus(`connected as ${uid}`);
    } catch (e) {
      started.current = false;
      setError(e instanceof Error ? e.message : String(e));
      setStatus("failed");
    }
  }

  async function send() {
    if (!text.trim()) return;
    const m = await loadChat();
    const ch = new m.DirectChannel(to);
    const { code, data } = await ch.sendMessage(new m.SendTextMessageParams({ text }));
    if (code === 0 && data) {
      setLines((prev) => [...prev, { id: data.messageId, from: me, text, time: data.sentTime }]);
      setText("");
    } else {
      setError(`send failed (code ${code})`);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4 font-sans">
      <h1 className="text-xl font-bold">Nexconn smoke test</h1>
      <div className="mt-3 flex gap-2">
        <input className="w-1/2 rounded border p-2" value={me} onChange={(e) => setMe(e.target.value)} placeholder="me" />
        <input className="w-1/2 rounded border p-2" value={to} onChange={(e) => setTo(e.target.value)} placeholder="to" />
      </div>
      <button className="mt-2 w-full rounded bg-indigo-700 p-2 text-white" onClick={connect}>
        Connect
      </button>
      <p className="mt-2 text-sm" data-testid="status">{status}</p>
      {error && <p className="text-sm text-red-600" data-testid="error">{error}</p>}
      <ul className="mt-3 space-y-1" data-testid="log">
        {lines.map((l) => (
          <li key={l.id} className="rounded bg-gray-100 p-2 text-sm">
            <b>{l.from}:</b> {l.text}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded border p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="message"
          data-testid="input"
        />
        <button className="rounded bg-emerald-600 px-4 text-white" onClick={send} data-testid="send">
          Send
        </button>
      </div>
    </main>
  );
}
