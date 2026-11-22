# Set message metadata

Set metadata (key-value pairs) on a sent message in a direct or group channel. You can set up to 100 KV pairs per request, with a maximum of 300 per message.

By default, metadata operations via the server API are not synced to the operator's client, which may cause inconsistency. Set `isEchoToSender` to `1` if needed.

## Prerequisites[​](#prerequisites "Direct link to Prerequisites")

The original message must have been sent with metadata enabled (`hasMetadata` set to `true`).

## Request[​](#request "Direct link to Request")

**POST**: `https://`[Base URL](/platform-chat-api/prepare-to-use-api/base-url.md)`/v4/channel-type/message/metadata/set`

**Rate limit**: 100 requests per second. Of these, group channel metadata operations are limited to 20 per second. See also [known issues](/platform-chat-api/prepare-to-use-api/limits.md#known-issues).

**Authentication**: All server API requests require signature verification. See [API request signing](/platform-chat-api/prepare-to-use-api/auth.md).

## Request body[​](#request-body "Direct link to Request body")

Content type: `application/json`

| Parameter        | Type     | Required | Description                                                                                                                                                                                                                  |
| ---------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messageId`      | `String` | Yes      | The message ID. For messages sent by the server API, you can get this value from the response. For other messages, get it through webhooks.                                                                                  |
| `userId`         | `String` | Yes      | Operator's user ID — the user setting the metadata.                                                                                                                                                                          |
| `channelType`    | `Number` | Yes      | Channel type. `1` (direct) or `3` (group).                                                                                                                                                                                   |
| `channelId`      | `String` | Yes      | Target ID (user ID or group ID, depending on `channelType`).                                                                                                                                                                 |
| `metadata`       | `Object` | Yes      | Metadata KV pairs (e.g., `{"type":"3"}`). Keys: max 32 characters (letters, digits, `+ = - _`). Values: max 4096 characters. Max 100 KV pairs per request, 300 per message.                                                  |
| `isEchoToSender` | `Number` | No       | Whether to sync the metadata operation message to the operator's client. `1`: sync. `0` (default): do not sync. See [Sync sent messages to the sender's client](/platform-chat-api/message/how-to-sync-to-sender-client.md). |

## Request example[​](#request-example "Direct link to Request example")

HTTP

```http
POST /v4/channel-type/message/metadata/set HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Nonce: 14314
Timestamp: 1408710653491
Signature: 45beb7cc7307889a8e711219a47b7cf6a5b000e8
Content-Type: application/json

{
   "messageId": "BRGM-DEN2-01E4-BN66",
   "userId": "WNYZbMqpH",
   "channelType": 1,
   "channelId": "tjw3zbMrU",
   "metadata": {
      "type": "3"
   },
   "isEchoToSender": 1
}

```

## Response[​](#response "Direct link to Response")

| Field  | Type     | Description                                                                         |
| ------ | -------- | ----------------------------------------------------------------------------------- |
| `code` | `Number` | Status code. `0` indicates success. See [status codes](/platform-chat-api/code.md). |

## Response example[​](#response-example "Direct link to Response example")

HTTP

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
   "code": 0
}

```
