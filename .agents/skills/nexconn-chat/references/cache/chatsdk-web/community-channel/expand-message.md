# Manage message metadata

Attach key-value metadata to messages in community subchannels. Use metadata for reactions, translations, custom status, and other structured information.

## Update message metadata[​](#update-message-metadata "Direct link to Update message metadata")

First retrieve a `Message` object, then call `message.setMetadata()`:

TypeScript

```ts
import {
  CommunitySubChannel,
  BaseChannel,
  SendTextMessageParams,
  Message,
} from '@nexconn/chat';

const channel = new CommunitySubChannel('<communityId>', '<subChannelId>');

// Option 1: Use the message object returned from sendMessage
const { code, data: sentMessage } = await channel.sendMessage(
  new SendTextMessageParams({ text: 'Hello!' }),
);

if (code === 0 && sentMessage) {
  const { code: metaCode } = await sentMessage.setMetadata({
    reaction_like: 'user1,user2',
    translated: 'true',
  });
  if (metaCode === 0) {
    console.log('Metadata updated');
  }
}

// Option 2: Retrieve from history
const query = BaseChannel.createMessagesQuery({
  channelIdentifier: channel.identifier,
  startTime: Date.now(),
  pageSize: 1,
  isAscending: false,
});
const { code: histCode, data: page } = await query.loadNextPage();
if (histCode === 0 && page.data.length > 0) {
  const { code: metaCode } = await page.data[0].setMetadata({ reaction_like: 'user1' });
  if (metaCode === 0) {
    console.log('Metadata updated');
  }
}

```

## Remove message metadata keys[​](#remove-message-metadata-keys "Direct link to Remove message metadata keys")

Call `message.deleteMetadata()` to remove specific keys:

TypeScript

```ts
const { code } = await sentMessage.deleteMetadata(['reaction_like']);
if (code === 0) {
  console.log('Metadata key removed');
}

```

## Listen for metadata changes[​](#listen-for-metadata-changes "Direct link to Listen for metadata changes")

Register a `MessageHandler` to receive community channel message metadata change events:

TypeScript

```ts
import { NCEngine, MessageHandler } from '@nexconn/chat';

NCEngine.addMessageHandler('community-meta-handler', new MessageHandler({
  onCommunityChannelMessageMetadataChanged({ messages }) {
    console.log('Community channel metadata updated:', messages);
  },
}));

// Remove the handler when no longer needed
NCEngine.removeMessageHandler('community-meta-handler');

```

info

* Each message supports up to **20** key-value pairs.
* Content moderation, including the profanity filter, applies to metadata values.
