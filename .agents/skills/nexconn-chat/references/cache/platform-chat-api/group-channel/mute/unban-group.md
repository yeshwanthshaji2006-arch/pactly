# Unfreeze a group channel

Unfreeze one or more group channels, restoring all members' ability to send messages.

## Request[​](#request "Direct link to Request")

**POST:** `https://`[Base URL](/platform-chat-api/prepare-to-use-api/base-url.md)`/v4/group-channel/freeze-list/remove`

**Rate limit:** 100 per second

**Signature:** Required. See [API request signature](/platform-chat-api/prepare-to-use-api/auth.md).

## Request body[​](#request-body "Direct link to Request body")

Content type: `application/json`

| Parameter    | Type    | Required | Description                                        |
| ------------ | ------- | -------- | -------------------------------------------------- |
| `channelIds` | `Array` | Yes      | Group channel IDs to unfreeze. Max 20 per request. |

## Request example[​](#request-example "Direct link to Request example")

HTTP

```http
POST /v4/group-channel/freeze-list/remove HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Nonce: 14314
Timestamp: 1408710653491
Signature: 45beb7cc7307889a8e711219a47b7cf6a5b000e8
Content-Type: application/json

{
   "channelIds": [
      "L6c85orxt",
      "X6c95orxt"
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
