"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Message, MessageMetadataUpdatedEvent, ChannelIdentifier } from "@nexconn/chat";
import { connectChat, DEAL_CARD_TYPE, DEAL_EVENT_TYPE, initChat, loadChat } from "@/lib/nexconn/client";

/**
 * Owns the single Nexconn connection for the signed-in user.
 * Order (per Nexconn docs): initialize → register custom messages → add handlers → connect.
 * Screens subscribe to the event bus instead of registering their own SDK handlers.
 */

export type ChatEvent =
  | { type: "messages"; messages: Message[] }
  | { type: "metadata"; event: MessageMetadataUpdatedEvent }
  | { type: "updated"; messages: Message[] }
  | { type: "receipt"; channelKey: string; messageIds: string[] }
  | { type: "translation"; messageId: string; text: string; language: string }
  | { type: "translationFailed"; messageId: string; code: number };

type Status = "idle" | "connecting" | "connected" | "error";

type Ctx = {
  status: Status;
  error: string | null;
  me: string | null; // my Nexconn user id
  totalUnread: number;
  refreshUnread: () => void;
  subscribe: (fn: (e: ChatEvent) => void) => () => void;
  /** Adds a channel to one of the user's Nexconn channel tags (tasks / market / rides). */
  tagChannel: (identifier: ChannelIdentifier, tagId: TagId) => Promise<void>;
  retry: () => void;
  translate: (messageId: string, text: string, language: string) => Promise<boolean>;
  translationAvailable: boolean | null;
};

export type TagId = "tasks" | "market" | "rides";
export const TAGS: { id: TagId; name: string }[] = [
  { id: "tasks", name: "Tasks" },
  { id: "market", name: "Market" },
  { id: "rides", name: "Rides" },
];

const ChatCtx = createContext<Ctx | null>(null);

export function useChat() {
  const c = useContext(ChatCtx);
  if (!c) throw new Error("useChat must be used inside <ChatProvider>");
  return c;
}

export const channelKeyOf = (id: { channelType: number; channelId: string }) => `${id.channelType}:${id.channelId}`;

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const listeners = useRef(new Set<(e: ChatEvent) => void>());
  const started = useRef(false);
  const tagsReady = useRef<Promise<void> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const tagRef = useRef<((id: ChannelIdentifier, tag: TagId) => void) | null>(null);
  const taggedOnce = useRef(new Set<string>());

  const emit = useCallback((e: ChatEvent) => listeners.current.forEach((fn) => fn(e)), []);

  const refreshUnread = useCallback(async () => {
    const m = await loadChat();
    const r = await m.BaseChannel.getTotalUnreadCount();
    if (r.isOk) setTotalUnread(r.data ?? 0);
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // One connection per app lifecycle (Nexconn: connect once). Results are applied even if React
    // re-runs this effect (Strict Mode), because the SDK connection itself is a singleton.
    (async () => {
      setStatus("connecting");
      setError(null);
      try {
        const res = await fetch("/api/nexconn/token", { method: "POST" });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Could not get a chat token.");
        const m = await initChat(j.appKey);

        m.NCEngine.addConnectionStatusHandler(
          "pactly-conn",
          new m.ConnectionStatusHandler({
            onConnectionStatusChanged({ status: s }) {
              if (s === m.ConnectionStatus.CONNECTED) setStatus("connected");
              else if (s === m.ConnectionStatus.CONNECTING) setStatus("connecting");
            },
          }),
        );
        // Nexconn built-in translation: results arrive asynchronously here.
        m.NCEngine.addTranslateHandler(
          "pactly-translate",
          new m.TranslateHandler({
            onTranslationCompleted({ results }) {
              for (const r of results) {
                if (r.code === 0 && r.translateInfo?.translatedText) {
                  emit({ type: "translation", messageId: r.identifier, text: r.translateInfo.translatedText, language: r.translateInfo.targetLanguage });
                } else {
                  console.warn("[pactly] translation result", r.identifier, r.code, r.translateInfo?.status);
                  emit({ type: "translationFailed", messageId: r.identifier, code: r.code });
                }
              }
            },
          }),
        );
        m.NCEngine.addMessageHandler(
          "pactly-msg",
          new m.MessageHandler({
            onMessageReceived({ messages }) {
              emit({ type: "messages", messages });
              refreshUnread();
              // The receiving side tags conversations too, so Messages filters work for both people.
              for (const msg of messages) {
                if (msg.messageType === DEAL_CARD_TYPE) {
                  const t = (msg.content as { postType?: string }).postType;
                  tagRef.current?.(msg.channelIdentifier, t === "task" ? "tasks" : t === "market" ? "market" : "rides");
                } else if (msg.messageType === DEAL_EVENT_TYPE && msg.channelIdentifier.channelType === m.ChannelType.GROUP) {
                  tagRef.current?.(msg.channelIdentifier, "rides");
                }
              }
            },
            onMessageMetadataUpdated(event) {
              emit({ type: "metadata", event });
            },
            onMessagesUpdated({ messages }) {
              emit({ type: "updated", messages });
            },
            onMessageReceiptResponse({ responses }) {
              const byChannel = new Map<string, string[]>();
              for (const r of responses as unknown as { channelIdentifier?: ChannelIdentifier; messageId?: string }[]) {
                if (!r.channelIdentifier || !r.messageId) continue;
                const k = channelKeyOf(r.channelIdentifier);
                byChannel.set(k, [...(byChannel.get(k) ?? []), r.messageId]);
              }
              byChannel.forEach((messageIds, channelKey) => emit({ type: "receipt", channelKey, messageIds }));
            },
            onOfflineMessageSyncCompleted() {
              refreshUnread();
            },
          }),
        );

        const uid = await connectChat(j.token);
        setMe(uid);
        setStatus("connected");
        refreshUnread();
      } catch (e) {
        started.current = false;
        setStatus("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [emit, refreshUnread, attempt]);

  const subscribe = useCallback((fn: (e: ChatEvent) => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  const tagChannel = useCallback(async (identifier: ChannelIdentifier, tagId: TagId) => {
    const m = await loadChat();
    if (!tagsReady.current) {
      tagsReady.current = (async () => {
        const r = await m.Tag.getTags();
        const have = new Set((r.data ?? []).map((t) => t.tagId));
        for (const t of TAGS) if (!have.has(t.id)) await m.Tag.createTag({ tagId: t.id, tagName: t.name });
      })().catch(() => {
        tagsReady.current = null;
      });
    }
    await tagsReady.current;
    const r = await m.Tag.getTags();
    const tag = r.data?.find((t) => t.tagId === tagId);
    if (tag) await tag.addChannels([identifier]);
  }, []);

  useEffect(() => {
    tagRef.current = (id, tag) => {
      const k = `${channelKeyOf(id)}:${tag}`;
      if (taggedOnce.current.has(k)) return;
      taggedOnce.current.add(k);
      tagChannel(id, tag).catch(() => taggedOnce.current.delete(k));
    };
  }, [tagChannel]);

  const [translationAvailable, setTranslationAvailable] = useState<boolean | null>(null);
  /** Ask Nexconn to translate a text message. Returns false if the service is off for this app. */
  const translate = useCallback(async (messageId: string, text: string, language: string) => {
    const m = await loadChat();
    const r = await m.NCEngine.translateModule.translateMessages({ list: [new m.TranslateMessageParam(messageId, "auto", language, text)], force: true });
    if (r.code === 28400) {
      // TRANS_SERVICE_NOT_OPEN: translation isn't enabled in the Nexconn console
      setTranslationAvailable(false);
      return false;
    }
    if (r.isOk) setTranslationAvailable(true);
    return r.isOk;
  }, []);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const value = useMemo(
    () => ({ status, error, me, totalUnread, refreshUnread, subscribe, tagChannel, retry, translate, translationAvailable }),
    [status, error, me, totalUnread, refreshUnread, subscribe, tagChannel, retry, translate, translationAvailable],
  );
  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}
