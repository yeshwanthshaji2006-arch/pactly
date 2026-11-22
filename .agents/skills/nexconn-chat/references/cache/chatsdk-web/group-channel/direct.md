# Send targeted messages

Send a message to specific members within a group channel. Targeted messages are only delivered to the specified recipients, not to all group members.

## Send a targeted message[​](#send-a-targeted-message "Direct link to Send a targeted message")

Use the `directedUserIds` field in `SendMessageParams` to specify recipients:

TypeScript

```ts
import { GroupChannel, SendTextMessageParams } from '@nexconn/chat';

const channel = new GroupChannel('<group-id>');

const params = new SendTextMessageParams({ text: 'This message is for selected members only' });
params.directedUserIds = ['user1', 'user2']; // Only these users receive the message
const { code, data } = await channel.sendMessage(params);
if (code === 0) {
  console.log('Targeted message sent:', data);
} else {
  console.log('Send failed. Code:', code);
}

```

### Parameters (`SendTextMessageParams`)[​](#parameters-sendtextmessageparams "Direct link to parameters-sendtextmessageparams")

| Property             | Type                 | Required | Description                                                               |
| -------------------- | -------------------- | -------- | ------------------------------------------------------------------------- |
| `text` (constructor) | `TextMessageContent` | Yes      | The message text content                                                  |
| `directedUserIds`    | `string[]`           | No       | Array of user IDs who should receive the message. Set after construction. |

info

* Targeted messages are stored in the sender's and recipients' message history only.
* Other group members do not see the message and their unread count is not affected.
* This feature is useful for admin announcements to specific users or private notifications within a group.
