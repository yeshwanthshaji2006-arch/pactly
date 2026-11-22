# Initialize the SDK

Before you use any Chat SDK features, call the initialization method. Call it exactly once during the app lifecycle.

## Get your App Key[​](#get-your-app-key "Direct link to Get your App Key")

The **App Key** is the unique identifier for your app. You need a valid App Key to initialize the SDK. Find your App Key in the [Console](https://console.nexconn.ai/agile/apps/km).

Messages can only be exchanged between users with the same App Key.

## Initialize the SDK[​](#initialize-the-sdk-1 "Direct link to Initialize the SDK")

TypeScript

```ts
import { NCEngine } from '@nexconn/chat';

NCEngine.initialize({ appKey: '<Your-App-Key>' });

```

### Return value[​](#return-value "Direct link to Return value")

| Value  | Type   | Description                           |
| ------ | ------ | ------------------------------------- |
| `void` | `void` | The SDK is initialized synchronously. |

warning

Call `NCEngine.initialize` only once. Calling it multiple times may cause unexpected behavior.

## Configuration options[​](#configuration-options "Direct link to Configuration options")

You can pass additional configuration options during initialization:

| Parameter  | Type       | Required | Description                                       |
| ---------- | ---------- | -------- | ------------------------------------------------- |
| `appKey`   | `string`   | Yes      | Your App Key from the Console                     |
| `areaCode` | `AreaCode` | No       | Data center region. Defaults to `AreaCode.SG`.    |
| `logLevel` | `LogLevel` | No       | Log verbosity level. Defaults to `LogLevel.WARN`. |

## Example with a specific data center[​](#example-with-a-specific-data-center "Direct link to Example with a specific data center")

TypeScript

```ts
import { NCEngine, AreaCode, LogLevel } from '@nexconn/chat';

NCEngine.initialize({
  appKey: '<Your-App-Key>',
  areaCode: AreaCode.NA,
  logLevel: LogLevel.WARN,
});

```

## `AreaCode` values[​](#areacode-values "Direct link to areacode-values")

| Value         | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `AreaCode.SG` | Singapore data center (default)                                              |
| `AreaCode.BJ` | China (Beijing) data center                                                  |
| `AreaCode.NA` | North America data center                                                    |
| `AreaCode.SA` | Regional data center. Confirm whether `AreaCode.SA` matches your deployment. |
| `AreaCode.OM` | Oman data center                                                             |
