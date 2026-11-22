# Unread message count

Retrieve the total unread message count and unread counts by DND level.

## Get total unread count[​](#get-total-unread-count "Direct link to Get total unread count")

TypeScript

```ts
import { BaseChannel } from '@nexconn/chat';

const { code, data: totalUnread } = await BaseChannel.getTotalUnreadCount();
if (code === 0) {
  console.log('Total unread:', totalUnread);
} else {
  console.log('Failed to get unread count. Code:', code);
}

```

## Get unread count by DND level[​](#get-unread-count-by-dnd-level "Direct link to Get unread count by DND level")

TypeScript

```ts
import { BaseChannel, ChannelNoDisturbLevel, ChannelType } from '@nexconn/chat';

const { code, data: unreadCount } = await BaseChannel.getChannelsUnreadCountByNoDisturbLevel({
  levels: [ChannelNoDisturbLevel.DEFAULT],
  channelTypes: [ChannelType.Private, ChannelType.Group],
});
if (code === 0) {
  console.log('Unread count:', unreadCount);
}

```

### Parameters[​](#parameters "Direct link to Parameters")

| Parameter      | Type                      | Required | Description                           |
| -------------- | ------------------------- | -------- | ------------------------------------- |
| `levels`       | `ChannelNoDisturbLevel[]` | Yes      | DND levels to include in the count    |
| `channelTypes` | `ChannelType[]`           | Yes      | Channel types to include in the count |

## `ChannelNoDisturbLevel` values[​](#channelnodisturblevel-values "Direct link to channelnodisturblevel-values")

| Value                                 | Description                                          |
| ------------------------------------- | ---------------------------------------------------- |
| `ChannelNoDisturbLevel.ALL_MESSAGE`   | Notify for all messages                              |
| `ChannelNoDisturbLevel.DEFAULT`       | Default notification level (follows global settings) |
| `ChannelNoDisturbLevel.MENTION`       | Notify on any @mention                               |
| `ChannelNoDisturbLevel.MENTION_USERS` | Notify only when mentioned by name                   |
| `ChannelNoDisturbLevel.MENTION_ALL`   | Notify only on @all mentions                         |
| `ChannelNoDisturbLevel.MUTED`         | Fully muted — no notifications                       |
