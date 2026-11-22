"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BaseChannel, Message } from "@nexconn/chat";
import { loadChat } from "@/lib/nexconn/client";
import { channelKeyOf, useChat } from "./ChatProvider";

export type ChatKind = "d" | "g";

export const msgKey = (m: Message) => m.messageId || `local-${m.clientId}`;

/** Messages, live updates, sending and read receipts for one Nexconn channel. */
export function useChannel(kind: ChatKind, targetId: string) {
  const chat = useChat();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [metaTick, setMetaTick] = useState(0);
  const channelRef = useRef<BaseChannel | null>(null);
  const queryRef = useRef<{ loadNextPage: () => Promise<{ isOk: boolean; code: number; data?: { data: Message[] } }> } | null>(null);
  const keyRef = useRef<string>("");

  const getChannel = useCallback(async () => {
    if (channelRef.current) return channelRef.current;
    const m = await loadChat();
    channelRef.current = kind === "d" ? new m.DirectChannel(targetId) : new m.GroupChannel(targetId);
    keyRef.current = channelKeyOf(channelRef.current.identifier);
    return channelRef.current;
  }, [kind, targetId]);

  const merge = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const map = new Map((prev ?? []).map((x) => [msgKey(x), x]));
      for (const x of incoming) map.set(msgKey(x), x);
      return [...map.values()].sort((a, b) => a.sentTime - b.sentTime);
    });
  }, []);

  /** Mark incoming messages read: clears the unread count and sends read receipts (direct chats). */
  const markRead = useCallback(
    async (list: Message[]) => {
      const ch = await getChannel();
      const m = await loadChat();
      const ids =
        kind === "d"
          ? list.filter((x) => x.direction === m.MessageDirection.RECEIVE && x.needReceipt && !x.sentReceipt && x.messageId).map((x) => x.messageId)
          : [];
      // Send both at once so a quick navigation away doesn't drop the read receipt.
      await Promise.all([
        ch.clearUnreadCount().catch(() => {}),
        ids.length ? ch.sendReadReceiptResponse(ids).catch(() => {}) : null,
      ]);
      chat.refreshUnread();
    },
    [getChannel, kind, chat],
  );

  const loadOlder = useCallback(async () => {
    if (!queryRef.current) return [];
    setLoadingMore(true);
    const r = await queryRef.current.loadNextPage();
    setLoadingMore(false);
    if (!r.isOk) {
      setError(`Could not load messages (code ${r.code}).`);
      return [];
    }
    const page = r.data?.data ?? [];
    if (page.length < 30) setHasMore(false);
    merge(page);
    return page;
  }, [merge]);

  // Initial history load once connected
  useEffect(() => {
    if (chat.status !== "connected") return;
    let cancelled = false;
    (async () => {
      try {
        const m = await loadChat();
        const ch = await getChannel();
        queryRef.current = m.BaseChannel.createMessagesQuery({
          channelIdentifier: ch.identifier,
          startTime: Date.now() + 60_000,
          pageSize: 30,
          isAscending: false,
        }) as unknown as typeof queryRef.current;
        const page = await loadOlder();
        if (cancelled) return;
        setMessages((prev) => prev ?? []);
        markRead(page);
        // Which of my recent messages were already read (direct chats)?
        if (kind === "d") {
          const mine = page.filter((x) => x.direction === m.MessageDirection.SEND && x.needReceipt && x.messageId).map((x) => x.messageId);
          if (mine.length) {
            const info = await ch.getMessageReadReceiptInfo(mine.slice(-20));
            if (info.isOk && info.data) setReadIds(new Set(info.data.filter((i) => i.readCount > 0).map((i) => i.messageId)));
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not open chat.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chat.status, getChannel, loadOlder, markRead, kind]);

  // Live events for this channel
  useEffect(() => {
    return chat.subscribe((e) => {
      const key = keyRef.current;
      if (!key) return;
      if (e.type === "messages" || e.type === "updated") {
        const mine = e.messages.filter((x) => channelKeyOf(x.channelIdentifier) === key);
        if (!mine.length) return;
        merge(mine);
        if (e.type === "messages" && document.visibilityState === "visible") markRead(mine);
      } else if (e.type === "metadata") {
        if (channelKeyOf(e.event.channelIdentifier) !== key) return;
        setMessages((prev) => {
          if (!prev) return prev;
          return prev.map((x) => {
            if (x.messageId !== e.event.messageId) return x;
            for (const [k, v] of Object.entries(e.event.metadata)) x.metadata.set(k, v);
            return x;
          });
        });
        setMetaTick((t) => t + 1);
      } else if (e.type === "receipt") {
        if (e.channelKey !== key) return;
        setReadIds((prev) => new Set([...prev, ...e.messageIds]));
      }
    });
  }, [chat, merge, markRead]);

  const sendText = useCallback(
    async (text: string, metadata?: Record<string, string>) => {
      const m = await loadChat();
      const ch = await getChannel();
      const params = new m.SendTextMessageParams({ text });
      params.needReceipt = kind === "d";
      if (metadata) params.metadata = metadata;
      const r = await ch.sendMessage(params);
      if (!r.isOk || !r.data) throw new Error(sendErrorText(r.code));
      merge([r.data]);
      return r.data;
    },
    [getChannel, kind, merge],
  );

  const sendImage = useCallback(
    async (file: File, metadata?: Record<string, string>) => {
      const m = await loadChat();
      const ch = await getChannel();
      const prepared = await m.Helper.createSendImageMessageParams(file);
      if (!prepared.isOk || !prepared.data) throw new Error("Could not prepare that image.");
      const params = prepared.data;
      params.needReceipt = kind === "d";
      if (metadata) params.metadata = metadata;
      const r = await ch.sendMediaMessage(params);
      if (!r.isOk || !r.data) throw new Error(sendErrorText(r.code));
      merge([r.data]);
      return r.data;
    },
    [getChannel, kind, merge],
  );

  return {
    messages,
    error,
    hasMore,
    loadingMore,
    loadOlder,
    sendText,
    sendImage,
    readIds,
    metaTick,
    merge,
    getChannel,
  };
}

function sendErrorText(code: number) {
  // Codes verified against @nexconn/engine ErrorCode.
  if (code === 405) return "This person isn't accepting messages from you."; // REJECTED_BY_BLACKLIST
  if (code === 22406) return "You're not in this room any more."; // NOT_IN_GROUP
  if (code === 22408) return "This room is archived (read-only)."; // FORBIDDEN_IN_GROUP (frozen)
  if (code === 21501) return "That message was blocked by content moderation."; // SENSITIVE_SHIELD
  if (code === 20604) return "Slow down a little: too many messages."; // SEND_FREQUENCY_TOO_FAST
  return `Message not sent (code ${code}). Check your connection and try again.`;
}
