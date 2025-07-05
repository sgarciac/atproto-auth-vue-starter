import * as Iron from "iron-webcrypto";
import { parse } from "cookie";
const SESSION_ID_COOKIE_NAME = "sauth";

export interface Session {
  did: string;
}

export async function createSealedSession(
  res: Response,
  session: Session,
  secret: string,
  maxAge: number = 60 * 60 * 24 * 30
) {
  const sealed = await Iron.seal(crypto, session, secret, Iron.defaults);
  const cookie = `${SESSION_ID_COOKIE_NAME}=${sealed}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly`;
  res.headers.set("Set-Cookie", cookie);
}

export async function getUnsealedSession(
  req: Request,
  secret: string
): Promise<Session | undefined> {
  const cookie = parse(req.headers.get("Cookie") || "");

  if (cookie[SESSION_ID_COOKIE_NAME] == null) {
    return undefined;
  }

  const session = (await Iron.unseal(
    crypto,
    cookie[SESSION_ID_COOKIE_NAME],
    secret,
    Iron.defaults
  )) as Session;
  return session;
}

export async function deleteSealedSession(req: Request, res: Response) {
  const cookie = parse(req.headers.get("Cookie") || "");
  const sessionId = cookie[SESSION_ID_COOKIE_NAME];
  if (sessionId != null) {
    const cookie = `${SESSION_ID_COOKIE_NAME}=${sessionId}; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC;HttpOnly; Secure; SameSite=Lax`;
    res.headers.append("Set-Cookie", cookie);
  }
}
