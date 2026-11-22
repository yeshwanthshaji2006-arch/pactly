# Manage tag data

Create, update, delete, and listen for changes to channel tags.

## Create a tag[​](#create-a-tag "Direct link to Create a tag")

TypeScript

```ts
import { Tag } from '@nexconn/chat';

const { code, data: tag } = await Tag.createTag({
  tagId: 'work',
  tagName: 'Work',
});
if (code === 0) {
  console.log('Tag created:', tag);
}

```

## Update a tag[​](#update-a-tag "Direct link to Update a tag")

TypeScript

```ts
import { Tag } from '@nexconn/chat';

const { code, data: tags } = await Tag.getTags();
if (code === 0 && tags && tags.length > 0) {
  const tag = tags[0];
  const { code: updateCode } = await tag.update('Updated Name');
  if (updateCode === 0) {
    console.log('Tag updated');
  }
}

```

## Delete a tag[​](#delete-a-tag "Direct link to Delete a tag")

TypeScript

```ts
import { Tag } from '@nexconn/chat';

const { code, data: tags } = await Tag.getTags();
if (code === 0 && tags && tags.length > 0) {
  const tag = tags[0];
  const { code: deleteCode } = await tag.delete();
  if (deleteCode === 0) {
    console.log('Tag deleted');
  }
}

```

## Get unread count by tag[​](#get-unread-count-by-tag "Direct link to Get unread count by tag")

TypeScript

```ts
import { Tag } from '@nexconn/chat';

const { code, data: tags } = await Tag.getTags();
if (code === 0 && tags && tags.length > 0) {
  const tag = tags[0];
  const { code: unreadCode, data: unreadCount } = await tag.getUnreadCount(false); // false: exclude muted channels
  if (unreadCode === 0) {
    console.log('Unread count in tag:', unreadCount);
  }
}

```

## Listen for tag changes[​](#listen-for-tag-changes "Direct link to Listen for tag changes")

Register a `TagHandler` to receive real-time tag update notifications:

TypeScript

```ts
import { NCEngine, TagHandler } from '@nexconn/chat';

NCEngine.addTagHandler('my-tag-handler', new TagHandler({
  onTagChanged(): void {
    console.log('Tags changed');
  },
  onChannelTagChanged(): void {
    console.log('Tag channels changed');
  },
}));

// Remove when no longer needed
NCEngine.removeTagHandler('my-tag-handler');

```
