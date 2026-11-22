# Update a message

Update the content of a sent message. This replaces the original message content with the new content for all participants.

## Update a message[​](#update-a-message "Direct link to Update a message")

Use the static `BaseChannel.updateMessage` method with the message ID, channel identifier, message type, and new content. Since `26.5.1`, `messageType` is required so the SDK can convert the content for the correct message type.

TypeScript

```ts
import { NCEngine, DirectChannel, BaseChannel, MessageType, TextMessageContent } from '@nexconn/chat';

const channel = new DirectChannel('<target-user-id>');

// First retrieve the message object you want to modify
const query = BaseChannel.createMessagesQuery({
  channelIdentifier: channel.identifier,
  startTime: Date.now(),
  pageSize: 20,
  isAscending: false,
});
const { code, data: page } = await query.loadNextPage();

const message = page?.data.find((item) =>
  item.messageType === MessageType.TEXT &&
  item.senderUserId === NCEngine.getCurrentUserId()
);
if (code === 0 && message) {
  const { code: updateCode } = await BaseChannel.updateMessage<TextMessageContent>({
    messageId: message.messageId,
    messageType: message.messageType,
    channelIdentifier: channel.identifier,
    content: { text: 'Updated message content' }, // Plain content object
  });
  if (updateCode === 0) {
    console.log('Message updated');
  } else {
    console.log('Update failed. Code:', updateCode);
  }
}

```

### Parameters[​](#parameters "Direct link to Parameters")

| Parameter           | Type                | Required | Description                                                                       |
| ------------------- | ------------------- | -------- | --------------------------------------------------------------------------------- |
| `messageId`         | `string`            | Yes      | The server-assigned message ID of the message to update                           |
| `messageType`       | `string`            | Yes      | The original message's type, such as `MessageType.TEXT`. Required since `26.5.1`. |
| `channelIdentifier` | `ChannelIdentifier` | Yes      | The identifier of the channel the message belongs to                              |
| `content`           | `T`                 | Yes      | The new message content as a plain object                                         |

The edit window is provided by `NCEngine.getAppSettings().data?.messageModifiableMinutes`. A value of `0` means message editing is disabled. The window starts at the original `sentTime`; editing a message does not restart it.

When updating a reference message, preserve the reference fields and change only its `text` field. See [Reference messages](/chatsdk-web/message/reference-message.md).

## Handle message update notifications[​](#handle-message-update-notifications "Direct link to Handle message update notifications")

When a message is updated, all connected users receive the updated message through the message listener:

TypeScript

```ts
import { NCEngine, MessageHandler } from '@nexconn/chat';

NCEngine.addMessageHandler('message-handler', new MessageHandler({
  onMessagesUpdated({ messages }) {
    messages.forEach((message) => {
      console.log('Message updated:', message.messageId, message.content);
    });
  },
}));

```

info

* Message updates are supported in direct channels, group channels, and community channels.
* The update is applied to the server-side message history.
* Content moderation (profanity filter, IM content moderation) is applied to the updated content as well.
