# Status codes

## HTTP status codes[​](#http-status-codes "Direct link to HTTP status codes")

| Status code | Description           | Details                                                                       |
| ----------- | --------------------- | ----------------------------------------------------------------------------- |
| `200`       | Success               | The request completed successfully.                                           |
| `400`       | Bad request           | The request is invalid. See the error message for details.                    |
| `401`       | Unauthorized          | Authentication failed. See the error message for details.                     |
| `403`       | Forbidden             | The request was rejected. See the error message for details.                  |
| `404`       | Not found             | The requested endpoint does not exist.                                        |
| `405`       | Method not allowed    | The HTTP method is not supported for this endpoint.                           |
| `429`       | Too many requests     | The rate limit has been exceeded. See the error message for details.          |
| `430`       | Service not enabled   | The required service has not been enabled. See the error message for details. |
| `500`       | Internal server error | An internal error occurred. Contact support for assistance.                   |
| `504`       | Gateway timeout       | The server is running but the request timed out. Retry after a short delay.   |

## Business return codes[​](#business-return-codes "Direct link to Business return codes")

0

Success.

**Troubleshooting**: No action is required.

400

The user ID does not exist.

**Troubleshooting**: Register the user before use. See [Register a user](/platform-chat-api/user/register.md).

404

The server cannot find the requested endpoint (HTTP 404).

**Troubleshooting**: The requested endpoint does not exist. See [API endpoints](/platform-chat-api/prepare-to-use-api/chat-server-api-list.md).

1000

Invalid request parameters, internal logic error, or package name count exceeded.

**Troubleshooting**: Check `errorMessage` for details. Review your request parameters carefully. If the issue persists, [submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include the request parameters.

1001

Incorrect App Secret.

**Troubleshooting**: The App Key and App Secret do not match. Verify your [App Secret](https://console.nexconn.ai/agile/apps/km?_=1733475140548) in the Nexconn console.

1002

Invalid parameter. See the error message for details.

**Troubleshooting**: Check `errorMessage` for details. Review your request parameters carefully. If the issue persists, [submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include the request parameters.

1003

The open channel ID cannot be empty, or the \`minute\` parameter is invalid.

**Troubleshooting**: Ensure the open channel ID is provided and the `minute` parameter contains a valid value.

1004

Signature verification failed.

**Troubleshooting**: Ensure you are using the correct App Secret to generate the signature.

1005

A parameter exceeds the maximum allowed length. See the error message for details.

**Troubleshooting**: Check `errorMessage` to identify which parameter is too long, then shorten it accordingly.

1006

This app is offline and cannot accept requests.

**Troubleshooting**: Check the server domain in use. Verify the [domain settings](https://console.nexconn.ai/agile/apps/km?_=1733293327203) in the Nexconn console.

1007

Access denied due to IP restriction.

**Troubleshooting**: This method is restricted. See the error message for details.

1008

The API rate limit has been exceeded. Retry after a short delay.

**Troubleshooting**: Each API has its own rate limit. See [API rate limits](/platform-chat-api/prepare-to-use-api/chat-server-api-list.md) for details.

1009

The required service has not been enabled.

**Troubleshooting**: Enable the service in the Nexconn console as indicated by `errorMessage`, or [submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) to request access.

1010

The allowlist feature is not enabled. Cannot manage the user allowlist.

**Troubleshooting**: Enable the [direct channel user allowlist](https://console.nexconn.ai/agile/baseService/index?_=1733300279935) in the Nexconn console.

1011

The blocklist feature is not enabled. Cannot manage the user blocklist.

**Troubleshooting**: Enable the [direct channel user blocklist](https://console.nexconn.ai/agile/baseService/index?_=1733300279935) in the Nexconn console.

1015

The data to delete does not exist.

**Troubleshooting**: The keep-alive open channel ID specified for deletion does not exist.

1016

The number of keep-alive open channels exceeds the limit.

**Troubleshooting**: Contact your account manager if you need more keep-alive open channels.

1018

The real-time audio/video service is not enabled.

**Troubleshooting**: Enable the [audio/video service](https://console.nexconn.ai/agile/rtc/service/purchase_=1733366893419) in the Nexconn console.

1050

Internal service timeout.

**Troubleshooting**: The internal service response timed out (HTTP 504). Retry after a short delay.

2007

The registered user count has exceeded the limit.

**Troubleshooting**:

1. In development, up to 100 users can be registered. In production without a paid IM plan, 100 free registrations are available. [Delete users](https://console.nexconn.ai/agile/formwork/operation/user?_=1733368290908) in the Nexconn console to free up slots.
2. There is no user count limit when using the audio/video service alone. If you trigger this error while using only the audio/video service, check whether the service has been suspended due to overdue payment or other reasons.
3. Deactivated users still count toward the limit and are not visible in the Nexconn console. Reactivate the user first, then delete them.

20107

The direct channel blocklist has reached the maximum size.

**Troubleshooting**: The blocklist limit per user is 3,000 entries. [Remove users from the blocklist](/platform-chat-api/user/blacklist/remove-from-blacklist.md) to free up space.

20108

The direct channel allowlist has reached the maximum size.

**Troubleshooting**: The allowlist limit per user is 3,000 entries.

22201

The original message for Community Channel metadata does not exist.

**Troubleshooting**:

1. Community channel message history is stored for 7 days by default. Messages older than 7 days are deleted. Check `sentTime` to determine whether the message is more than 7 days old.
2. The original message may have been manually deleted. Verify using [Retrieve community channel message history](/web-imlib/ultragroup/get-history-message).

22202

The original message does not support metadata.

**Troubleshooting**: Set `canIncludeExpansion` to `true` when sending the message to enable metadata. See [Send and receive messages](/web-imlib/ultragroup/chat).

22203

The metadata has an invalid format.

**Troubleshooting**: The server failed to parse the metadata. It must be a valid JSON string, for example: `{"key":"value"}`.

22204

No permission to operate on community channel metadata.

**Troubleshooting**: The conversation type parameter is invalid. Verify that the conversation type value is `10`.

23407

The open channel mute allowlist has exceeded its limit. The mute allowlist set at creation supports up to 20 users in batch.

**Troubleshooting**:

1. The user allowlist for joining an open channel supports up to 5 user IDs per request. See [Add users to open channel allowlist](/platform-chat-api/open-channel/whitelist/add-to-user-whitelist.md).
2. The global mute allowlist for an open channel supports up to 20 user IDs. See [Add users to the open channel mute allowlist](/platform-chat-api/open-channel/mute/add-to-open-channel-ban-whitelist.md).

23410

The open channel does not exist.

**Troubleshooting**:

1. Open channels are automatically destroyed after a period of inactivity, and offline members are automatically removed. See [Open channel destruction](/platform-chat-api/open-channel/destroy-about.md) and [Leave an open channel](/web-imlib/chatroom/quit) for details.
2. You can also query or create open channels through your app server with [Get open channel information](/platform-chat-api/open-channel/get.md) or [Create an open channel](/platform-chat-api/open-channel/create.md).

23423

The number of metadata entries for the open channel has exceeded the limit.

**Troubleshooting**: The default limit is 100 metadata entries per open channel.

23424

No permission to modify an existing metadata entry in the open channel.

**Troubleshooting**: You cannot modify metadata set by another user. To override, use the force-set API. See [Open channel metadata](/web-imlib/chatroom/chatroomKV).

23426

The open channel custom metadata service is not enabled.

**Troubleshooting**: Make sure open channel metadata is enabled for the App Key. If it is unavailable, contact support.

23427

The open channel metadata entry does not exist.

**Troubleshooting**:

1. Verify the entry exists via [Query open channel metadata](/platform-chat-api/open-channel/kv-attribute/query-kv-entry.md).
2. Metadata is destroyed when the open channel is destroyed.
3. If `autoDelete` was set to `1` when the entry was created, the entry is automatically deleted when the user leaves the open channel.
4. If none of the above applies, [submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include your App Key, user ID, open channel ID, metadata KV, and the time the issue occurred.

23432

The open channel destruction time is invalid.

**Troubleshooting**: The destruction time (in minutes) must be an integer between 60 and 10080 (inclusive).

23433

The open channel destruction type is invalid.

**Troubleshooting**: Use a destruction type value defined in the documentation.

23434

No user ID provided for the open channel metadata operation.

**Troubleshooting**: A user ID must be provided when setting open channel metadata.

23435

The open channel already exists.

**Troubleshooting**: The open channel ID is already in use. No need to create it again.

23436

The open channel lifetime value is invalid.

**Troubleshooting**: For a scheduled-destruction open channel, the new lifetime must be greater than the time already elapsed since creation.

24353

Duplicate deactivation request.

**Troubleshooting**: The user ID has already been deactivated.

24354

Duplicate activation request.

**Troubleshooting**: The user ID is already active.

24356

User deactivation is in progress.

**Troubleshooting**: The deactivation process is already underway for this user ID.

24362

The key does not exist in the user extended profile.

**Troubleshooting**: Add the key in [Nexconn console > Chat > Chat settings > Users > User metadata](https://console.nexconn.ai/agile/im/messageTrusteeship/custom) before using it. See [Set user profile](/platform-chat-api/user/user-profiles/set-user-profiles.md).

24363

The number of user extended profile attributes has exceeded the maximum limit.

**Troubleshooting**: The maximum number of user extended profile attributes is 20.

24366

The user application ID was not found in the user managed service.

**Troubleshooting**: Set the user application ID first via [Set user profile](/platform-chat-api/user/user-profiles/set-user-profiles.md), then retry.

24369

The user profile hosting feature is not enabled.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include your App Key, user ID, and the time the issue occurred.

24401

The community channel feature is not enabled.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include your App Key, user ID, and the time the issue occurred.

24402

Community channel service error.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include your App Key, user ID, and the time the issue occurred.

24403

Invalid community channel parameter.

**Troubleshooting**: Review the community channel API documentation and verify the parameter format.

24404

Unknown community channel error.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include your App Key, user ID, and the time the issue occurred.

24406

The user is not a member of the community channel.

**Troubleshooting**: Check membership with [Check if the user is a member](/platform-chat-api/community-channel/query-member.md), then join the community channel if needed.

24408

The user is muted in the community channel.

**Troubleshooting**: See [Community channel mute service](/platform-chat-api/community-channel/mute/ban-service-about.md) for details.

24410

The community channel does not exist.

**Troubleshooting**: Create the community channel through your app server with [Create a community channel](/platform-chat-api/community-channel/create-community-channel.md).

24412

The user has reached the maximum number of community channels.

**Troubleshooting**: A user can join up to 100 community channels.

24413

The number of subchannels in the community channel has exceeded the limit.

**Troubleshooting**: Each community channel supports up to 50 subchannels by default.

24414

The community subchannel ID does not exist.

**Troubleshooting**:

1. Create the subchannel through your app server.
2. See [Create subchannel](/platform-chat-api/community-channel/create-channel.md) for Server API details.

24418

The number of member groups has exceeded the limit.

**Troubleshooting**: Each community channel supports up to 50 member groups by default.

24419

Duplicate member group ID.

**Troubleshooting**: Check for duplicate member group IDs in the request parameters.

24420

The member group does not exist.

**Troubleshooting**: Verify that the community channel ID and member group ID in your request are correct.

24421

The number of members in the member group has exceeded the limit.

**Troubleshooting**: Each member group supports up to 100 users by default.

24422

The number of member groups bound to the subchannel has exceeded the limit.

**Troubleshooting**: Each subchannel supports up to 10 member group bindings by default.

25101

Invalid parameter for deleting a message. Verify the parameters and try again.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include your App Key, user ID, and the time the issue occurred.

25102

Cloud retention is unavailable for direct, group, and system channels.

**Troubleshooting**: Contact support to verify the cloud retention service status.

25104

Unknown error.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include your App Key, user ID, and the time the issue occurred.

25107

The "Only allow deleting own messages" restriction is enabled. Users cannot delete messages sent by others.

**Troubleshooting**:

1. By default, the Chat SDK allows users to delete any message. When the "Only allow deleting own messages" setting is enabled, users can only delete their own messages. [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) to enable or disable this setting.
2. Deleting messages via the Server API is not subject to this restriction.

25404

Unauthorized operation. Only the channel owner can modify group channel permissions.

**Troubleshooting**: Use [Batch query group profiles](/platform-chat-api/group-channel/managing-channels/query-user-groups.md) to confirm the channel owner ID.

25405

Permission denied.

**Troubleshooting**: Use [Batch query group profiles](/platform-chat-api/group-channel/managing-channels/query-user-groups.md) to confirm the channel's permissions (`permissions` field).

25409

The group channel ID already exists.

**Troubleshooting**: The group channel has already been created. No need to create it again.

25410

The group channel ID does not exist.

**Troubleshooting**: Create the group channel as needed. See [Create a group channel](/platform-chat-api/group-channel/managing-channels/create-group.md).

25411

The group channel member count has exceeded the limit.

**Troubleshooting**:

1. Up to 30 users can be invited per request.
2. The maximum group channel size is 3,000 members.

25412

The user is already a member of the group channel.

**Troubleshooting**: The user has already joined the group. No further action is required.

25414

The group channel does not allow new members to join.

**Troubleshooting**: Use [Batch query group profiles](/platform-chat-api/group-channel/managing-channels/query-user-groups.md) to check the channel's join permissions (`permissions` field).

25415

The extended profile key does not exist.

**Troubleshooting**: Add the key in [Nexconn console > Chat > Chat settings > Group Channels > Channel metadata](https://console.nexconn.ai/agile/im/messageTrusteeship/customGroup).

25416

Query rate limit exceeded.

**Troubleshooting**: The group managed service query API has a default rate limit of 5 requests per second. This limit currently applies to the web client only.

25417

The channel owner cannot be kicked out or leave the group.

**Troubleshooting**: Use [Get specific group member info](/platform-chat-api/group-channel/managing-member-profiles/query-group-members.md) to confirm whether the user is the channel owner.

25418

The user is not a member of the group channel.

**Troubleshooting**: Use [Get specific group member info](/platform-chat-api/group-channel/managing-member-profiles/query-group-members.md) to confirm the user's membership status.

25419

The number of channel admins or followed users has exceeded the limit.

**Troubleshooting**:

1. Maximum channel admins: 20.
2. Maximum followed users per group: 200.
3. Maximum group channel size: 3,000.

25420

The user is not a channel admin.

**Troubleshooting**: Use Add group admin to assign the user as a channel admin if needed.

25421

No invitation request found for this group and user.

**Troubleshooting**:

1. Invitations are valid for 7 days only. Check whether the invitation has expired.
2. Re-send the invitation using [Invite users to join a group](/web-imlib/group/join-group#inviteUser).

25422

The batch query exceeds the limit.

**Troubleshooting**:

1. Maximum 20 group profiles per query.
2. Maximum 100 group members per query.

25423

The group channel name cannot be empty.

**Troubleshooting**: See [Create a group channel](/platform-chat-api/group-channel/managing-channels/create-group.md) for required parameters.

25424

Joining this group channel requires admin approval.

**Troubleshooting**: Use [Batch query group profiles](/platform-chat-api/group-channel/managing-channels/query-user-groups.md) to check the channel's join permissions (`permissions` field).

25425

The channel owner cannot be set as a channel admin.

**Troubleshooting**: Use [Get specific group member info](/platform-chat-api/group-channel/managing-member-profiles/query-group-members.md) to verify the user's role in the group.

25426

No permission to invite users to the group channel.

**Troubleshooting**:

1. Use [Batch query group profiles](/platform-chat-api/group-channel/managing-channels/query-user-groups.md) to check the channel's permissions (`permissions` field).
2. Use [Get specific group member info](/platform-chat-api/group-channel/managing-member-profiles/query-group-members.md) to verify the inviter's role.

25427

The invited user must accept the invitation before joining the group channel.

**Troubleshooting**: Use [Batch query group profiles](/platform-chat-api/group-channel/managing-channels/query-user-groups.md) to check the channel's join permissions (`permissions` field).

25428

The request has already been processed by another admin.

**Troubleshooting**: Handle this at the application level, for example by notifying the user that the request is no longer pending.

25429

Legacy groups do not support managed service APIs. Import the group first.

**Troubleshooting**: See Import group to migrate the group to managed service support.

25430

The group channel ID is invalid. It contains special characters.

**Troubleshooting**: Use only alphanumeric characters (letters and digits) in the group channel ID.

25432

Failed to parse the page token.

**Troubleshooting**: Verify that the page token is correct and was returned by the previous paginated request.

25460

The users are already friends. Operation is invalid.

**Troubleshooting**: Use [Get user friend list](/platform-chat-api/user/friend-profile/get-friend.md) to confirm the friendship status.

25461

The friend request requires the other user's approval before the friendship is established.

**Troubleshooting**: Friend request approval can be configured at two levels:

1. App Key level: Configure **Friend request preference** in **Nexconn console > Chat > Chat settings > Friend**.
2. User level: Use the client-side method [Set friend add permission](/web-imlib/user/friend-manager#setFriendAddPermission).

25462

Cannot add friend. You are on the target user's blocklist.

**Troubleshooting**: [Remove the user from the target's blocklist](/platform-chat-api/user/blacklist/remove-from-blacklist.md) if needed.

25463

Cannot add friend. You are not on the target user's allowlist.

**Troubleshooting**: The target user has enabled the allowlist feature. You must be added to their allowlist before sending a friend request. See [User allowlist service](/platform-chat-api/user/overview.md).

25464

Cannot add friend. The target user is on your blocklist.

**Troubleshooting**: [Remove the target user from your blocklist](/platform-chat-api/user/blacklist/remove-from-blacklist.md) first.

25465

Cannot add friend. The target user is not on your allowlist.

**Troubleshooting**: You have the allowlist feature enabled. Add the target user to your allowlist before sending a friend request. See [User allowlist service](/platform-chat-api/user/overview.md).

25466

The friend request does not exist or has expired.

**Troubleshooting**: Friend requests are valid for 7 days. Verify the user ID and check whether the request has expired.

25467

Your friend list has reached the maximum size.

**Troubleshooting**: The maximum friend count is 3,000. Use [Get friend list](/platform-chat-api/user/friend-profile/get-friend.md) to view the current count.

25468

The target user's friend list has reached the maximum size.

**Troubleshooting**: The maximum friend count is 3,000. Use [Get friend list](/platform-chat-api/user/friend-profile/get-friend.md) to view the target user's current count.

25469

This operation requires a friend relationship that does not exist.

**Troubleshooting**: Use [Check friendship](/platform-chat-api/user/friend-profile/check-friend.md) to verify the relationship.

25470

The number of friend custom attributes has exceeded the limit.

**Troubleshooting**: Up to 10 custom attributes are allowed per friendship.

25471

The target user does not accept friend requests.

**Troubleshooting**: See [Get friend add verification level](/platform-chat-api/user/friend-profile/get-friend-add-level.md) for details.

25472

The friend does not exist.

**Troubleshooting**: The user ID does not exist. [Register the user](/platform-chat-api/user/register.md) first.

25473

Cannot add yourself as a friend.

**Troubleshooting**:

1. For Server API calls, verify that the user ID and target ID are different.
2. For client SDK calls, verify that the target ID differs from the currently connected user's ID.

26001

Invalid request parameter for the user-level settings service.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include your App Key, user ID, and the specific API and parameters used.

26002

The client version is too low. A version sync is required. Contact support to enable the user-level settings switch.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) to enable the user-level settings switch.

26003

Internal service error.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) for assistance.

26020

The user presence subscription feature is not enabled.

**Troubleshooting**: Contact support to enable the client-side user presence subscription feature.

26021

The user has reached the maximum number of subscribers.

**Troubleshooting**: The maximum number of subscribers per user is 5,000.

26022

The user has reached the maximum number of subscriptions.

**Troubleshooting**: The maximum number of subscriptions per user is 5,000.

28400

The translation service is not enabled.

**Troubleshooting**: Contact support to enable the translation service.

28401

Translation failed.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) for assistance.

28402

Internal translation service error.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) for assistance.

28403

Missing required parameter for the translation service.

**Troubleshooting**: Verify that all required translation parameters are included.

28404

Invalid parameter for the translation service.

**Troubleshooting**: Verify that the translation parameter values are valid.

28405

Translation service quota exceeded.

**Troubleshooting**: Check your remaining translation quota.

28406

The translation content exceeds the maximum allowed length.

**Troubleshooting**: Reduce the translation content length and try again.

28407

The target language is not supported.

**Troubleshooting**: See [Supported languages and codes](/android-imlib/builtin-translation/supported-languages-and-codes) for the full list of supported languages.

29001

The \`stopReason\` field in the streaming pull response is not yet available. The stream has not finished.

**Troubleshooting**: Retry after a short delay.

29002

The stream does not exist.

**Troubleshooting**: Verify that the `messageUID` is correct.

29003

The streaming pull request timed out after 30 seconds with no data.

**Troubleshooting**: Stream resumption timed out. Initiate a new pull request.

29004

The stream was cut off after reaching the 30-minute limit.

**Troubleshooting**: Ensure the stream completes within 30 minutes.

29005

The stream was deleted due to content moderation failure.

**Troubleshooting**: If you have questions about the moderation result, [submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include your App Key, user ID, and the streaming message ID.

29006

The stream was cut off because the data exceeds 128 KB.

**Troubleshooting**: Streaming data larger than 128 KB is not supported. Split or compress the data before streaming.

29007

Internal streaming service error.

**Troubleshooting**: [Submit a support ticket](https://console.nexconn.ai/agile/formwork/ticket/create) and include your App Key, user ID, and the specific API and parameters used.
