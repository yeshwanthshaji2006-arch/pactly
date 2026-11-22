# Register a user

Clients must provide an access token when connecting to the Nexconn messaging service. The access token is the user's unique identity credential in the Nexconn system — required for both **IM** and **RTC** services. Obtaining an access token registers the user in the Nexconn system.

Before you start, we recommend reading the [User overview](/platform-chat-api/user/overview.md) to understand user management APIs, services, and configuration.

## Get an access token[​](#get-an-access-token "Direct link to Get an access token")

Client SDKs do not provide an API for obtaining access tokens. You must integrate the Nexconn Server API for token issuance on your app server and implement the token acquisition logic.

After successfully obtaining a token, your app server distributes it to the client. The client uses the token when connecting to Nexconn. Tokens remain valid until their expiration. For details on token expiration, see [Expire access tokens](/platform-chat-api/user/expire.md).

The same user ID can obtain tokens multiple times. All valid tokens can be used to connect. Use the same API to re-obtain a token for an existing user ID.

danger

If you refresh the App Secret in the console, all existing tokens under that App Key become invalid. Use the new App Secret to generate API signatures and re-obtain tokens.

### Request method[​](#request-method "Direct link to Request method")

**POST**: `https://`[Base URL](/platform-chat-api/prepare-to-use-api/base-url.md)`/v4/auth/access-token/issue`

**Signature required**: All server API requests require signature verification. See [API request signature](/platform-chat-api/prepare-to-use-api/auth.md).

**Rate limit**: 200 requests per second

### Request body[​](#request-body "Direct link to Request body")

The request body is in `application/json` format and supports the following parameters:

The `name` and `avatarUrl` provided when obtaining a token are used only for mobile push notifications. To update these later, use the [Update user info](/platform-chat-api/user/modify.md) API. Re-obtaining a token with new values overwrites the existing name and avatar data.

| Parameter   | Type     | Required | Description                                                                                                                       |
| ----------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `userId`    | `String` | Yes      | App-defined user ID used to exchange for an access token. Supports uppercase and lowercase letters and numbers. Maximum 64 bytes. |
| `name`      | `String` | Yes      | User name for push notifications. Maximum 64 characters.                                                                          |
| `avatarUrl` | `String` | No       | User avatar URI. Maximum 1024 bytes.                                                                                              |

tip

* For direct channel messaging, only the `userId` is needed to identify the recipient. For security, avoid using sequential user IDs to prevent malicious exploitation.

### Request example[​](#request-example "Direct link to Request example")

HTTP

```http
POST /v4/auth/access-token/issue HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Nonce: 14314
Timestamp: 1408710653491
Signature: xxxxxxxxxxxxxxxx
X-Request-ID: xxxxxx-xxxxxxx-xxxxxx-xxxxxx
Content-Type: application/json

{
   "userId": "jlk456j5",
   "name": "name",
   "avatarUrl": "http://example.com/avatar.png"
}

```

### Response[​](#response "Direct link to Response")

The response body contains a JSON object with the following structure:

| Field                | Type     | Description                                                                                                                                             |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`               | `Number` | Status code. `0` indicates success.                                                                                                                     |
| `result`             | `Object` | Response data.                                                                                                                                          |
| `result.accessToken` | `String` | The user's access token. Maximum 256 bytes. Can be stored in the app. The token contains dynamic navigation addresses — no developer processing needed. |
| `result.userId`      | `String` | The user ID provided in the request.                                                                                                                    |

### Response example[​](#response-example "Direct link to Response example")

HTTP

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
    "code": 0,
    "result": {
        "userId": "jlk456j5",
        "accessToken": "7FDmy0Fou41r+A6H8VODu233zkQsbE8eVSFdUMVanNvRnyX1OnFGGw+l486X9KV6ty0gpZxRn8aiuvU8+3VfSzwM8cj754Iz"
    }
}

```

## Using access tokens[​](#using-access-tokens "Direct link to Using access tokens")

Nexconn does not manage any app user information. User registration only requires exchanging a user ID for an access token.

Your app client should handle token expiration when establishing IM connections and request a new token from your app server when needed.

### First connection[​](#first-connection "Direct link to First connection")

After obtaining a token, optionally save it locally for the current user:

<!-- -->

### Subsequent connections[​](#subsequent-connections "Direct link to Subsequent connections")

On later logins, skip the Nexconn server request. Your app server provides the previously saved token directly.

tip

* Implement retry logic to handle token expiration by requesting a new token from your server.
* Tokens are valid indefinitely by default. You can modify this in the console.
* Refreshing the App Secret or expiring tokens invalidates existing tokens.

<!-- -->

For auto-login apps, you can store the token locally (ensure secure local storage) and connect directly.
