# ChatUI for Web

ChatUI for Web is Nexconn's Web UI layer for Chat. It sits on **Nexconn Chat** and **Nexconn Engine** and provides channel lists, message lists, input areas, and related UI so you can ship chat experiences faster.

ChatUI for Web supports direct, group, and system channels. The UI is configurable and extensible, and it works alongside React, Vue, and other frameworks.

## Open source repository[​](#open-source-repository "Direct link to Open source repository")

ChatUI SDK for Web is open source. For source code, issue tracking, and contribution information, see the [Nexconn ChatUI Web GitHub repository](https://github.com/NexconnAI-Dev/nexconn-chatui-web).

## Why ChatUI[​](#why-chatui "Direct link to Why ChatUI")

ChatUI combines **feature switches**, **API-driven customization**, and **Web Components**.

* **Switches**: Toggle behaviors such as read receipts and connection status in the channel list via [ChatUICommand](https://docs.nexconn.ai/apidoc/nexconnchatui-web/latest/en_US/enums/ChatUICommand.html) and related APIs.
* **API extensions**: Adjust channel/message context menus and the input toolbar by cloning and writing back configuration objects.
* **Web Components**: UI is injected as custom elements; configure `isCustomElement` per your framework (see [Quickstart](/chatui-web/quickstart.md)).

![ChatUI for Web reference design](/assets/images/web-chatui-2b5ae63d1d44db80c96edadd5dacc3c6.png)

tip

The image is a reference design, not the full default ChatUI product. Search bars, channel filters, header extensions, and outer page chrome are implemented by your application.

## Capability matrix[​](#capability-matrix "Direct link to Capability matrix")

The matrix focuses on direct, group, and system channels. System channels are supported, but the built-in UI treats them as read-only: ChatUI shows the channel header and message list, hides the input area, and disables reply, forward, and multi-select actions.

| Capability            | Direct                                                              | Group                                                                                                                                                             | Service configuration                                                                                         |
| --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Image / GIF messages  | Yes                                                                 | Yes                                                                                                                                                               | None                                                                                                          |
| Short video messages  | Yes                                                                 | Yes                                                                                                                                                               | None                                                                                                          |
| Voice messages (send) | Not supported                                                       | Not supported                                                                                                                                                     | None                                                                                                          |
| File messages         | Yes                                                                 | Yes                                                                                                                                                               | None                                                                                                          |
| @mentions             | N/A                                                                 | Yes                                                                                                                                                               | None                                                                                                          |
| Cloud retention       | Yes                                                                 | Yes                                                                                                                                                               | Enabled by default                                                                                            |
| Typing indicator      | Yes                                                                 | No                                                                                                                                                                | None                                                                                                          |
| Forward messages      | Yes                                                                 | Yes                                                                                                                                                               | None                                                                                                          |
| Quote / reply         | Yes                                                                 | Yes                                                                                                                                                               | None                                                                                                          |
| Message reactions     | Opt in                                                              | Opt in                                                                                                                                                            | Enable `MESSAGE_REACTION_ENABLED` before `ready()`                                                            |
| Message editing       | Opt in                                                              | Opt in                                                                                                                                                            | Enable `MESSAGE_EDIT_ENABLED` before `ready()` and configure a positive SDK `messageModifiableMinutes` window |
| Read receipts         | Yes                                                                 | Yes                                                                                                                                                               | None                                                                                                          |
| Unread counts         | Yes                                                                 | Yes                                                                                                                                                               | None                                                                                                          |
| Message search        | No                                                                  | No                                                                                                                                                                | None                                                                                                          |
| Message metadata      | No                                                                  | No                                                                                                                                                                | None                                                                                                          |
| Pin channel           | Yes                                                                 | Yes                                                                                                                                                               | None                                                                                                          |
| Do not disturb        | Yes                                                                 | Yes                                                                                                                                                               | None                                                                                                          |
| User blocklist        | [Server-side](/platform-chat-api/user/blacklist/blacklist-about.md) | N/A                                                                                                                                                               | None                                                                                                          |
| User allowlist        | Server-side                                                         | N/A                                                                                                                                                               | None                                                                                                          |
| Mute user             | [Server-side](/platform-chat-api/user/block.md)                     | [Server-side](/platform-chat-api/group-channel/mute/gag-user.md)                                                                                                  | None                                                                                                          |
| Group member limit    | N/A                                                                 | 300 (default)                                                                                                                                                     | Raised to 1,000 on Starter or 3,000 on Pro above 10,000 MAU                                                   |
| How users join groups | Users under the App Key                                             | [Create group](/platform-chat-api/group-channel/managing-channels/create-group.md), [Join group](/platform-chat-api/group-channel/managing-members/join-group.md) | None                                                                                                          |
| History before join   | N/A                                                                 | Yes                                                                                                                                                               | Enable "history before join" where available                                                                  |
| Mute entire group     | N/A                                                                 | [Server-side](/platform-chat-api/group-channel/mute/ban-group.md)                                                                                                 | None                                                                                                          |
| Group mute allowlist  | N/A                                                                 | [Server-side](/platform-chat-api/group-channel/mute/add-to-group-ban-whitelist.md)                                                                                | None                                                                                                          |
| Ban user              | [Server-side](/platform-chat-api/user/block.md)                     | [Server-side](/platform-chat-api/user/block.md)                                                                                                                   | None                                                                                                          |
| Content moderation    | [Overview](/chatsdk-web/moderation/overview.md)                     | [Overview](/chatsdk-web/moderation/overview.md)                                                                                                                   | None                                                                                                          |

## Channel types[​](#channel-types "Direct link to Channel types")

ChatUI targets Nexconn Chat channel models, commonly **direct (1:1)**, **group**, and **system** channels.

### Direct channel[​](#direct-channel "Direct link to Direct channel")

One-to-one messaging between two users. Your app owns the social graph; Nexconn delivers messages and channel data.

### Group channel[​](#group-channel "Direct link to Group channel")

Multi-user messaging in one channel. Member display data comes from [ServiceHooks](https://docs.nexconn.ai/apidoc/nexconnchatui-web/latest/en_US/interfaces/ServiceHooks.html), while limits and policies come from your server-side configuration.

### System channel[​](#system-channel "Direct link to System channel")

ChatUI renders system channels in a one-to-one-style container for read-only system traffic. System channel display data comes from [ServiceHooks](https://docs.nexconn.ai/apidoc/nexconnchatui-web/latest/en_US/interfaces/ServiceHooks.html).

## Next steps[​](#next-steps "Direct link to Next steps")

* [Quickstart](/chatui-web/quickstart.md): Install packages, initialize ChatUI, connect, and mount the UI.
* [Hooks](/chatui-web/user/hooks.md): Provide user, group, system channel, and member data.
* [Channel management](/chatui-web/chat/manage-conversation.md): Open and delete channels.
