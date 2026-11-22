# Send a direct message

Send a direct message from one user to one or more recipients.

* You can send a message to up to 1000 users in a single request.
* By default, the message is not synced to the sender's client and is not stored in the sender's message history. To enable sync, see the `isEchoToSender` parameter.

## Request[​](#request "Direct link to Request")

**POST**: `https://`[Base URL](/platform-chat-api/prepare-to-use-api/base-url.md)`/v4/direct-channel/message/send`

**Rate limit**: 6000 messages per minute. Sending to 1000 users in a single request counts as 1000 messages. See also [known issues](/platform-chat-api/prepare-to-use-api/limits.md#known-issues).

**Authentication**: All server API requests require signature verification. See [API request signing](/platform-chat-api/prepare-to-use-api/auth.md).

## Request body[​](#request-body "Direct link to Request body")

Content type: `application/json`

| Parameter              | Type       | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fromUserId`           | `String`   | Yes      | Sender's user ID. The user must have obtained an access token; otherwise, if the message triggers a push notification, the sender's user info cannot display correctly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `toUserIds`            | `String[]` | Yes      | Recipient user IDs. Up to 1000 users per request.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `messageType`          | `String`   | Yes      | Message type. Accepts a [built-in message type](/platform-chat-api/message/message-about/about-message-types.md) or a custom message type value. Custom message types must not start with `RC:` and must not exceed 32 characters. The custom message type must be registered in the client SDK; otherwise, the SDK cannot parse it.                                                                                                                                                                                                                                                                                                                                                                                       |
| `content`              | `String`   | Yes      | Message content, max 128 KB per message. - **Built-in message types**: Pass the message content JSON object serialized as a JSON string. See [User content message format](/platform-chat-api/message/message-about/objectname.md) for the JSON structure. For example, for a text message: `{"content":"Hello world!"}`.<br />- **Custom message types**: The format is flexible and not limited to JSON.                                                                                                                                                                                                                                                                                                                 |
| `pushContent`          | `String`   | No       | Push notification content displayed when the recipient is offline. - For [user content message types](/platform-chat-api/message/message-about/objectname.md), this field is optional; the server uses a default push notification message.<br />- For [notification and signal message types](/platform-chat-api/message/message-about/about-message-types.md) (except the recall command message), you must provide `pushContent` to trigger push notifications.<br />- For custom message types that need push notifications, `pushContent` is required.<br />- For custom message types that do not need push notifications (e.g., app-level commands), leave `pushContent` empty.                                     |
| `pushData`             | `String`   | No       | Custom data included in the push notification payload. On iOS, accessible as `appData` in the APNs payload (the `rc` field carries basic message info by default). On Android, accessible as `appData`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `isEchoToSender`       | `Number`   | No       | Whether to sync the sent message to the sender's client. `1` to sync, `0` (default) to not sync. Setting this alone may not guarantee delivery to the sender's client. See [How to sync sent messages to the sender's client](/platform-chat-api/message/how-to-sync-to-sender-client.md).                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `count`                | `Number`   | No       | iOS only. Controls the badge count for push notifications. Only effective when `toUserIds` contains a single user ID. Set to `-1` to leave the badge unchanged, or a number up to 9999 to set the badge count.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `verifyBlocklist`      | `Number`   | No       | Whether to filter recipients against the sender's blocklist. `0` (default): do not filter. `1`: filter.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `shouldPersist`        | `Number`   | No       | Whether to store this message in the cloud message history for the recipient. `0`: do not store. `1` (default): store. Direct, group, and system channel cloud retention is enabled by default. This does not affect missed messages — messages for offline users are always stored as missed messages.<br /><br />**Note**: In most cases, client-side storage does not depend on this parameter: 1. Built-in message types: the client SDK uses the storage flag defined by the message type itself.<br />2. Custom message types: the client SDK uses the storage flag set at registration.<br />3. Unregistered custom message types: the client SDK falls back to this parameter value, but cannot parse the message. |
| `contentAvailable`     | `Number`   | No       | iOS only. Enables silent push notifications (iOS 7+). When set to `1`, allows the app to execute code in the background upon receiving a notification. Default: `0` (disabled).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `hasMetadata`          | `Boolean`  | No       | Whether to enable metadata for this message. Default: `false`. When `true`, clients can set metadata on this message after receiving it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `metadata`             | `Object`   | No       | Only effective when `hasMetadata` is `true`. Custom key-value pairs for message metadata. Unlike the `extra` field in the message body, `metadata` values can be modified after sending. See [Message metadata](/platform-chat-api/message/expansion-about.md).<br /><br />**Requirements**: Keys are max 32 characters (letters, digits, `+ = - _`). Values are max 4096 characters. Max 100 KV pairs per request, max 300 KV pairs per message.                                                                                                                                                                                                                                                                          |
| `disablePush`          | `Boolean`  | No       | Whether to suppress push notifications. Default: `false`. When `true`, offline recipients do not receive push notifications.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pushExt`              | `String`   | No       | Push notification configuration (e.g., title). Ignored when `disablePush` is `true`. Provider-specific settings support `HW`, `APNs`, and `FCM`. See **`pushExt` parameters** below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `disableUpdateLastMsg` | `Boolean`  | No       | Whether to prevent updating the last message in the channel. When `false`, the message appears in the channel list. When `true`, the channel list is not updated. Only effective for messages stored on the client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `needReadReceipt`      | `Number`   | No       | Whether to request a read receipt. `1`: request. `0` (default): do not request. Only effective for persisted messages (`shouldPersist` is `1`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### `pushExt` parameters[​](#pushext-parameters "Direct link to pushext-parameters")

The `pushExt` parameter configures push notification properties such as title, template, forced display, and provider-specific channel IDs. Pass as an escaped JSON string.

| Parameter                             | Type     | Required | Description                                                                                                                                                                                                                                                                                                        |
| ------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`                               | `String` | No       | Push notification title, max 50 characters. Defaults to the user name for direct channels or the group name for group channels.                                                                                                                                                                                    |
| `forceShowPushContent`                | `Number` | No       | Override client-side settings to force display of `pushContent` in push notifications. `0` (default): do not force. `1`: force display.                                                                                                                                                                            |
| `pushConfigs`                         | `Array`  | No       | Provider-specific push settings. Supported providers: `HW`, `APNs`, `FCM`.                                                                                                                                                                                                                                         |
| `pushConfigs.HW.channelId`            | `String` | No       | Huawei push notification channel ID. See [Huawei custom notification channels](https://developer.huawei.com/consumer/cn/doc/development/HMSCore-Guides/android-custom-chan-0000001050040122).                                                                                                                      |
| `pushConfigs.HW.importance`           | `String` | No       | Huawei notification priority. Values: `NORMAL` (default), `LOW`.                                                                                                                                                                                                                                                   |
| `pushConfigs.HW.image`                | `String` | No       | Huawei custom large icon URL (HTTPS). Max 512 KB, recommended 40×40 dp with 8 dp corner radius.                                                                                                                                                                                                                    |
| `pushConfigs.HW.category`             | `String` | No       | Huawei message category identifier (uppercase, e.g., `IM`). Requires [self-classification rights](https://developer.huawei.com/consumer/cn/doc/development/HMSCore-Guides/message-classification-0000001149358835#section893184112272). Overrides the console-level Huawei Push category setting for this App Key. |
| `pushConfigs.APNs.thread-id`          | `String` | No       | iOS notification group ID. Notifications with the same `thread-id` are grouped. Groups with more than 5 notifications are collapsed.                                                                                                                                                                               |
| `pushConfigs.APNs.apns-collapse-id`   | `String` | No       | iOS only. Notifications with the same collapse ID are merged into one. Requires iOS 10.0+.                                                                                                                                                                                                                         |
| `pushConfigs.APNs.richMediaUri`       | `String` | No       | iOS only. Custom large icon URL for push notifications. The app must parse `richMediaUri` to display it. Requires iOS 10.0+.                                                                                                                                                                                       |
| `pushConfigs.APNs.interruption-level` | `String` | No       | iOS 15+ only. Values: `passive`, `active` (default), `time-sensitive`, `critical`. See [APNs interruption-level](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification?language=objc).                                              |
| `pushConfigs.FCM.channelId`           | `String` | No       | FCM notification channel ID. The app must create a channel with this ID before receiving notifications. See [Android notification channels](https://developer.android.com/guide/topics/ui/notifiers/notifications#ManageChannels).                                                                                 |
| `pushConfigs.FCM.collapse_key`        | `String` | No       | Android only. Collapse key for grouping messages, so only the last message is delivered when connectivity resumes.                                                                                                                                                                                                 |
| `pushConfigs.FCM.imageUrl`            | `String` | No       | Android only. Custom large icon URL for FCM push. Max 1 MB. Requires FCM configured with certificate and notification message mode in the console.                                                                                                                                                                 |

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

## Request example[​](#request-example "Direct link to Request example")

HTTP

```http
POST /v4/direct-channel/message/send HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Nonce: 14314
Timestamp: 1408710653491
Signature: 45beb7cc7307889a8e711219a47b7cf6a5b000e8
Content-Type: application/json

{
   "fromUserId": "2191",
   "toUserIds": [
      "2193",
      "2192"
   ],
   "messageType": "RC:TxtMsg",
   "content": "{\"content\":\"hello\"}",
   "pushContent": "thisisapush",
   "pushData": "{\"pushData\":\"hello\"}",
   "shouldPersist": 1,
   "isEchoToSender": 0
}

```

## Response[​](#response "Direct link to Response")

The response body contains a JSON object with the following properties:

| Field                            | Type     | Description                                                                                    |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `code`                           | `Number` | Status code. `0` indicates success. See [Server API status codes](/platform-chat-api/code.md). |
| `result`                         | `Object` | Response data object.                                                                          |
| `result.messageIds`              | `Array`  | List of message UIDs.                                                                          |
| `result.messageIds[i].userId`    | `String` | Recipient user ID, corresponding to the `toUserIds` in the request.                            |
| `result.messageIds[i].messageId` | `String` | Unique ID of the message sent to the corresponding recipient.                                  |

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
            "userId": "2193",
            "messageId": "XXXX-JJJJ-KKK-LLLL"
         },
         {
            "userId": "2192",
            "messageId": "XXXX-JJJJ-KKK-LLKL"
         }
      ]
   }
}

```
