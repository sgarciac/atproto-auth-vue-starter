import { type SimpleStore } from "@atproto-labs/simple-store";
import { type Jwk, Key } from "@atproto/jwk";
import { JoseKey } from "@atproto/jwk-jose";
import { type InternalStateData, type Session } from "@atproto/oauth-client";

type ToDpopJwkValue<V extends { dpopKey: Key }> = Omit<V, "dpopKey"> & {
  dpopJwk: Jwk;
};

const A_HUNDRED_DAYS = 60 * 60 * 24 * 100; // 100 days in seconds

export function toDpopKeyStore<K extends string, V extends { dpopKey: Key }>(
  store: SimpleStore<K, ToDpopJwkValue<V>>
): SimpleStore<K, V> {
  return {
    async set(sub: K, { dpopKey, ...data }: V) {
      const dpopJwk = dpopKey.privateJwk;
      if (!dpopJwk) throw new Error("Private DPoP JWK is missing.");

      await store.set(sub, { ...data, dpopJwk });
    },

    async get(sub: K) {
      const result = await store.get(sub);
      if (!result) return undefined;

      const { dpopJwk, ...data } = result;
      const dpopKey = await JoseKey.fromJWK(dpopJwk);
      return { ...data, dpopKey } as unknown as V;
    },

    del: store.del.bind(store),
    clear: store.clear?.bind(store),
  };
}

type KVSavedState = ToDpopJwkValue<InternalStateData>;
type KVSavedStateStore = SimpleStore<string, KVSavedState>;

type KVSavedSession = ToDpopJwkValue<Session>;
type KVSavedSessionStore = SimpleStore<string, KVSavedSession>;

export class StateStore implements KVSavedStateStore {
  constructor(private env: Env) {}
  async get(key: string): Promise<KVSavedState | undefined> {
    const result = await this.env.DPOP_STATE_STORE.get(key);
    if (!result) return;
    return JSON.parse(result) as KVSavedState;
  }
  async set(key: string, val: KVSavedState) {
    const serializedValue = JSON.stringify(val);
    await this.env.DPOP_STATE_STORE.put(key, serializedValue, {
      expirationTtl: A_HUNDRED_DAYS, // 1 day});
    });
  }
  async del(key: string) {
    await this.env.DPOP_STATE_STORE.delete(key);
  }
}

export class SessionStore implements KVSavedSessionStore {
  constructor(private env: Env) {}
  async get(key: string): Promise<KVSavedSession | undefined> {
    const result = await this.env.DPOP_SESSION_STORE.get(key);

    if (!result) {
      return;
    }
    return JSON.parse(result) as KVSavedSession;
  }
  async set(key: string, val: KVSavedSession) {
    const serializedValue = JSON.stringify(val);

    await this.env.DPOP_SESSION_STORE.put(key, serializedValue, {
      expirationTtl: A_HUNDRED_DAYS,
    });
  }
  async del(key: string) {
    await this.env.DPOP_SESSION_STORE.delete(key);
  }
}
