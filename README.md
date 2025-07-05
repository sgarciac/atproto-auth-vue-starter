This is a template starter project for web applications that integrate with the [ATProto](https://atproto.com/). It targets
the [Cloudflare](https://www.cloudflare.com) serverless platform.

See the [online demo](https://atproto-auth-vue-starter.pouletfrit.workers.dev/)

Find me at [@sergio.bsky.col.social](https://bsky.app/profile/sergio.bsky.col.social).

## Features

- Can be deployed on [Cloudflare's free plan](https://www.cloudflare.com/en-ca/plans/free/).
- Supports [ATProto's Oauth](https://atproto.com/specs/oauth) authentication flow (using the [BFF pattern](https://auth0.com/blog/the-backend-for-frontend-pattern-bff/)).
- Inspired by the [statusphere](https://atproto.com/guides/applications).

## Tech Stack

- [Typescript](https://www.typescriptlang.org/)
- [Blusky's official ATProto libraries](https://github.com/bluesky-social/atproto)
- [Cloudlfare KV](https://developers.cloudflare.com/kv/) for oauth dpop storage.
- [Vue](https://vuejs.org/)
- [Tailwind](https://tailwindcss.com/)

# Quickstart

You need to have [nodejs](https://nodejs.org/en) installed (version v22.17.0 or newer) and a [cloudflare](https://www.cloudflare.com/en-ca/) account. The free plan is enough.

Steps:

1. Fork the repository and clone it locally
2. Optionally, modify the name of the project in the `package.json` and `wrangler.toml` files.
3. Run `npm install` inside the project.
4. Run `npm run init-dpop-session-store`. **This will ask you to login to cloudflare and authorize wrangler**.
   Once you do this, you should see something like the following:

   ```sh
   Resource location: remote
   🌀 Creating namespace with title "DPOP_SESSION_STORE"
   ✨ Success!
   Add the following to your configuration file in your kv_namespaces array:
   [[kv_namespaces]]
   binding = "DPOP_SESSION_STORE"
   id = "cbdf96f877404257993abf9fc80ca5cd"
   ```

   Follow the instructions and copy the last three lines to the end of your `wrangler.toml` file.

5. Run `npm run init-dpop-state-store` and repeat the past step (**notice its not the same name that the one in the previous step**) and, again, copy the three lines to the end of your `wrangler.toml` file.
6. Verify that your config.toml looks like this:

   ```toml
   name = "atproto-auth-vue-starter"
   main = "server/index.ts"
   compatibility_date = "2025-07-05"
   compatibility_flags = ["nodejs_compat"]
   assets = { binding = "ASSETS" , not_found_handling = "single-page-application", run_worker_first = ["/auth/*", "/api/*"]}

   [[kv_namespaces]]
   binding = "DPOP_SESSION_STORE"
   id = "...."

   [[kv_namespaces]]
   binding = "DPOP_STATE_STORE"
   id = "...."
   ```

7. Run `cp .dev.vars.template .dev.vars` to initialize a local secret.
8. Run `npm run preview`
9. Visit `http://127.0.0.1:8787`
10. Profit!

# Deploy

1. Run `npm run deploy`. This will create the [cloudflare worker](https://workers.cloudflare.com/), deploy your code and
   it will give you the project url
2. You still need to set a `SECRET` and a `PRIVATE_KEY` secret variables in the workers project! You can generate random ones using the provided generator: `node node generate-secrets.js` and set them in your worker either via the cloudflare dashboard, or using wrangler. To use wrangler, inside your project, create a file with the generated `SECRET` and `PRIVATE_JWT`, such as:

```
SECRET=Uc81EC8F3ZH6adV-j94ljsw2lDIfboQ0qkIGUBx-kW8
PRIVATE_JWK={"kty":"EC","kid":"wIi7rjHi1SY","use":"sig","crv":"P-256","x":"nVLyPweKOkNX9_00vJaKQ8HBJNypoW01i1Boz-77aG0","y":"9sN1l__cCBeb4MmprhXER5G7gQZOyM9tc9RyJUsUp2k","d":"L6vKXFcKvxU1Gsw337L_a2C4Hbcph7Xq_WVnT7P0ui8"}
```

Supposing your file is named `secrets`, execute: `npm exec wrangler bulk ./secrets`

```sh
❯ npm exec wrangler secret bulk ./secrets

 ⛅️ wrangler 4.23.0 (update available 4.24.3)
─────────────────────────────────────────────
🌀 Creating the secrets for the Worker "atproto-auth-vue-starter"
✨ Successfully created secret for key: SECRET
✨ Successfully created secret for key: PRIVATE_JWK

Finished processing secrets file:
✨ 2 secrets successfully uploaded
```

(Don't forget to delete the secrets file!)
