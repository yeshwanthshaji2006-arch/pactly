# Built-in translation

The Nexconn Chat SDK provides built-in text translation, allowing users to translate message content into different languages without leaving your app. The translation service processes text messages on the server and returns the translated content. Access translation capabilities through `NCEngine.translateModule`.

Built-in translation provides the following capabilities:

* **User-level settings**: a user-level target language and an auto-translate preference.
* **Channel translation strategy**: a per-channel strategy that follows, enables, or disables auto-translate relative to the user-level setting, synced across devices.
* **Translation tasks**: batch translation of text messages, up to 10 items per request.
* **Events and results**: translation results and setting change events delivered through `TranslateHandler`.

## Enable built-in translation[​](#enable-built-in-translation "Direct link to Enable built-in translation")

Built-in translation is disabled by default. Enable the service in the Console before your app calls the translation APIs:

1. Log in to the [Nexconn Console](https://console.nexconn.ai/agile/im/service/config).

2. Open **Chat** > **Chat settings** > **Messages** > **Translation**.

3. Enable **Translation**.

   ![Enable built-in translation in the Console](/assets/images/enable-translation-842a1b4b90c525398241101ce8c7f665.png)

## Feature guides[​](#feature-guides "Direct link to Feature guides")

| Guide                                                                                              | Description                                                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [User-level settings](/chatsdk-web/builtin-translation/user-level-settings.md)                     | Set the user-level target language and auto-translate preference.        |
| [Channel translation strategy](/chatsdk-web/builtin-translation/channel-translation-strategy.md)   | Set per-channel translation strategies and receive strategy sync events. |
| [Submit translation tasks](/chatsdk-web/builtin-translation/translation-tasks.md)                  | Batch-translate text messages.                                           |
| [Events and results](/chatsdk-web/builtin-translation/translation-events-and-results.md)           | Listen for translation events and receive translation results.           |
| [Supported languages and codes](/chatsdk-web/builtin-translation/supported-languages-and-codes.md) | Supported languages and their language codes.                            |

## Billing and usage[​](#billing-and-usage "Direct link to Billing and usage")

Built-in translation is billed separately from your base plan, by translated characters, with a per-plan free allowance. Usage is charged daily. For billing rates, see [Pricing plans](/guides/realtime-chat/intro-chat/pricing-plans.md#built-in-translation-billing).
