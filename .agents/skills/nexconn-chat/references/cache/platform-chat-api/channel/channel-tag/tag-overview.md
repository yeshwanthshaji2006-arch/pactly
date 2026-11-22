# Channel tags overview

Channel tags provide a flexible way to organize and categorize channels for individual users. By assigning tags to channels, you can group, manage, and display channels more efficiently, improving the user experience of channel lists.

Channel tags are useful in a variety of scenarios, including enterprise collaboration, social messaging, and customer service systems.

## Key features[​](#key-features "Direct link to Key features")

### Tag limits[​](#tag-limits "Direct link to Tag limits")

* **Maximum tags per user:** 20
* **Maximum channels per tag:** 1,000 (via the Platform Chat API). When exceeded, the oldest channel in the tag is automatically removed.
* **Multi-tag support:** A single channel can belong to multiple tags simultaneously.

### Supported channel types[​](#supported-channel-types "Direct link to Supported channel types")

Channel tags support the following channel types:

* **Direct channel** (`channelType: 1`)
* **Group channel** (`channelType: 3`)
* **System channel** (`channelType: 6`)

tip

Channel tags are not supported for open channels or community channels.

## Use cases[​](#use-cases "Direct link to Use cases")

### Enterprise collaboration[​](#enterprise-collaboration "Direct link to Enterprise collaboration")

Organize work-related channels by category:

* **Departments**: Group channels by department
* **Projects**: Categorize project discussion groups
* **Clients**: Tag channels for client communication
* **Internal**: Separate internal and external channels

### Social relationship management[​](#social-relationship-management "Direct link to Social relationship management")

Categorize channels by relationship type:

* **Family**: Family member channels
* **Friends**: Friend channels
* **Colleagues**: Work-related channels
* **Classmates**: School-related channels

### Priority management[​](#priority-management "Direct link to Priority management")

Tag channels by importance:

* **Important**: High-priority channels
* **Work**: Formal work communications
* **Casual**: Everyday channels
* **Temporary**: Short-term discussion channels

## API overview[​](#api-overview "Direct link to API overview")

Channel tag APIs fall into two main categories:

* User tag management
* Channel-tag association

User tag management APIs create, query, and delete tag definitions. These are the foundation for using channel tags.

| Description | API                                                                                             | Notes                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Create tags | [Create user channel tags](/platform-chat-api/channel/channel-tag/user-conversation-tag-set.md) | Create tag definitions (ID and name). You must create tags before assigning them to channels. Max 20 tags per request. |
| List tags   | [List user channel tags](/platform-chat-api/channel/channel-tag/user-conversation-tag-get.md)   | Query all tags created by a user, including tag ID, name, and creation time.                                           |
| Delete tags | [Delete user channel tags](/platform-chat-api/channel/channel-tag/user-conversation-tag-del.md) | Delete one or more tags. Deleting a tag automatically removes all channel associations. Max 20 tags per request.       |

tip

* Tag ID: max 10 characters, must be unique per user
* Tag name: max 15 characters
* Max 20 tags per request

Channel-tag association APIs manage the relationship between channels and tags.

| Description                | API                                                                                          | Notes                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Add channels to a tag      | [Add channels to a tag](/platform-chat-api/channel/channel-tag/conversation-tag-set.md)      | Add one or more channels to a specified tag. Max 100 channels per request.                                     |
| Remove channels from a tag | [Remove channels from a tag](/platform-chat-api/channel/channel-tag/conversation-tag-del.md) | Remove one or more channels from a tag. The channels themselves are not deleted. Max 100 channels per request. |
| List channels in a tag     | [List channels in a tag](/platform-chat-api/channel/channel-tag/conversation-tag-get.md)     | Query all channels associated with a specified tag.                                                            |
| Get channel attributes     | [Get channel attributes](/platform-chat-api/channel/conversation-attr-get.md)                | Get all attributes of a channel, including its tag assignments, pin status, and notification settings.         |

tip

* Max 100 channels per request
* Channel-tag relationships are many-to-many: a channel can belong to multiple tags, and a tag can contain multiple channels

## Typical workflow[​](#typical-workflow "Direct link to Typical workflow")

1. **Create tags**: Use [Create user channel tags](/platform-chat-api/channel/channel-tag/user-conversation-tag-set.md) to define tags for a user.

2. **Assign channels**: Use [Add channels to a tag](/platform-chat-api/channel/channel-tag/conversation-tag-set.md) to add channels to the appropriate tags.

3. **Query**:

   <!-- -->

   * Use [List user channel tags](/platform-chat-api/channel/channel-tag/user-conversation-tag-get.md) to view all tags for a user.
   * Use [List channels in a tag](/platform-chat-api/channel/channel-tag/conversation-tag-get.md) to view channels under a tag.
   * Use [Get channel attributes](/platform-chat-api/channel/conversation-attr-get.md) to view tag assignments for a specific channel.

4. **Maintain**:

   <!-- -->

   * Use [Remove channels from a tag](/platform-chat-api/channel/channel-tag/conversation-tag-del.md) to adjust tag assignments.
   * Use [Delete user channel tags](/platform-chat-api/channel/channel-tag/user-conversation-tag-del.md) to remove tags that are no longer needed.
