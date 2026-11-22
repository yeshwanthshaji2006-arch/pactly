# Freeze a group channel

Freeze one or more group channels. When a group channel is frozen, all members are prevented from sending messages via the client SDK.

* The freeze takes effect immediately.
* The freeze persists even if the group channel is dissolved and recreated. To lift the freeze, call [Unfreeze a group channel](/platform-chat-api/group-channel/mute/unban-group.md).

tip

* Members on the [allowed senders list](/platform-chat-api/group-channel/mute/add-to-group-ban-whitelist.md) can still send messages via the client SDK when the channel is frozen.
* Messages sent via the Platform Chat API are not affected by the freeze.

## Request[​](#request "Direct link to Request")

**POST:** `https://`[Base URL](/platform-chat-api/prepare-to-use-api/base-url.md)`/v4/group-channel/freeze-list/add`

**Rate limit:** 100 per second

**Signature:** Required. See [API request signature](/platform-chat-api/prepare-to-use-api/auth.md).

## Request body[​](#request-body "Direct link to Request body")

Content type: `application/json`

| Parameter    | Type    | Required | Description                                      |
| ------------ | ------- | -------- | ------------------------------------------------ |
| `channelIds` | `Array` | Yes      | Group channel IDs to freeze. Max 20 per request. |

## Request example[​](#request-example "Direct link to Request example")

HTTP

```http
POST /v4/group-channel/freeze-list/add HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Nonce: 14314
Timestamp: 1408710653491
Signature: 45beb7cc7307889a8e711219a47b7cf6a5b000e8
Content-Type: application/json

{
   "channelIds": [
      "XklWnVzXm",
      "LklWnVzXq"
   ]
}

```

## Response[​](#response "Direct link to Response")

| Field  | Type     | Description                         |
| ------ | -------- | ----------------------------------- |
| `code` | `Number` | Return code. `0` indicates success. |

## Response example[​](#response-example "Direct link to Response example")

HTTP

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
   "code": 0
}

```
