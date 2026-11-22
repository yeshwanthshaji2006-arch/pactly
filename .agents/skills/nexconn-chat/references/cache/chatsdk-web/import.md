# Import the SDK

## Browser compatibility[​](#summary "Direct link to Browser compatibility")

| Chrome | Firefox | Safari | IE            | Edge |
| ------ | ------- | ------ | ------------- | ---- |
| ✔️     | ✔️      | ✔️     | Not supported | ✔️   |

Since `26.5.1`, the ESM and CommonJS builds target ES2015. Use a browser that supports ES2015, or configure your application's transpilation and polyfills for older environments.

## Import the SDK[​](#import "Direct link to Import the SDK")

tip

The Chat SDK provides full TypeScript support. We recommend TypeScript for better type safety and maintainability.

**NPM (recommended)**

info

The `@nexconn/engine` package provides the core capabilities used by the Chat SDK. Keep it on the same version as `@nexconn/chat`.

1. Install the packages:

   bash

   ```bash
   npm install @nexconn/engine@latest @nexconn/chat@latest -S

   ```

2. Import the modules:

   TypeScript

   ```ts
   import {
     NCEngine,
     DirectChannel,
     GroupChannel,
     OpenChannel,
     CommunityChannel,
     CommunitySubChannel,
     MessageType,
     TextMessageContent,
     Message,
   } from '@nexconn/chat';

   ```

The npm packages provide both ESM and CommonJS entry points. Use named ESM imports with a bundler that supports tree shaking to remove unused SDK code.
