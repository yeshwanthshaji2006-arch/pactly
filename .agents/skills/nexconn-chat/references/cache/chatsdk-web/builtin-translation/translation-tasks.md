# Submit translation tasks

Translation tasks are submitted in batches of up to 10 items. For supported languages, see [Supported languages and codes](/chatsdk-web/builtin-translation/supported-languages-and-codes.md). Batch translation requests do not return translated content directly — the translated content is delivered asynchronously via `TranslateHandler`. See [Events and results](/chatsdk-web/builtin-translation/translation-events-and-results.md).

## Translate messages[​](#translate-messages "Direct link to Translate messages")

TypeScript

```ts
import { NCEngine, TextMessageContent, TranslateMessageParam } from '@nexconn/chat';

// Create a translation request for an existing message
const param = new TranslateMessageParam(
  message.messageId,    // messageId: the message identifier
  'auto',               // sourceLanguage: 'auto' to detect automatically
  'en',                 // targetLanguage: override user default (optional)
  (message.content as TextMessageContent).text, // text: original text on Web
);

const { isOk, code } = await NCEngine.translateModule.translateMessages({
  list: [param],
  force: false, // Re-translate even if already translated
});
if (isOk) {
  console.log('Translation request submitted');
} else {
  console.log('Translation failed. Code:', code);
}

```

info

The `Promise` returned by `translateMessages` only indicates whether the request was accepted. The actual translated content is delivered asynchronously via `TranslateHandler` **`onTranslationCompleted`**.

### Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Type                      | Required | Description                                                                                  |
| --------- | ------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `list`    | `TranslateMessageParam[]` | Yes      | Array of translation request descriptors (max 10 items)                                      |
| `force`   | `boolean`                 | No       | Re-translate messages that already have a translation. Default: `false`.                     |
| `mode`    | `TranslateMode`           | No       | Translation mode. Currently only `TranslateMode.MECHANICAL` is supported (also the default). |

info

On Web, the `text` argument of each `TranslateMessageParam` is required: if any item in `list` omits it, the whole request fails parameter validation with `TRANSLATION_PARAMS_TYPE_INVALID` (35060). Electron is the exception — the message content is read from the local database, so `text` is not required there.

## Translate texts[​](#translate-texts "Direct link to Translate texts")

Translates raw text strings that are not tied to a message. Results are also delivered asynchronously via `TranslateHandler` **`onTranslationCompleted`**, with `sourceType` set to `TranslateSourceType.CUSTOM_TEXT`. See [Events and results](/chatsdk-web/builtin-translation/translation-events-and-results.md).

TypeScript

```ts
import { NCEngine, TranslateTextParam } from '@nexconn/chat';

// Create a translation request for a raw text string
const textParam = new TranslateTextParam(
  'Hello, how are you?', // text: the raw text to translate
  'auto',                // sourceLanguage: 'auto' to detect automatically (optional)
  'zh',                  // targetLanguage: override user default (optional)
);

const { isOk, code } = await NCEngine.translateModule.translateTexts({
  list: [textParam],
});
if (isOk) {
  console.log('Translation request submitted');
} else {
  console.log('Translation failed. Code:', code);
}

```

### Parameters[​](#parameters-1 "Direct link to Parameters")

| Parameter | Type                   | Required | Description                                                                                  |
| --------- | ---------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `list`    | `TranslateTextParam[]` | Yes      | Array of text translation descriptors (max 10 items)                                         |
| `mode`    | `TranslateMode`        | No       | Translation mode. Currently only `TranslateMode.MECHANICAL` is supported (also the default). |

## Translation modes[​](#translation-modes "Direct link to Translation modes")

`TranslateMode` values accepted by the `mode` parameter of `translateMessages` and `translateTexts`:

| Enum value                  | Numeric value | Description                                 |
| --------------------------- | ------------- | ------------------------------------------- |
| `TranslateMode.MECHANICAL`  | `0`           | Mechanical translation (default)            |
| `TranslateMode.INTELLIGENT` | `1`           | Intelligent translation (not supported yet) |

Currently only `TranslateMode.MECHANICAL` is supported; `TranslateMode.INTELLIGENT` is not supported yet.
