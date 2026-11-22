# Receive messages

Receive real-time messages through the Chat SDK's message listener.

## Register a message listener[​](#register-a-message-listener "Direct link to Register a message listener")

Use `NCEngine.addMessageHandler` to register a handler that receives all incoming messages. Register the listener before calling `connect`.

TypeScript

```ts
import { NCEngine, MessageHandler } from '@nexconn/chat';

NCEngine.addMessageHandler('my-handler', new MessageHandler({
  onMessageReceived({ messages }) {
    messages.forEach((msg) => {
      console.log('Received:', msg.messageType, msg.content);
    });
  },
}));

```

## Message object properties[​](#message-object-properties "Direct link to Message object properties")

Each received message contains the following properties:

| Property       | Type          | Description                                                                                                                   |
| -------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `messageId`    | `string`      | Unique message ID assigned by the server                                                                                      |
| `messageType`  | `string`      | Message type identifier (e.g., `RC:TxtMsg`)                                                                                   |
| `content`      | `T`           | Message content (varies by message type)                                                                                      |
| `senderUserId` | `string`      | Sender's user ID                                                                                                              |
| `channelId`    | `string`      | Channel ID                                                                                                                    |
| `channelType`  | `ChannelType` | Channel type                                                                                                                  |
| `sentTime`     | `number`      | Server timestamp                                                                                                              |
| `hasReactions` | `boolean`     | Whether the message has reactions. Use [Message reactions](/chatsdk-web/message/message-reactions.md) to fetch the summaries. |

## Handle different message types[​](#handle-different-message-types "Direct link to Handle different message types")

TypeScript

```ts
import { NCEngine, MessageHandler, MessageType, TextMessageContent, ImageMessageContent } from '@nexconn/chat';

NCEngine.addMessageHandler('type-handler', new MessageHandler({
  onMessageReceived({ messages }) {
    messages.forEach((msg) => {
      switch (msg.messageType) {
        case MessageType.TEXT: {
          const content = msg.content as TextMessageContent;
          console.log('Text:', content.text);
          break;
        }
        case MessageType.IMAGE: {
          const content = msg.content as ImageMessageContent;
          console.log('Image URL:', content.remoteUrl);
          break;
        }
        default:
          console.log('Other message type:', msg.messageType);
      }
    });
  },
}));

```

## Remove a message listener[​](#remove-a-message-listener "Direct link to Remove a message listener")

TypeScript

```ts
NCEngine.removeMessageHandler('my-handler');

```

tip

* You can register multiple message handlers with different `uniqueId` values.
* Messages from all channel types (direct, group, open channel, community) are delivered through the same listener. Use `channelType` to filter.
