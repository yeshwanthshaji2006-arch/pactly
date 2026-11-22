# Join a group channel

Add one or more users to a group channel. This operation does not require approval — users are added directly.

## Request[​](#request "Direct link to Request")

**POST:** `https://`[Base URL](/platform-chat-api/prepare-to-use-api/base-url.md)`/v4/group-channel/join`

**Rate limit:** 100 per second

**Signature:** Required. See [API request signature](/platform-chat-api/prepare-to-use-api/auth.md).

## Request body[​](#request-body "Direct link to Request body")

Content type: `application/json`

| Parameter   | Type     | Required | Description                                                       |
| ----------- | -------- | -------- | ----------------------------------------------------------------- |
| `channelId` | `String` | Yes      | Group channel ID.                                                 |
| `userIds`   | `Array`  | Yes      | Array of user IDs to add to the group. Max 100 users per request. |

## Request example[​](#request-example "Direct link to Request example")

HTTP

```http
POST /v4/group-channel/join HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Nonce: 14314
Timestamp: 1408710653491
Signature: 45beb7cc7307889a8e711219a47b7cf6a5b000e8
Content-Type: application/json

{
    "channelId": "groupId1",
    "userIds": ["userId"]
}

```

## Response[​](#response "Direct link to Response")

| Field             | Type     | Description                                                                         |
| ----------------- | -------- | ----------------------------------------------------------------------------------- |
| `code`            | `Number` | Return code. `0` indicates success. See [Status codes](/platform-chat-api/code.md). |
| `channelId`       | `String` | Group channel ID.                                                                   |
| `name`            | `String` | Group name.                                                                         |
| `groupProfile`    | `JSON`   | Group basic information.                                                            |
| `groupExtProfile` | `JSON`   | Group extended information.                                                         |
| `permissions`     | `JSON`   | Group permission settings.                                                          |
| `owner`           | `String` | Channel owner's user ID.                                                            |
| `createdAt`       | `Number` | Timestamp when the group was created.                                               |
| `memberCount`     | `Number` | Number of channel members.                                                          |

## Response example[​](#response-example "Direct link to Response example")

HTTP

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
    "code": 0,
    "result": {
        "channelId": "groupId1",
        "createdAt": 1717717737377,
        "owner": "userId1",
        "name": "gName1",
        "extra": "{\"ext_key1\":\"value1\",\"ext_key2\":\"value2\"}",
        "memberCount": 10
    }
}

```
