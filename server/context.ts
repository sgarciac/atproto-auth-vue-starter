import { getClient } from "./client";
import { getUnsealedSession } from "./session";
import { Agent } from "@atproto/api";

/*
 * Context for incoming requests in the server environment
 * This includes session management and AT Protocol client setup
 *
 * Having a session and an AT Protocol client allows us to make authenticated requests
 * to the AT Protocol API, which is necessary for operations like creating records.
 */
export const getSessionContext = async (req: Request, env: Env) => {
  const session = await getUnsealedSession(req, env.SECRET);
  const atprotoClient = await getClient(req, env);
  let atprotoAgent: Agent | undefined; //

  if (session && session.did) {
    const oauthSession = await atprotoClient.restore(session.did);
    if (oauthSession) {
      atprotoAgent = new Agent(oauthSession);
    }
  }
  return {
    atprotoAgent,
    session,
  };
};

export type Context = Awaited<ReturnType<typeof getSessionContext>>;
