# API request signature

Every Platform Chat API request must include a signature so the server can verify your application's identity.

The process works as follows:

1. Store your App Key and App Secret in your application server's authentication service.
2. When calling the API, include the required [HTTP headers](#http-headers). The `Signature` header is computed from your App Secret, a random nonce, and a timestamp.
3. The server performs the same computation and verifies the result matches.
4. Keep your App Secret safe. Never transmit it over the network or store it in untrusted locations (such as a browser).

## Get your App Key and App Secret[​](#get-your-app-key-and-app-secret "Direct link to Get your App Key and App Secret")

Obtain your App Key and App Secret from the [App Key page](https://console.nexconn.ai/agile/apps/km) in the Nexconn Console.

Record both values — you need them for every API request. The App Key is sent in every HTTP request header. The App Secret is used to compute the signature and must not be exposed.

## HTTP headers[​](#http-headers "Direct link to HTTP headers")

Include the following headers in every API request to authenticate with the server:

| Header name | Type     | Description                                                                             |
| ----------- | -------- | --------------------------------------------------------------------------------------- |
| `App-Key`   | `String` | Your App Key from the console.                                                          |
| `Nonce`     | `String` | A random string, up to 18 characters.                                                   |
| `Timestamp` | `String` | Unix timestamp in milliseconds (since January 1, 1970 00:00:00 UTC).                    |
| `Signature` | `String` | The computed data signature. See [Signature computation](#signature-computation) below. |

### (Optional) Add X-Request-ID[​](#optional-add-x-request-id "Direct link to (Optional) Add X-Request-ID")

We recommend including an `X-Request-ID` header to help with troubleshooting. The official Server SDKs add this header automatically, so no extra work is needed if you use them.

Server SDK links:

* [server-sdk-java (GitHub)](https://github.com/rongcloud/server-sdk-java)
* [server-sdk-php (GitHub)](https://github.com/rongcloud/server-sdk-php)
* [server-sdk-go (GitHub)](https://github.com/rongcloud/server-sdk-go/tree/v3)

To generate `X-Request-ID` yourself (max 36 characters):

**Java example:**

Java

```java
import java.util.UUID;

HttpURLConnection conn = getHttpURLConnection(config, uri);
conn.setRequestProperty("X-Request-ID", UUID.randomUUID().toString().replaceAll("\\-", ""));

```

**Go example:**

Go

```go
import "github.com/google/uuid"

func (client Client) getSignature() (nonce, timestamp, signature string) {
	nonceInt := rand.Int()
	nonce = strconv.Itoa(nonceInt)
	timestampMillis := time.Now().UnixMilli()
	timestamp = strconv.FormatInt(timestampMillis, 10)
	h := sha1.New()
	_, _ = io.WriteString(h, client.appSecret+nonce+timestamp)
	signature = fmt.Sprintf("%x", h.Sum(nil))
	return
}

func (client Client) fillHeader(req *httplib.BeegoHTTPRequest) string {
	requestId := uuid.New().String()
	nonce, timestamp, signature := client.getSignature()
	req.Header("App-Key", client.appKey)
	req.Header("Timestamp", timestamp)
	req.Header("Nonce", nonce)
	req.Header("Signature", signature)
	req.Header("Content-Type", "application/json")
	req.Header("User-Agent", USERAGENT)
	req.Header("X-Request-ID", requestId)
	return requestId
}

```

**PHP example:**

PHP

```php
private function create_guid()
{
    $charid = strtoupper(md5(uniqid(mt_rand(), true)));
    $uuid = substr($charid, 0, 8)
        . substr($charid, 8, 4)
        . substr($charid, 12, 4)
        . substr($charid, 16, 4)
        . substr($charid, 20, 12);
    return strtolower($uuid);
}
$header = [
    'App-Key:' . $appKey,
    'Nonce:' . $nonce,
    'Timestamp:' . $timeStamp,
    'Signature:' . $sign,
    'X-Request-ID:' . $this->create_guid()
];

```

note

Generate a new `X-Request-ID` for each request. If you don't include one, the server generates one and returns it in the response headers.

### Signature computation[​](#signature-computation "Direct link to Signature computation")

Compute the `Signature` header value on your App Server as follows:

1. Get the App Secret that corresponds to your App Key from the console.

2. Concatenate the following three strings in order — `App Secret` + `Nonce` + `Timestamp` — and compute the SHA1 hash of the result.

   * **App Secret** — corresponds to your App Key.
   * **Nonce** — random string.
   * **Timestamp** — Unix timestamp in milliseconds.

If the signature verification fails, the API returns HTTP status code `401`. For other status codes, see [Status codes](/platform-chat-api/code.md).

**PHP example:**

PHP

```php
srand((double)microtime()*1000000);

$appSecret = 'your-own-app-secret'; // Replace with your App Secret.
$nonce = rand();
$timestamp = time()*1000; // Milliseconds.

$signature = sha1($appSecret.$nonce.$timestamp);

```

### HTTP request example[​](#http-request-example "Direct link to HTTP request example")

The following example shows a complete HTTP request with all required headers:

HTTP

```http
POST /v4/auth/access-token/issue HTTP/1.1
Host: api.sg-light-api.com
App-Key: your-own-app-key
Nonce: 14314
Timestamp: 1408710653000
Signature: 30be0bbca9c9b2e27578701e9fda2358a814c88f
Content-Type: application/json

{
  "userId": "jlk456j5",
  "name": "Ironman",
  "avatarUrl": "http://abc.com/myportrait.jpg"
}

```
