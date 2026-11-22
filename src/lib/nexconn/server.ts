import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Nexconn Platform Chat API client (server-only).
 * Signing per docs: Signature = SHA1(AppSecret + Nonce + Timestamp), Timestamp in ms.
 * https://docs.nexconn.ai/platform-chat-api/prepare-to-use-api/auth
 */

const PRIMARY_HOST = process.env.NEXCONN_API_HOST || "api.sg-light-api.com";
const BACKUP_HOST = PRIMARY_HOST.replace(/^api\./, "api-b.");

export class NexconnApiError extends Error {
  constructor(message: string, public code?: number, public status?: number) {
    super(message);
  }
}

function credentials() {
  const appKey = process.env.NEXCONN_APP_KEY;
  const appSecret = process.env.NEXCONN_APP_SECRET;
  if (!appKey || !appSecret) {
    throw new NexconnApiError("Nexconn credentials are not configured on the server.");
  }
  return { appKey, appSecret };
}

function signedHeaders() {
  const { appKey, appSecret } = credentials();
  const nonce = randomBytes(8).toString("hex"); // 16 chars, limit is 18
  const timestamp = Date.now().toString();
  const signature = createHash("sha1").update(appSecret + nonce + timestamp).digest("hex");
  return {
    "App-Key": appKey,
    Nonce: nonce,
    Timestamp: timestamp,
    Signature: signature,
    "Content-Type": "application/json",
    "X-Request-ID": randomBytes(16).toString("hex"),
  };
}

async function callOnce(host: string, path: string, body: unknown) {
  const res = await fetch(`https://${host}${path}`, {
    method: "POST",
    headers: signedHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { res, json };
}

/** POST to the Nexconn server API with primary → backup domain failover. */
export async function nexconnPost<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
  let attempt;
  try {
    attempt = await callOnce(PRIMARY_HOST, path, body);
    if (attempt.res.status >= 500) throw new Error("primary 5xx");
  } catch {
    attempt = await callOnce(BACKUP_HOST, path, body);
  }
  const { res, json } = attempt;
  if (res.status === 401) throw new NexconnApiError("Nexconn signature rejected (check App Key/Secret).", 401, 401);
  const code = typeof json.code === "number" ? json.code : -1;
  if (code !== 0 && code !== 200) {
    throw new NexconnApiError(`Nexconn API ${path} failed (code ${code})`, code, res.status);
  }
  return json as T;
}

/** Register (or re-issue) a user and get their access token. */
export async function issueAccessToken(userId: string, name: string, avatarUrl?: string) {
  const json = await nexconnPost<{ result: { userId: string; accessToken: string } }>(
    "/v4/auth/access-token/issue",
    { userId, name: name.slice(0, 64), ...(avatarUrl ? { avatarUrl } : {}) },
  );
  return json.result.accessToken;
}

export function publicAppKey() {
  return credentials().appKey;
}

/** Users must exist in Nexconn before they can be added to groups; issuing a token registers them. */
export async function ensureRegistered(users: { nexconnId: string; name: string }[]) {
  await Promise.all(users.map((u) => issueAccessToken(u.nexconnId, u.name || "Pactly user")));
}

/** Create a group channel (owner joins automatically). */
export async function createGroup(channelId: string, name: string, owner: string, userIds: string[], announcement?: string) {
  return nexconnPost("/v4/group-channel/create", {
    channelId,
    name: name.slice(0, 64),
    owner,
    userIds,
    groupProfile: announcement ? { announcement: announcement.slice(0, 1024) } : undefined,
    permissions: { joinPerm: 3, memInvitePerm: 0, removePerm: 0, profilePerm: 0 },
  });
}

export async function joinGroup(channelId: string, userIds: string[]) {
  return nexconnPost("/v4/group-channel/join", { channelId, userIds });
}

/** Freeze = read-only for everyone. Used to archive a completed Ride Room. */
export async function freezeGroup(channelId: string) {
  return nexconnPost("/v4/group-channel/freeze-list/add", { channelIds: [channelId] });
}

export async function blocklistAdd(userId: string, targetUserIds: string[]) {
  return nexconnPost("/v4/user/blocklist/add", { userId, targetUserIds });
}
export async function blocklistRemove(userId: string, targetUserIds: string[]) {
  return nexconnPost("/v4/user/blocklist/remove", { userId, blockedUserIds: targetUserIds }); // note: remove uses blockedUserIds
}
