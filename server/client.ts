import { WebcryptoKey } from "@atproto/jwk-webcrypto";
import { getKey, getPublicKeyJwk } from "./jwk";
import {
  Key,
  OAuthClient,
  type OAuthClientMetadataInput,
} from "@atproto/oauth-client";
import {
  AtprotoDohHandleResolver,
  CachedHandleResolver,
} from "@atproto-labs/handle-resolver";

const OAUTH_SCOPE = "atproto transition:generic";
import { SessionStore, StateStore, toDpopKeyStore } from "./store";

/**
 * Creates and configures an OAuth client for AT Protocol authentication
 */
export async function getClient(req: Request, env: Env) {
  const dohResolver = new AtprotoDohHandleResolver({
    dohEndpoint: "https://cloudflare-dns.com/dns-query",
  });

  // TODO: this is not really caching anything here as this only lives
  // the time of the request. We can no really keep this in memory either,
  // we should use a persistent cache like KV or Durable Objects.
  const cachedResolver = new CachedHandleResolver(dohResolver);

  const rootURL = getRootUrl(req);

  const client = new OAuthClient({
    handleResolver: cachedResolver,
    responseMode: "query",
    clientMetadata: await getMetadata(req, env),
    runtimeImplementation: {
      /**
       * Creates cryptographic keys for OAuth operations
       */
      createKey(algs: string[]): Promise<Key> {
        return WebcryptoKey.generate(algs, undefined, {
          extractable: true,
        });
      },

      /**
       * Generates n cryptographically secure random values
       */
      getRandomValues(n: number): Uint8Array | PromiseLike<Uint8Array> {
        return crypto.getRandomValues(new Uint8Array(n));
      },

      /**
       * Computes cryptographic digest of data
       * @param bytes - Data to hash
       * @param algorithm - Hash algorithm specification, SHA256 is required
       */
      async digest(
        bytes: Uint8Array,
        algorithm: { name: string }
      ): Promise<Uint8Array> {
        // sha256 is required. Unsupported algorithms should throw an error.
        if (algorithm.name.startsWith("sha")) {
          const subtleAlgo = `SHA-${algorithm.name.slice(3)}`;
          const buffer = await crypto.subtle.digest(subtleAlgo, bytes);
          return new Uint8Array(buffer);
        }
        throw new TypeError(`Unsupported algorithm: ${algorithm.name}`);
      },
    },
    stateStore: toDpopKeyStore(new StateStore(env)),
    sessionStore: toDpopKeyStore(new SessionStore(env)),
    keyset: isLocalDev(rootURL) ? [] : [await getKey(env)],
  });
  return client;
}

/**
 * Generates the OAuth client metadata for AT Protocol authentication
 */
export async function getMetadata(
  req: Request,
  env: Env
): Promise<OAuthClientMetadataInput> {
  const enc = encodeURIComponent;
  const rootURL = getRootUrl(req);
  if (isLocalDev(rootURL)) {
    return {
      client_id: `http://localhost?redirect_uri=${enc(
        "http://127.0.0.1:8787/auth/callback"
      )}&scope=${enc(OAUTH_SCOPE)}`,
      application_type: "web",
      grant_types: ["authorization_code", "refresh_token"],
      scope: OAUTH_SCOPE,
      response_types: ["code"],
      redirect_uris: ["http://127.0.0.1:8787/auth/callback"],
      token_endpoint_auth_method: "none", // "private_key_jwt",
      client_name: "atproto-auth-vue-starter",
    };
  } else {
    return {
      client_id: `${rootURL}/auth/client-metadata.json`,
      redirect_uris: [`${rootURL}/auth/callback`],
      application_type: "web",
      grant_types: ["authorization_code", "refresh_token"],
      scope: OAUTH_SCOPE,
      response_types: ["code"],
      token_endpoint_auth_method: "none", // "private_key_jwt",
      dpop_bound_access_tokens: true,
      jwks: {
        keys: [await getPublicKeyJwk(env)],
      },
      client_name: "atproto-auth-vue-starter",
    };
  }
}

function getRootUrl(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function isLocalDev(rootURL: string): boolean {
  return (
    rootURL.startsWith("http://localhost:") ||
    rootURL.startsWith("http://127.0.0.1:")
  );
}
