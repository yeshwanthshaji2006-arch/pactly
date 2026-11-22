# Translation events and results

Translation results and setting change events are delivered through `TranslateHandler`. Register a handler to receive them.

## Listen for translation events[​](#listen-for-translation-events "Direct link to Listen for translation events")

TypeScript

```ts
import { NCEngine, TranslateHandler } from '@nexconn/chat';

NCEngine.addTranslateHandler('trans-handler', new TranslateHandler({
  onTranslationCompleted({ results }) {
    console.log('Translation finished:', results);
  },
  onAutoTranslateStateChanged({ isEnabled }) {
    console.log('Auto-translate state changed:', isEnabled);
  },
  onTranslationLanguageChanged({ language }) {
    console.log('Translation language changed to:', language);
  },
}));

```

## Remove the handler[​](#remove-the-handler "Direct link to Remove the handler")

TypeScript

```ts
NCEngine.removeTranslateHandler('trans-handler');

```

## Translation result payload[​](#translation-result-payload "Direct link to Translation result payload")

`onTranslationCompleted` delivers an array of `TranslateResult` objects in `event.results`. Each item contains:

| Field           | Type                  | Description                                                                                                                                                                              |
| --------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identifier`    | `string`              | Identifier for matching the result to the request: the message identifier passed to `TranslateMessageParam`, or the identifier generated from the source text of a `TranslateTextParam`. |
| `sourceType`    | `TranslateSourceType` | Whether the translated content came from a message or custom text.                                                                                                                       |
| `code`          | `number`              | Result code for this item; `0` indicates success.                                                                                                                                        |
| `translateInfo` | `TranslateInfo`       | Translated text, target language, and status. Available when the item succeeds.                                                                                                          |

### `TranslateSourceType` values[​](#translatesourcetype-values "Direct link to translatesourcetype-values")

| Enum value                        | Numeric value | Description                                           |
| --------------------------------- | ------------- | ----------------------------------------------------- |
| `TranslateSourceType.MESSAGE`     | `0`           | The translated content is attached to a chat message. |
| `TranslateSourceType.CUSTOM_TEXT` | `1`           | The translated content is a custom text string.       |

### `TranslateInfo` fields[​](#translateinfo-fields "Direct link to translateinfo-fields")

| Field            | Type              | Description                                    |
| ---------------- | ----------------- | ---------------------------------------------- |
| `targetLanguage` | `string`          | The target language used for this translation. |
| `translatedText` | `string`          | The translated text.                           |
| `status`         | `TranslateStatus` | The translation status.                        |

### `TranslateStatus` values[​](#translatestatus-values "Direct link to translatestatus-values")

| Enum value                    | Numeric value | Description           |
| ----------------------------- | ------------- | --------------------- |
| `TranslateStatus.NONE`        | `0`           | Not translated        |
| `TranslateStatus.TRANSLATING` | `1`           | Translating           |
| `TranslateStatus.SUCCESS`     | `2`           | Translation succeeded |
| `TranslateStatus.FAILED`      | `3`           | Translation failed    |

### Example: read translation results[​](#example-read-translation-results "Direct link to Example: read translation results")

TypeScript

```ts
import { NCEngine, TranslateHandler, TranslateSourceType } from '@nexconn/chat';

NCEngine.addTranslateHandler('trans-handler', new TranslateHandler({
  onTranslationCompleted({ results }) {
    results.forEach((result) => {
      if (result.code === 0 && result.translateInfo) {
        if (result.sourceType === TranslateSourceType.MESSAGE) {
          // Result of a translateMessages request; identifier is the message identifier
          console.log('Message translated:', result.identifier, '->', result.translateInfo.translatedText);
        } else {
          // Result of a translateTexts request
          console.log('Text translated:', result.translateInfo.translatedText);
        }
      } else {
        console.log('Translation failed for', result.identifier, 'code:', result.code);
      }
    });
  },
}));

```
