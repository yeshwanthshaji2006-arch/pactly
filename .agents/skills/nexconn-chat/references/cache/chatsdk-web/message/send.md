# Send a message

Send text, media, and custom messages through the Nexconn Chat SDK.

## Prerequisites[​](#prerequisites "Direct link to Prerequisites")

* The SDK is initialized and connected. See [Quick start](/chatsdk-web.md).
* The user has an active connection (`NCEngine.connect` returned `code === 0`).

## Send a text message[​](#send-a-text-message "Direct link to Send a text message")

TypeScript

```ts
import { DirectChannel, SendTextMessageParams } from '@nexconn/chat';

const channel = new DirectChannel('<target-user-id>');

const params = new SendTextMessageParams({ text: 'Hello!' });
const { code, data } = await channel.sendMessage(params);
if (code === 0) {
  console.log('Message sent:', data);
} else {
  console.log('Send failed. Code:', code);
}

```

## Message types[​](#types "Direct link to Message types")

The SDK provides several built-in message types via the `MessageType` enum:

| Enum value              | Type string       | Description                  |
| ----------------------- | ----------------- | ---------------------------- |
| `MessageType.TEXT`      | `RC:TxtMsg`       | Plain text content           |
| `MessageType.IMAGE`     | `RC:ImgMsg`       | Image file                   |
| `MessageType.HD_VOICE`  | `RC:HQVCMsg`      | High-quality voice recording |
| `MessageType.FILE`      | `RC:FileMsg`      | Generic file attachment      |
| `MessageType.GIF`       | `RC:GIFMsg`       | GIF image                    |
| `MessageType.LOCATION`  | `RC:LBSMsg`       | Geographic coordinates       |
| `MessageType.REFERENCE` | `RC:ReferenceMsg` | Reply to a specific message  |
| `MessageType.COMBINE`   | `RC:CombineV2Msg` | Forwarded message set        |

To reply to another message, see [Reference messages](/chatsdk-web/message/reference-message.md). To add a reaction to an existing message, see [Message reactions](/chatsdk-web/message/message-reactions.md).

## Send a media message[​](#send-a-media-message "Direct link to Send a media message")

Media messages (images, files, voice) are uploaded to the file server first, then sent as a message containing the remote URL. Use the `Helper` factory methods to create the parameter object for each media type.

TypeScript

```ts
import { DirectChannel, Helper } from '@nexconn/chat';

const channel = new DirectChannel('<target-user-id>');

// Use the factory method to build SendImageMessageParams
const result = await Helper.createSendImageMessageParams(file); // file: File object from <input type="file">
if (!result.isOk) {
  console.log('Failed to prepare image params. Code:', result.code);
  return;
}

const params = result.data;
params.onUploadProgress = (progress, msg) => {
  console.log('Upload progress:', progress); // 0–100
};
params.onUploadComplete = (remoteUrl, msg) => {
  console.log('Upload complete:', remoteUrl);
};
params.onUploadError = (code, msg) => {
  console.log('Upload failed. Code:', code);
};

const { code, data } = await channel.sendMediaMessage(params);
if (code === 0) {
  console.log('Media message sent:', data);
}

```

Other media types have corresponding factory methods:

| Message type | Factory method                                |
| ------------ | --------------------------------------------- |
| Image        | `Helper.createSendImageMessageParams(file)`   |
| File         | `Helper.createSendFileMessageParams(file)`    |
| GIF          | `Helper.createSendGIFMessageParams(file)`     |
| HD voice     | `Helper.createSendHDVoiceMessageParams(file)` |

`Helper.createSendHDVoiceMessageParams` reports voice duration in seconds, rounded to the nearest integer.

## Send to different channel types[​](#send-to-different-channel-types "Direct link to Send to different channel types")

TypeScript

```ts
import {
  GroupChannel,
  OpenChannel,
  CommunitySubChannel,
  SendTextMessageParams,
} from '@nexconn/chat';

// Send to a group channel
const groupChannel = new GroupChannel('<group-id>');
await groupChannel.sendMessage(new SendTextMessageParams({ text: 'Hi group!' }));

// Send to an open channel
const openChannel = new OpenChannel('<open-channel-id>');
await openChannel.sendMessage(new SendTextMessageParams({ text: 'Hi open channel!' }));

// Send to a community subchannel
const subChannel = new CommunitySubChannel('<community-id>', '<subchannel-id>');
await subChannel.sendMessage(new SendTextMessageParams({ text: 'Hi community!' }));

```

## Rate limits[​](#rate-limits "Direct link to Rate limits")

The client SDK enforces a client-wide rate limit of **5 messages per second across all channels**. Messages that exceed the limit are rejected.

## Message properties[​](#message-properties "Direct link to Message properties")

Each sent message returns a `Message<T>` object with the following key properties:

| Property       | Type     | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `messageId`    | `string` | Unique message ID assigned by the server |
| `sentTime`     | `number` | Server-assigned timestamp                |
| `messageType`  | `string` | The message type identifier              |
| `senderUserId` | `string` | The sender's user ID                     |

tip

Use `sentTime` (server time) rather than local time for message ordering to ensure consistency across devices.
