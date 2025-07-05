import { WebcryptoKey } from "@atproto/jwk-webcrypto";

export async function getKey(env: Env): Promise<WebcryptoKey> {
  // expects an EC/ES256 key
  const privateKey = getPrivateKeyJwk(env);
  const publicKey = getPublicKeyJwk(env);

  const importedPrivateKey = await crypto.subtle.importKey(
    "jwk",
    privateKey,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );

  const importedPublicKey = await crypto.subtle.importKey(
    "jwk",
    publicKey,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );

  return WebcryptoKey.fromKeypair(
    { privateKey: importedPrivateKey, publicKey: importedPublicKey },
    privateKey["kid"]
  );
}

export async function getPublicKey(env: Env) {
  const publicKey = getPublicKeyJwk(env);
  return WebcryptoKey.fromJWK(publicKey, publicKey);
}

export function getPublicKeyJwk(env: Env) {
  const publicKey = JSON.parse(env.PRIVATE_JWK);
  delete publicKey["d"];
  return publicKey;
}

export function getPrivateKeyJwk(env: Env) {
  return JSON.parse(env.PRIVATE_JWK);
}
