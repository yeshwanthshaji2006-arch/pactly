# Add to blocklist

Add one or more users to a specified user's blocklist. Blocked users cannot send direct messages to the blocking user.

* Blocking is a one-directional operation. For example, if user A blocks user B, B cannot send messages to A. However, A can still send messages to B.
* Server API direct message sending is not restricted by the blocklist by default. To enable blocklist checking, set `verifyBlacklist` to `1` when calling the relevant API.

tip

Maintain a copy of the blocklist data on your app server for business data processing.

## Request method[​](#request-method "Direct link to Request method")

**POST**: `https://`[Base URL](/platform-chat-api/prepare-to-use-api/base-url.md)`/v4/user/blocklist/add`

**Rate limit**: 100 requests per second

**Signature required**: All server API requests require signature verification. See [API request signature](/platform-chat-api/prepare-to-use-api/auth.md).

## Request body[​](#request-body "Direct link to Request body")

The request body is in `application/json` format and supports the following parameters:

| Parameter       | Type       | Required | Description                                               |
| --------------- | ---------- | -------- | --------------------------------------------------------- |
| `userId`        | `String`   | Yes      | The user ID of the blocking user.                         |
| `targetUserIds` | `String[]` | Yes      | User IDs to add to the blocklist. Maximum 20 per request. |

## Request example[​](#request-example "Direct link to Request example")

HTTP

```http
POST /v4/user/blocklist/add HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Nonce: 14314
Timestamp: 1408710653491
Signature: 45beb7cc7307889a8e711219a47b7cf6a5b000e8
Content-Type: application/json

{
   "userId": "jlk456j5",
   "targetUserIds": [
      "jlk454",
      "jlk457"
   ]
}

```

## Response[​](#response "Direct link to Response")

| Field  | Type     | Description                         |
| ------ | -------- | ----------------------------------- |
| `code` | `Number` | Status code. `0` indicates success. |

## Response example[​](#response-example "Direct link to Response example")

HTTP

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
   "code": 0
}

```
