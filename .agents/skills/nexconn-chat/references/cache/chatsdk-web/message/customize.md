# Create custom message types

Define custom message types to support business-specific messaging needs beyond the built-in types.

## Register a custom message type[​](#register-a-custom-message-type "Direct link to Register a custom message type")

Register your custom message types **before calling `connect`**. Use `NCEngine.registerCustomMessages` to define one or more types in a single call.

TypeScript

```ts
import { NCEngine } from '@nexconn/chat';

NCEngine.registerCustomMessages([
  {
    messageType: 'App:Custom',
    isPersited: true,
    isCounted: true,
  },
]);

```

### Registration options[​](#registration-options "Direct link to Registration options")

| Option               | Type      | Required | Description                                                                                                |
| -------------------- | --------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `messageType`        | `string`  | Yes      | Unique message type identifier (e.g., `App:Custom`)                                                        |
| `isPersited`         | `boolean` | Yes      | Whether to store the message in history                                                                    |
| `isCounted`          | `boolean` | Yes      | Whether the message increments the unread count                                                            |
| `isStatusMessage`    | `boolean` | No       | Whether to treat this type as a status message rather than a regular chat record                           |
| `remoteFileUrlField` | `string`  | No       | For media-type custom messages, the field name in the content body that holds the uploaded remote file URL |

## Send a custom message[​](#send-a-custom-message "Direct link to Send a custom message")

After registering the type, send a custom message using `SendMessageParams` with the custom type identifier:

TypeScript

```ts
import { DirectChannel, SendMessageParams } from '@nexconn/chat';

interface CustomMessageContent {
  key1: string;
  key2: string;
}

const channel = new DirectChannel('<target-user-id>');

const params = new SendMessageParams<CustomMessageContent>(
  { key1: 'value1', key2: 'value2' },
  'App:Custom',
);
const { code, data } = await channel.sendMessage(params);
if (code === 0) {
  console.log('Custom message sent:', data);
}

```

## Receive custom messages[​](#receive-custom-messages "Direct link to Receive custom messages")

Custom messages arrive through the standard message listener:

TypeScript

```ts
import { NCEngine, MessageHandler, Message } from '@nexconn/chat';

interface CustomMessageContent {
  key1: string;
  key2: string;
}

NCEngine.addMessageHandler('custom-handler', new MessageHandler({
  onMessageReceived({ messages }): void {
    messages.forEach((msg) => {
      if (msg.messageType === 'App:Custom') {
        const content = msg.content as CustomMessageContent;
        console.log('Custom message data:', content.key1, content.key2);
      }
    });
  },
}));

```

warning

* Register custom message types before calling `connect`. Unregistered types may not be properly decoded.
* `registerCustomMessages` accepts an array — you can register multiple types in a single call.
* The `messageType` must be consistent across all platforms (iOS, Android, Web) to ensure interoperability.
* Avoid using the `NC:` or `RC:` prefix, which is reserved for built-in message types.
