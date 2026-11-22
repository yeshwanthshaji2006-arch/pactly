# Connect

Establish a connection to the Nexconn chat server to start using messaging features.

## Prerequisites[​](#prerequisites "Direct link to Prerequisites")

* The SDK is initialized. See [Initialize](/chatsdk-web/init.md).
* You have obtained a valid access token for the user. See the Server API documentation for [User Registration](/platform-chat-api/user/register.md).

## Get an access token[​](#get-an-access-token "Direct link to Get an access token")

The client SDK does not provide an API to generate tokens. Your app server must call the Server API to register a user and obtain an access token.

The access token is a unique credential for a user. The same user ID can request multiple tokens, and all valid tokens can be used to connect.

## Connect to the server[​](#connect-to-the-server "Direct link to Connect to the server")

Call `NCEngine.connect` with the user's access token. You only need to call `connect` once per app lifecycle — the SDK handles reconnection automatically.

TypeScript

```ts
NCEngine.connect({ token: '<Your-Token>' }).then((res) => {
  if (res.isOk) {
    console.log('Connected. User ID:', res.data.userId);
  } else {
    console.warn('Connection failed. Code:', res.code, res.msg);
  }
});

```

### Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Type     | Required | Description                                          |
| --------- | -------- | -------- | ---------------------------------------------------- |
| `token`   | `string` | Yes      | The user's access token obtained from the Server API |

### Return value[​](#return-value "Direct link to Return value")

`NCEngine.connect()` returns `Promise<NCResult<ConnectResult>>`.

| Field  | Type                         | Description                                                   |
| ------ | ---------------------------- | ------------------------------------------------------------- |
| `isOk` | `boolean`                    | Whether the connection succeeded. Equivalent to `code === 0`. |
| `code` | `number`                     | Status code. `0` means success.                               |
| `data` | `ConnectResult \| undefined` | Returned data when the connection succeeds.                   |

### `ConnectResult`[​](#connectresult "Direct link to connectresult")

| Field    | Type     | Description             |
| -------- | -------- | ----------------------- |
| `userId` | `string` | The connected user's ID |

warning

All business APIs (channels, messages, etc.) require a successful connection. Call them only after `connect` resolves with `isOk === true`.

## Connection best practices[​](#connection-best-practices "Direct link to Connection best practices")

* Call `connect` only once. The SDK's built-in reconnection mechanism handles disconnections automatically.
* Register event listeners before calling `connect` to avoid missing events during connection setup.
* Store the access token securely on the client side. Avoid exposing it in logs or URLs.
