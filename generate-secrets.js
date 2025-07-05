import { JoseKey } from "@atproto/jwk-jose";
import crypto from "node:crypto";

const kid = crypto.randomBytes(8).toString("base64url");
const secret = crypto.randomBytes(32).toString("base64url");
const joseKey = await JoseKey.generate(["ES256"], kid, {
  extractable: true,
});

console.log(`SECRET=${secret}`);
console.log(`PRIVATE_JWK=${JSON.stringify(joseKey.jwk)}`);
