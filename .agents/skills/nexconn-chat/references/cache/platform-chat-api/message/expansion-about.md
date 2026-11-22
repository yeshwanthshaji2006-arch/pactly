# Message metadata overview

Message metadata allows you to add status indicators (key-value pairs) to sent messages. APIs are available to set, delete, and query metadata.

## Use cases[​](#use-cases "Direct link to Use cases")

Any scenario that requires adding status labels to messages in direct or group channels can use message metadata. Examples:

* **Message reactions/comments**: Add comment data as metadata on the original message.
* **Status changes**: Track gift redemption, order status updates, etc. For example, send a gift message with a default "unclaimed" status, then update the metadata to "claimed" when the user taps it.

tip

Message metadata APIs support direct, group, and system channels only.

* **Open channels**: Message metadata is not supported.
* **Community channels**: Message metadata is supported with a dedicated server API. See [Set community channel message metadata](/platform-chat-api/message/community-channel/set-expansion.md).

## Metadata storage[​](#metadata-storage "Direct link to Metadata storage")

Metadata operations generate "metadata operation messages." Cloud retention is enabled by default for direct, group, and system channels, so metadata operation messages are stored for 180 days (6 months) and can be retrieved via the history API during that retention period.
