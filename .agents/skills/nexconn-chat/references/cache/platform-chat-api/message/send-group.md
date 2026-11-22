# Send a group channel message

Send a message to one or more group channels. The sender does not need to be a member of the target group — your app controls send permissions. This API supports:

* **Standard group messages**: Send to up to 3 groups in a single request.
* **Targeted group messages**: Send to specific members within a group. Only one target group is supported for targeted messages.

By default, the message is not synced to the sender's client and is not stored in the sender's message history. To enable sync, see the `isEchoToSender` parameter.

## Request[​](#request "Direct link to Request")

**POST**: `https://`[Base URL](/platform-chat-api/prepare-to-use-api/base-url.md)`/v4/group-channel/message/send`

**Rate limit**: 20 messages per second. Sending to 3 groups counts as 3 messages. See also [known issues](/platform-chat-api/prepare-to-use-api/limits.md#known-issues).

**Authentication**: All server API requests require signature verification. See [API request signing](/platform-chat-api/prepare-to-use-api/auth.md).

## Request body[​](#request-body "Direct link to Request body")

Content type: `application/json`

tip

When sending a targeted group message, only one `toChannelIds` value is supported. The `hasMetadata`, `metadata`, `disablePush`, and `pushExt` fields are not supported for targeted messages.

| Parameter              | Type       | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fromUserId`           | `String`   | Yes      | Sender's user ID. Non-members can send messages to a group via the server API. The user must have obtained an access token; otherwise, push notifications cannot display the sender's user info correctly.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `toChannelIds`         | `String`   | Yes      | Target group channel IDs. Up to 3 groups. For targeted messages, only one group ID is supported.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `toUserIds`            | `String[]` | No       | For targeted group messages: recipient member user IDs. Other group members do not receive the message. Only effective when `toChannelIds` contains a single group ID.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `messageType`          | `String`   | Yes      | Message type. Accepts a [built-in message type](/platform-chat-api/message/message-about/about-message-types.md) or a custom type value. Custom types must not start with `RC:`, must not exceed 32 characters, and must be registered in the client SDK.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `content`              | `String`   | Yes      | Message content. The content body must not exceed 10 KB, except for image (`RC:ImgMsg`), stream (`RC:StreamMsg`), voice (`RC:VcMsg`), video (`RC:SightMsg`), location (`RC:LBSMsg`), combined-forward (`RC:CombineV2Msg` and `RC:CombineMsg`), and reference (`RC:ReferenceMsg`) messages. - **Built-in types**: Pass the JSON content object serialized as a string. See [User content message format](/platform-chat-api/message/message-about/objectname.md).<br />- **Custom types**: The format is flexible and not limited to JSON.                                                                                                                            |
| `pushContent`          | `String`   | No       | Push notification content for offline recipients. - For [user content message types](/platform-chat-api/message/message-about/objectname.md), this is optional — the server uses a default push message.<br />- For notification/signal types (except recall command), `pushContent` is required for push notifications.<br />- For custom types needing push, `pushContent` is required.<br />- For custom types not needing push (e.g., app commands), leave empty.                                                                                                                                                                                                |
| `pushData`             | `String`   | No       | Custom data in the push payload. On iOS: `appData` in the APNs payload. On Android: `appData`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `isEchoToSender`       | `Number`   | No       | Whether to sync the sent message to the sender's client. `1`: sync. `0` (default): do not sync. See [How to sync sent messages to the sender's client](/platform-chat-api/message/how-to-sync-to-sender-client.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `shouldPersist`        | `Number`   | No       | Whether to store this message in the cloud message history. `0`: do not store. `1` (default): store. Direct, group, and system channel cloud retention is enabled by default. Targeted group messages are not stored in server-side history even with this service enabled — enable **Targeted Group cloud retention** in the console if needed. Does not affect missed messages.<br /><br />Client-side storage behavior: 1. Built-in types: determined by the type's storage flag.<br />2. Registered custom types: determined by the registration flag.<br />3. Unregistered custom types: falls back to this parameter, but the client cannot parse the message. |
| `hasMention`           | `Number`   | No       | Whether this is a mention (@) message. Default: `0` (not a mention). Set to `1` and include `mentionedInfo` in the `content` field. See [How to send a mention message](/platform-chat-api/message/message-about/objectname.md#how-to-send-a-mention--message).                                                                                                                                                                                                                                                                                                                                                                                                      |
| `contentAvailable`     | `Number`   | No       | iOS only. Enables silent push (iOS 7+). `1`: enable. `0` (default): disable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `hasMetadata`          | `Boolean`  | No       | Whether to enable metadata for this message. Default: `false`. Only effective when `toChannelIds` contains a single group ID.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `metadata`             | `Object`   | No       | Only effective when `hasMetadata` is `true` and `toChannelIds` contains a single group ID. Custom KV pairs for message metadata. See [Message metadata](/platform-chat-api/message/expansion-about.md). Keys: max 32 characters (letters, digits, `+ = - _`). Values: max 4096 characters. Max 100 KV pairs per request, 300 per message.                                                                                                                                                                                                                                                                                                                            |
| `disablePush`          | `Boolean`  | No       | Whether to suppress push notifications. Default: `false`. Only effective when `toChannelIds` contains a single group ID.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pushExt`              | `String`   | No       | Push notification configuration. Ignored when `disablePush` is `true`. Only effective when `toChannelIds` contains a single group ID. Provider-specific settings support `HW`, `APNs`, and `FCM`. See **`pushExt` parameters** below.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `disableUpdateLastMsg` | `Boolean`  | No       | Whether to prevent updating the last message in the channel. Only effective for messages stored on the client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `needReadReceipt`      | `Number`   | No       | Whether to request a read receipt. `1`: request. `0` (default): do not request. Only effective for persisted messages.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### `pushExt` parameters[​](#pushext-parameters "Direct link to pushext-parameters")

Configure push notification properties. Pass as an escaped JSON string.

| Parameter                             | Type     | Required | Description                                                                                       |
| ------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------- |
| `title`                               | `String` | No       | Push notification title, max 50 characters. Defaults to user name (direct) or group name (group). |
| `forceShowPushContent`                | `Number` | No       | Override client settings to force display of `pushContent`. `0` (default): no. `1`: force.        |
| `pushConfigs`                         | `Array`  | No       | Provider-specific push settings. Supported: `HW`, `APNs`, `FCM`.                                  |
| `pushConfigs.HW.channelId`            | `String` | No       | Huawei notification channel ID.                                                                   |
| `pushConfigs.HW.importance`           | `String` | No       | Huawei priority. `NORMAL` (default) or `LOW`.                                                     |
| `pushConfigs.HW.image`                | `String` | No       | Huawei large icon URL (HTTPS, max 512 KB, recommended 40×40 dp).                                  |
| `pushConfigs.HW.category`             | `String` | No       | Huawei message category (uppercase, e.g., `IM`). Overrides the console setting.                   |
| `pushConfigs.APNs.thread-id`          | `String` | No       | iOS notification group ID.                                                                        |
| `pushConfigs.APNs.apns-collapse-id`   | `String` | No       | iOS collapse ID. iOS 10.0+.                                                                       |
| `pushConfigs.APNs.richMediaUri`       | `String` | No       | iOS large icon URL. iOS 10.0+.                                                                    |
| `pushConfigs.APNs.interruption-level` | `String` | No       | iOS 15+. Values: `passive`, `active`, `time-sensitive`, `critical`.                               |
| `pushConfigs.FCM.channelId`           | `String` | No       | FCM notification channel ID.                                                                      |
| `pushConfigs.FCM.collapse_key`        | `String` | No       | Android FCM collapse key.                                                                         |
| `pushConfigs.FCM.imageUrl`            | `String` | No       | Android FCM large icon URL. Max 1 MB.                                                             |

### `pushExt` example[​](#pushext-example "Direct link to pushext-example")

JSON

```json
{
   "title":"you have a new message.",
   "forceShowPushContent":0,
   "pushConfigs": [
       {
           "HW": {
             "channelId": "hw-123",
             "importance": "NORMAL",
             "image":"https://example.com/image.png"
           }
       },
       {
           "APNs": {
               "thread-id": "123",
               "apns-collapse-id":"123456",
               "richMediaUri":"https://example.com/image.png"
           }
       },
       {
           "FCM": {
            "channelId":"rongcloud_channelid",
            "collapse_key":"1234",
            "imageUrl":"https://example.com/image.png"
            }
       }
   ]
}

```

## Request examples[​](#request-examples "Direct link to Request examples")

### Standard group message[​](#standard-group-message "Direct link to Standard group message")

HTTP

```http
POST /v4/group-channel/message/send HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Timestamp: 1585127132438
Nonce: 14314
Signature: 45beb7cc7307889a8e711219a47b7cf6a5b000e8
Content-Type: application/json

{
    "fromUserId": "0MglYiqxW",
    "toChannelIds": ["d9Uia1h8C"],
    "messageType": "RC:TxtMsg",
    "content": "{\"content\":\"hello\"}",
    "pushContent": "thisisapush",
    "shouldPersist": 1,
    "isEchoToSender": 0
}

```

### Targeted group message[​](#targeted-group-message "Direct link to Targeted group message")

HTTP

```http
POST /v4/group-channel/message/send HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Timestamp: 1585127132438
Nonce: 14314
Signature: 45beb7cc7307889a8e711219a47b7cf6a5b000e8
Content-Type: application/json

{
    "fromUserId": "2191",
    "toChannelIds": ["2193"],
    "toUserIds": ["123", "456"],
    "messageType": "RC:TxtMsg",
    "content": "{\"content\":\"hello\"}",
    "pushContent": "thisisapush",
    "shouldPersist": 1,
    "isEchoToSender": 0,
    "hasMention": 1
}

```

## Response[​](#response "Direct link to Response")

| Field                            | Type     | Description                                                                                    |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `code`                           | `Number` | Status code. `0` indicates success. See [Server API status codes](/platform-chat-api/code.md). |
| `result`                         | `Object` | Response data object.                                                                          |
| `result.messageIds`              | `Array`  | List of message UIDs.                                                                          |
| `result.messageIds[i].channelId` | `String` | Group channel ID, corresponding to `toChannelId` in the request.                               |
| `result.messageIds[i].messageId` | `String` | Unique ID of the message sent to the corresponding group.                                      |

## Response example[​](#response-example "Direct link to Response example")

HTTP

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
   "code": 0,
   "result": {
      "messageIds": [
         {
            "channelId": "2191",
            "messageId": "XXXX-JJJJ-KKK-LLLL"
         }
      ]
   }
}

```
