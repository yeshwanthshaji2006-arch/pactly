# Base URL

When you create an app in the console, you select a **data center** region based on where your users are located. Each region uses a separate API base URL. Your App Server must use the base URL that matches your app's data center — otherwise, API requests will fail.

tip

* To prevent App Secret leaks, always call the Platform Chat API from your App Server. Never call it directly from a client app.
* Avoid using persistent HTTP connections (KeepAlive). If you must use them, set the idle timeout below 55 seconds and limit reuse to fewer than 80 requests per connection. **Switch to a new connection after 55 seconds idle or 80 reuses.** Using the same connection indefinitely causes load balancing to become ineffective and interferes with failover.

## API base URLs[​](#api-base-urls "Direct link to API base URLs")

Use the base URL that matches your global data center region:

* **Singapore:** `api.sg-light-api.com` (primary), `api-b.sg-light-api.com` (backup)
* **North America:** `api.us-light-api.com` (primary), `api-b.us-light-api.com` (backup)
* **Saudi Arabia:** `api.sau-light-api.com` (primary), `api-b.sau-light-api.com` (backup)

important

Apps using global data centers must also configure the client SDK's data center address.

### Domain failover best practices[​](#domain-failover-best-practices "Direct link to Domain failover best practices")

Relying on a single API base URL can lead to latency when the CDN provider has issues. Each region provides a primary and backup domain. Implement the following failover logic:

1. Store the current API domain in server memory or a configuration file (for example, `api.sg-light-api.com`).
2. When a response times out (recommended threshold: 5 seconds) or returns an unexpected HTTP status code, trigger a domain switch.
3. Immediately switch to the backup domain (for example, `api-b.sg-light-api.com`).
4. Update the stored domain record.
