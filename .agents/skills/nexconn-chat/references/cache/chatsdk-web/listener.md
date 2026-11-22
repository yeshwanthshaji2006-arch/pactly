# Event handlers

The Nexconn Chat SDK uses a typed handler architecture to notify your application of connection changes, incoming messages, and other real-time events. Register handlers after initialization and before connecting to the server.

## Handler types[​](#handler-types "Direct link to Handler types")

Each handler type covers a specific domain of events:

| Handler class             | Registration method                   | Domain                                                                    |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| `ConnectionStatusHandler` | `NCEngine.addConnectionStatusHandler` | Connection lifecycle                                                      |
| `MessageHandler`          | `NCEngine.addMessageHandler`          | Message receive, deletion, moderation, metadata, read receipts, reactions |
| `ChannelHandler`          | `NCEngine.addChannelHandler`          | Channel pin/DND sync, typing status, community subchannel changes         |
| `UserHandler`             | `NCEngine.addUserHandler`             | User subscriptions, friend events                                         |
| `OpenChannelHandler`      | `NCEngine.addOpenChannelHandler`      | Open channel join/leave, KV changes, user kicks                           |
| `TranslateHandler`        | `NCEngine.addTranslateHandler`        | Translation completion, target language, auto-translate state             |
| `TagHandler`              | `NCEngine.addTagHandler`              | Tag changes and channel-tag assignment changes                            |
| `UserSettingsHandler`     | `NCEngine.addUserSettingsHandler`     | User settings sync completion                                             |
| `GroupChannelHandler`     | `NCEngine.addGroupChannelHandler`     | Group operations, application, profile/member updates                     |

## Register handlers[​](#register-handlers "Direct link to Register handlers")

Pass a unique string ID and a handler instance to each registration call. The ID lets you remove the handler later without affecting others registered to the same event domain.

TypeScript

```ts
import {
  NCEngine,
  ConnectionStatusHandler,
  MessageHandler,
  ChannelHandler,
  UserHandler,
} from '@nexconn/chat';

// Connection status
NCEngine.addConnectionStatusHandler('my-conn-handler', new ConnectionStatusHandler({
  onConnectionStatusChanged({ status, code }) {
    console.log('Connection status changed:', status)
  }
}));

// Message events
NCEngine.addMessageHandler('my-msg-handler', new MessageHandler({
  onMessageReceived({ messages }) {
    console.log('New messages:', messages);
  },
  onMessageDeleted({ messages }) {
    console.log('Messages deleted:', messages);
  },
  onMessageBlocked({ info }) {
    console.log('Message blocked:', info);
  },
  onMessageReceiptResponse({ responses }) {
    console.log('Read receipts:', responses);
  },
  onMessageMetadataUpdated(event) {
    console.log('Message metadata updated:', event);
  },
  onMessageMetadataDeleted(event) {
    console.log('Message metadata deleted:', event);
  },
  onMessageReactionChanged({ reactions }) {
    console.log('Message reactions changed:', reactions);
  },
  onOfflineMessageSyncCompleted() {
    console.log('Offline message sync completed');
  },
}));

// Channel events
NCEngine.addChannelHandler('my-channel-handler', new ChannelHandler({
  onTypingStatusChanged({ channelIdentifier, userTypingStatus }) {
    console.log('Typing status changed in channel:', channelIdentifier, userTypingStatus);
  },
  onChannelPinnedSync({ channelIdentifier, isPinned }) {
    console.log('Channel pin changed:', channelIdentifier, isPinned);
  },
  onChannelNoDisturbLevelSync({ channelIdentifier, level }) {
    console.log('DND level changed:', channelIdentifier, level);
  },
  onCommunitySubChannelDeleted({ info }) {
    console.log('Community subchannel deleted:', info);
  },
  onCommunitySubChannelUserKicked({ info }) {
    console.log('Community subchannel user kicked:', info);
  },
}));

// User events
NCEngine.addUserHandler('my-user-handler', new UserHandler({
  onSubscriptionChanged({ events }) {
    console.log('Subscription status events:', events);
  },
  onFriendAdd(event) {
    console.log('Friend added:', event);
  },
  onFriendRemove(event) {
    console.log('Friend removed:', event);
  },
  onFriendApplicationStatusChanged(event) {
    console.log('Friend application status changed:', event);
  },
}));

```

## Remove handlers[​](#remove-handlers "Direct link to Remove handlers")

Remove a handler by its unique ID when it is no longer needed:

TypeScript

```ts
NCEngine.removeConnectionStatusHandler('my-conn-handler');
NCEngine.removeMessageHandler('my-msg-handler');
NCEngine.removeChannelHandler('my-channel-handler');
NCEngine.removeUserHandler('my-user-handler');
NCEngine.removeOpenChannelHandler('my-open-channel-handler');
NCEngine.removeTranslateHandler('my-translate-handler');
NCEngine.removeTagHandler('my-tag-handler');
NCEngine.removeUserSettingsHandler('my-settings-handler');
NCEngine.removeGroupChannelHandler('my-group-channel-handler');

```

## Open channel handlers[​](#open-channel-handlers "Direct link to Open channel handlers")

Register an `OpenChannelHandler` to receive open channel-specific events:

TypeScript

```ts
import { NCEngine, OpenChannelHandler } from '@nexconn/chat';

NCEngine.addOpenChannelHandler('my-open-channel-handler', new OpenChannelHandler({
  onEntered({ channelId, response }) {
    console.log('Entered open channel:', channelId, response);
  },
  onExited({ channelId }) {
    console.log('Exited open channel:', channelId);
  },
  onMetadataChanged({ changeInfo }) {
    console.log('Open channel metadata changed:', changeInfo);
  },
  onParticipantChanged({ channelId, participantCount, actions }) {
    console.log('Open channel member joined or left:', channelId, participantCount, actions);
  },
  onParticipantBanned({ info }) {
    console.log('Open channel member banned or unbanned:', info);
  },
}));

```

## Translate handlers[​](#translate-handlers "Direct link to Translate handlers")

Register a `TranslateHandler` to receive translation-related events:

TypeScript

```ts
import { NCEngine, TranslateHandler } from '@nexconn/chat';

NCEngine.addTranslateHandler('my-translate-handler', new TranslateHandler({
  onTranslationCompleted({ results }) {
    console.log('Translation completed:', results);
  },
  onTranslationLanguageChanged({ language }) {
    console.log('Translation language changed:', language);
  },
  onAutoTranslateStateChanged({ isEnabled }) {
    console.log('Auto translate state changed:', isEnabled);
  },
}));

```

## Tag handlers[​](#tag-handlers "Direct link to Tag handlers")

Register a `TagHandler` to receive tag-related updates:

TypeScript

```ts
import { NCEngine, TagHandler } from '@nexconn/chat';

NCEngine.addTagHandler('my-tag-handler', new TagHandler({
  onTagChanged() {
    console.log('Tags changed');
  },
  onChannelTagChanged() {
    console.log('Channel tag assignments changed');
  },
}));

```

## User settings handlers[​](#user-settings-handlers "Direct link to User settings handlers")

Register a `UserSettingsHandler` to know when user settings sync completes:

TypeScript

```ts
import { NCEngine, UserSettingsHandler } from '@nexconn/chat';

NCEngine.addUserSettingsHandler('my-settings-handler', new UserSettingsHandler({
  onUserSettingsSyncCompleted({ code }) {
    console.log('User settings sync completed:', code);
  },
}));

```

## Group channel handlers[​](#group-channel-handlers "Direct link to Group channel handlers")

Register a `GroupChannelHandler` to receive group channel lifecycle and administration events:

TypeScript

```ts
import { NCEngine, GroupChannelHandler } from '@nexconn/chat';

NCEngine.addGroupChannelHandler('my-group-channel-handler', new GroupChannelHandler({
  onGroupOperation(event) {
    console.log('Group operation:', event);
  },
  onGroupApplicationEvent(event) {
    console.log('Group application event:', event);
  },
  onGroupInfoChanged(event) {
    console.log('Group info changed:', event);
  },
  onGroupMemberInfoChanged(event) {
    console.log('Group member info changed:', event);
  },
  onGroupFavoritesChangedSync(event) {
    console.log('Group favorites sync event:', event);
  },
}));

```

Since `26.5.1`, `onGroupInfoChanged` and `onGroupMemberInfoChanged` can receive events without `operatorInfo`. Check whether it is present before accessing the operator's profile.

## Recommended setup order[​](#recommended-setup-order "Direct link to Recommended setup order")

1. Call `NCEngine.initialize()`.
2. Register all handlers.
3. Call `NCEngine.connect()`.

This ensures that no events are missed when the SDK establishes the connection and starts synchronizing data.
