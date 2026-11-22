# Create user channel tags

Create channel tags for a specified user. Tags are the foundation for channel grouping. You must create tags before assigning them to channels.

tip

* Each user can create up to 20 channel tags.
* Each tag can contain up to 1,000 channels.
* Tag ID must be unique per user, max 10 characters.
* Tag name: max 15 characters.

## Request[​](#request "Direct link to Request")

**POST:** `https://`[Base URL](/platform-chat-api/prepare-to-use-api/base-url.md)`/v4/user/channel/tag/add`

**Rate limit:** 100 per second

**Signature:** Required. See [API request signature](/platform-chat-api/prepare-to-use-api/auth.md).

## Request body[​](#request-body "Direct link to Request body")

Content type: `application/json`

| Parameter        | Type       | Required | Description                                                            |
| ---------------- | ---------- | -------- | ---------------------------------------------------------------------- |
| `userId`         | `String`   | Yes      | The user ID.                                                           |
| `tags`           | `Object[]` | Yes      | Tag list. Max 20 tags per request.                                     |
| `tags[].tagId`   | `String`   | Yes      | Tag ID. Unique identifier, max 10 characters. Must be unique per user. |
| `tags[].tagName` | `String`   | Yes      | Tag display name, max 15 characters.                                   |

## Request example[​](#request-example "Direct link to Request example")

HTTP

```http
POST /v4/user/channel/tag/add HTTP/1.1
Host: api.sg-light-api.com
App-Key: uwd1c0sxdlx2
Nonce: 14314
Timestamp: 1408710653491
Signature: 45beb7cc7307889a8e711219a47b7cf6a5b000e8
Content-Type: application/json

{
    "userId": "testUserId",
    "tags": [
        {
            "tagId": "tag1",
            "tagName": "Tag 1"
        },
        {
            "tagId": "tag2",
            "tagName": "Tag 2"
        }
    ]
}

```

## Response[​](#response "Direct link to Response")

| Field  | Type     | Description                         |
| ------ | -------- | ----------------------------------- |
| `code` | `Number` | Return code. `0` indicates success. |

## Response example[​](#response-example "Direct link to Response example")

HTTP

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"code":0}

```
