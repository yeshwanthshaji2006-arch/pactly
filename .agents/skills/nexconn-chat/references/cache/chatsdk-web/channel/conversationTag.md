# Channel tags overview

Channel tags allow you to organize channels into custom groups. You can create tags and assign channels to them for easier filtering and navigation.

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

## Get all tags[​](#get-all-tags "Direct link to Get all tags")

TypeScript

```ts
import { Tag } from '@nexconn/chat';

const { code, data: tags } = await Tag.getTags();
if (code === 0) {
  console.log('Tags:', tags);
}

```

## Add channels to a tag[​](#add-channels-to-a-tag "Direct link to Add channels to a tag")

TypeScript

```ts
import { Tag, DirectChannel } from '@nexconn/chat';

const { code, data: tags } = await Tag.getTags();
if (code === 0 && tags && tags.length > 0) {
  const tag = tags[0];
  const { code: addCode } = await tag.addChannels([
    new DirectChannel('user1').identifier,
  ]);
  if (addCode === 0) {
    console.log('Channels added to tag');
  }
}

```

## Remove channels from a tag[​](#remove-channels-from-a-tag "Direct link to Remove channels from a tag")

TypeScript

```ts
import { Tag, DirectChannel } from '@nexconn/chat';

const { code, data: tags } = await Tag.getTags();
if (code === 0 && tags && tags.length > 0) {
  const tag = tags[0];
  const { code: removeCode } = await tag.deleteChannels([
    new DirectChannel('user1').identifier,
  ]);
  if (removeCode === 0) {
    console.log('Channels removed from tag');
  }
}

```

## Get channels in a tag[​](#get-channels-in-a-tag "Direct link to Get channels in a tag")

Use a query to retrieve channels associated with a tag:

TypeScript

```ts
import { Tag } from '@nexconn/chat';

const { code, data: tags } = await Tag.getTags();
if (code === 0 && tags && tags.length > 0) {
  const tag = tags[0];
  const query = Tag.createTaggedChannelsQuery({
    tagId: tag.tagId,
    pageSize: 20,
  });
  const { code: queryCode, data: channels } = await query.loadNextPage();
  if (queryCode === 0) {
    console.log('Channels in tag:', channels);
  }
}

```

info

Channel tags are stored on the server and synced across devices. Updates trigger `TagHandler` events on all connected clients.
