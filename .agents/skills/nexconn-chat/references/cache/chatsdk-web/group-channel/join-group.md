# Join a group

Join an existing group channel.

## Join a group[​](#join-group "Direct link to Join a group")

TypeScript

```ts
import { GroupChannel } from '@nexconn/chat';

const channel = new GroupChannel('<group-id>');
const { code } = await channel.join();
if (code === 0) {
  console.log('Joined group');
} else {
  console.log('Join failed. Code:', code);
}

```

info

* After joining, group messages will appear in your channel list and you will receive real-time messages from the group.
* This method is only available for groups that have the "allow anyone to join" setting enabled. Groups with approval-required joining use a separate invitation/application flow.
