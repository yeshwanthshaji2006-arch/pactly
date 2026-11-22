# Send your first message

This tutorial walks you through the basic integration flow for the Nexconn Chat SDK: importing, initializing, setting up listeners, connecting, and sending messages.

## Prerequisites[​](#prerequisites "Direct link to Prerequisites")

1. Go to the [Console](https://console.nexconn.ai/agile/dashboard/workplace) and register a developer account. After registration, the console automatically creates an app on the **Free** plan, valid for one month with no credit card required.
2. On the [Key Management](https://console.nexconn.ai/agile/apps/km) page, get the application's App Key. The same page also shows the App Secret and data center.

tip

* Each app has one App Key. Use the same App Key throughout development, testing, and release.
* The App Secret is used to generate data signatures and is only required when calling Server APIs. Keep your App Key and App Secret confidential.

## Import the SDK[​](#import "Direct link to Import the SDK")

tip

The Nexconn Chat SDK provides full TypeScript support. We recommend using TypeScript for better code safety and maintainability.

**NPM (recommended)**

1. Install the packages:

   bash

   ```bash
   npm install @nexconn/engine@latest @nexconn/chat@latest -S

   ```

2. Import the modules:

TypeScript

```ts
import {
  NCEngine,
  DirectChannel,
  SendTextMessageParams,
  ConnectionStatusHandler,
  MessageHandler,
} from '@nexconn/chat';

```

## Initialize[​](#init "Direct link to Initialize")

Before using any Chat SDK features, you **must call the initialization method exactly once** during the entire app lifecycle.

The **App Key** is the unique identifier for your app. You need a valid App Key to initialize the SDK. Find your App Key in the [Console](https://console.nexconn.ai/agile/login/vcode).

TypeScript

```ts
import { NCEngine } from '@nexconn/chat';

// Initialize — call this only once
NCEngine.initialize({ appKey: '<Your-App-Key>' });

```

## Set up listeners[​](#listener "Direct link to Set up listeners")

After initialization, add event listeners to receive real-time notifications from the SDK.

TypeScript

```ts
import { NCEngine, ConnectionStatusHandler, MessageHandler } from '@nexconn/chat';

// Connection status listener
NCEngine.addConnectionStatusHandler('my-handler', new ConnectionStatusHandler({
  onConnectionStatusChanged({ status, code }) {
    console.log('Connection status:', status, 'code:', code);
  },
}));

// Message listener
NCEngine.addMessageHandler('my-handler', new MessageHandler({
  onMessageReceived({ messages }) {
    console.log('Messages received:', messages);
  },
}));

```

## Connect to the chat server[​](#connect-to-the-chat-server "Direct link to Connect to the chat server")

1. To send and receive messages, you first need a registered user. Your app server should call the Server API to obtain an access token. See [User registration](https://docs.nexconn.ai/platform-chat-api/user/register). For this quickstart, use a token for a test user, such as user ID `1`. A successful token response looks like this:

HTTP

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "code":200,
  "userId":"1",
  "token":"gxld6GHx3t1eDxof1qtxxYrQcjkbhl1V@sgyu.cn.example.com;sgyu.cn.example.com"
}

```

2. Call `connect` to connect the user to the chat service. The Chat SDK has a built-in reconnection mechanism, so you only need to call `connect` once per app lifecycle. See [Connect](/chatsdk-web/connection/connect.md) for details.

TypeScript

```ts
import { NCEngine } from '@nexconn/chat';

NCEngine.connect({ token: '<Your-Token>' }).then(res => {
  if (res.code === 0) {
    console.log('Connected. Current user ID:', res.data?.userId);
  } else {
    console.warn('Connection failed. Code:', res.code);
  }
});

```

warning

* All Chat SDK business APIs (channels, messages, etc.) require a successful connection first.

## Get the channel list[​](#channel "Direct link to Get the channel list")

The Nexconn Chat SDK uses different classes for different channel types:

| Channel type      | Class                                      | targetId             |
| ----------------- | ------------------------------------------ | -------------------- |
| Direct channel    | `DirectChannel`                            | The other user's ID  |
| Group channel     | `GroupChannel`                             | Group ID             |
| Open channel      | `OpenChannel`                              | Open channel ID      |
| Community channel | `CommunityChannel` / `CommunitySubChannel` | Community channel ID |

TypeScript

```ts
import { BaseChannel, BaseChannel as BC } from '@nexconn/chat';

// Get the channel list (paginated)
const query = BaseChannel.createChannelsQuery({ pageSize: 20 });
const { code, data: channelList } = await query.loadNextPage();
if (code === 0) {
  console.log('Channel list:', channelList);
} else {
  console.log('Failed to get channel list. Code:', code);
}

```

## Send a message[​](#send "Direct link to Send a message")

Send a text message to a user with userId `2`. Besides text messages, you can also send images, files, voice messages, and more. See [Message types](/chatsdk-web/message/send.md#types).

TypeScript

```ts
import { DirectChannel, SendTextMessageParams } from '@nexconn/chat';

// Create a direct channel instance (targetId is the other user's ID)
const channel = new DirectChannel('2');

// Send a text message
const params = new SendTextMessageParams({ text: 'Hello, Nexconn!' });
const { code, data } = await channel.sendMessage(params);
if (code === 0) {
  console.log('Message sent:', data);
} else {
  console.log('Send failed. Code:', code);
}

```

## Receive messages[​](#received "Direct link to Receive messages")

Incoming messages are delivered through the message listener registered with `NCEngine.addMessageHandler`. See the [Set up listeners](#listener) section above.

## Get remote messages[​](#gethistory "Direct link to Get remote messages")

Example: Get remote messages from a direct channel with user `2`.

TypeScript

```ts
import { DirectChannel, BaseChannel } from '@nexconn/chat';

const channel = new DirectChannel('2');

// Paginated fetch of remote messages
const query = BaseChannel.createMessagesQuery({
  channelIdentifier: channel.identifier,
  startTime: Date.now(), // Start timestamp — fetches messages before this time
  pageSize: 20,          // Number of messages per page (valid range: 1–100)
  isAscending: false,    // false: descending (newest first), true: ascending
});
const { code, data } = await query.loadNextPage();
if (code === 0) {
  console.log('Messages:', data);
} else {
  console.log('Failed to get messages. Code:', code);
}

```

## Disconnect[​](#disconnect "Direct link to Disconnect")

warning

* Disconnecting prevents you from receiving messages, sending messages, fetching remote messages, and getting channel lists.
* After reconnecting, missed messages from the offline period are delivered. Missed messages are stored for **7** days by default.

TypeScript

```ts
import { NCEngine } from '@nexconn/chat';

await NCEngine.disconnect();
console.log('Disconnected');

```

## Next steps[​](#next-steps "Direct link to Next steps")

You have now completed the basic Chat SDK integration. See the other sections for detailed guidance on channels, messages, and related features.
