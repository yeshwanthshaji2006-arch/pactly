# Clear message history

Clear server-stored message history for a channel. Direct, group, and system channels use cloud retention, which is enabled by default. Open channels require the **Open Channel cloud retention** service.

* **Direct, group, and system channels**: Clear the message history for a specified user (`fromUserId`) before a given timestamp. After clearing, the user can no longer retrieve those messages from the server.
* **Open channels**: Clear the message history for **all** users before a given timestamp. Use with caution.

tip

* Clearing message history does not affect missed message delivery. If the cleared history includes missed messages (not yet received), the client receives them automatically on reconnection.
* Clearing message history does not affect the missed message compensation mechanism ([Message synchronization](https://console.nexconn.ai/agile/im/service/config#Multi%20Devices) is enabled by default). If a user reinstalls the app or switches devices, the compensation mechanism delivers messages from the last 1 calendar day (including today) by default. To also delete compensated missed messages, contact support to enable deletion of compensated missed messages when server history is cleared.

## Request[​](#request "Direct link to Request")

**POST**: `https://`[Base URL](/platform-chat-api/prepare-to-use-api/base-url.md)`/v4/channel/message/history/delete`

**Rate limit**: 100 requests per second.

**Authentication**: All server API requests require signature verification. See [API request signing](/platform-chat-api/prepare-to-use-api/auth.md).

## Request body[​](#request-body "Direct link to Request body")

Content type: `application/json`

| Parameter     | Type     | Required | Description                                                                                                                                                   |
| ------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channelType` | `Number` | Yes      | Channel type. Supported values: `1` (direct), `3` (group), `4` (open channel), `6` (system).                                                                  |
| `fromUserId`  | `String` | Yes      | **Direct, group, system channels**: User ID whose history to clear. **Open channels**: User ID performing the clear operation (clears history for all users). |
| `channelId`   | `String` | Yes      | Target channel ID to clear.                                                                                                                                   |
| `sentAt`      | `String` | No       | Clear all messages sent before this timestamp (in milliseconds). If empty, clears all messages in the channel.                                                |

## Request example[​](#request-example "Direct link to Request example")

HTTP

```http
POST /v4/channel/message/history/delete HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Timestamp: 1408710653491
Nonce: 14314
Signature: 45beb7cc7307889a8e711219a47b7cf6a5b000e8
Content-Type: application/json

{
    "fromUserId": "1",
    "channelId": "8888",
    "channelType": 3,
    "sentAt": "1566281295943"
}

```

## Response[​](#response "Direct link to Response")

| Property | Type     | Description                                                                         |
| -------- | -------- | ----------------------------------------------------------------------------------- |
| `code`   | `Number` | Status code. `0` indicates success. See [status codes](/platform-chat-api/code.md). |

## Response example[​](#response-example "Direct link to Response example")

HTTP

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"code":0}

```
