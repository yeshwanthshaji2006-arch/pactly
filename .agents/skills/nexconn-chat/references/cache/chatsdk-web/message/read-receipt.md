# Use read receipts

Send and receive read receipts to inform the sender that their message has been read.

## How it works[​](#how-it-works "Direct link to How it works")

1. The sender sends a message.
2. The recipient reads the message and sends a read receipt.
3. The sender receives the read receipt notification via `MessageHandler.onMessageReceiptResponse`.

## Send a read receipt[​](#send-a-read-receipt "Direct link to Send a read receipt")

After the user reads messages, send a read receipt by calling `sendReadReceiptResponse` on the channel, passing the message IDs:

TypeScript

```ts
import { DirectChannel } from '@nexconn/chat';

const channel = new DirectChannel('<target-user-id>');
const { code } = await channel.sendReadReceiptResponse(['<message-uid-1>', '<message-uid-2>']);
if (code === 0) {
  console.log('Read receipt sent');
}

```

### Parameters[​](#parameters "Direct link to Parameters")

| Parameter    | Type       | Description                                |
| ------------ | ---------- | ------------------------------------------ |
| `messageIds` | `string[]` | Array of message unique IDs that were read |

## Listen for read receipt responses[​](#listen-for-read-receipt-responses "Direct link to Listen for read receipt responses")

Register a `MessageHandler` to receive read receipt notifications:

TypeScript

```ts
import { NCEngine, MessageHandler } from '@nexconn/chat';

NCEngine.addMessageHandler('receipt-handler', new MessageHandler({
  onMessageReceiptResponse({ responses }) {
    console.log('Read receipts received:', responses);
  },
}));

```

## Query read receipt users (group channels)[​](#query-read-receipt-users-group-channels "Direct link to Query read receipt users (group channels)")

In group channels, use `BaseChannel.createMessagesReadReceiptUsersQuery()` to query which members have read a specific message:

TypeScript

```ts
import { BaseChannel, MessageReadReceiptStatus, GroupChannel } from '@nexconn/chat';

const channel = new GroupChannel('<group-id>');

const query = BaseChannel.createMessagesReadReceiptUsersQuery({
  channelIdentifier: channel.identifier,
  messageId: '<message-uid>',
  pageSize: 20,
  status: MessageReadReceiptStatus.READ,
});
const { code, data } = await query.loadNextPage();
if (code === 0) {
  console.log('Users who read the message:', data);
}

```
