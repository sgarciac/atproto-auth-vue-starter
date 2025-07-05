import { getClient, getMetadata } from "./client";
import { getSessionContext } from "./context";
import { AutoRouter } from "itty-router";
import { patchBase } from "./patchs";
import { createSealedSession, deleteSealedSession } from "./session";
import { TID } from "@atproto/common-web";

export type ErrorCode = "bad_handle" | "client_error";

// Install patches needed for compatibility with Cloudflare Workers:
patchBase();

// This file creates the main server endpoints:
//
// GET '/' -> a simple hello world endpoint, because, why not?
// GET '/api/settings-check' -> checks if the server is configured correctly.

// Our example App endpoints
// POST '/api/record' -> creates a new record in the user's repository.
// POST '/auth/login' -> initiates the login process by redirecting to the AT Protocol authorization endpoint.
// POST '/auth/logout' -> logs out the user by deleting the session cookie.
// GET '/api/user' -> retrieves the user's profile information.
//
// atproto's oauth related endpoints:
//
// GET '/auth/client-metadata.json' -> returns the OAuth client metadata for AT Protocol authentication.
// GET '/auth/callback' -> handles the OAuth callback.

const router = AutoRouter();

router.get("/", async () => {
  return new Response("hello world empty");
});

router.get("/api/settings-check", async (request, env: Env, ctx) => {
  const localDev =
    request.url.startsWith("http://localhost:") ||
    request.url.startsWith("http://127.0.0.1:");

  if (env.DPOP_SESSION_STORE == null) {
    return Response.json(
      { error: "dpop_session_store_not_found" },
      { status: 500 }
    );
  }

  if (request.url.startsWith("http://localhost:")) {
    return Response.json(
      { error: "prefer_ip_over_localhost" },
      { status: 500 }
    );
  }

  if (env.DPOP_STATE_STORE == null) {
    return Response.json(
      { error: "dpop_state_store_not_found" },
      { status: 500 }
    );
  }

  if (env.SECRET == null || env.SECRET.length < 32) {
    return Response.json({ error: "blank_secret" }, { status: 500 });
  }

  if (!localDev) {
    if (!env.PRIVATE_JWK) {
      return Response.json({ error: "private_jwk_not_found" }, { status: 500 });
    }
  }
  return Response.json({ error: null });
});

router.post("/api/record", async (request: Request, env: Env, ctx) => {
  const sessionContext = await getSessionContext(request, env);
  // MAKE SURE THERE IS A SESSSION!
  if (!sessionContext.session || !sessionContext.atprotoAgent) {
    return new Response(null, { status: 403 });
  }

  const agent = sessionContext.atprotoAgent!;
  const body: any = await request.json();

  if (!body.namespace) {
    return new Response("No namespace provided", { status: 400 });
  }

  if (!body.data) {
    return new Response("No record data provided", { status: 400 });
  }

  try {
    const res = await agent.com.atproto.repo.createRecord({
      repo: agent.assertDid,
      collection: body.namespace,
      rkey: TID.nextStr(),
      record: body.data,
    });
    return Response.json(res.data);
  } catch (err) {
    return new Response("Error creating record", { status: 500 });
  }
});

router.post("/auth/login", async (request: Request, env: Env, ctx) => {
  const client = await getClient(request, env);
  const body = await request.formData();
  let handle = body.get("handle") as string;

  if (handle == null) {
    return redirectWithErrorMessage(request, "/", "bad_handle");
  }

  if (handle.indexOf(".") === -1) {
    handle = `${handle}.bsky.social`;
  }

  try {
    const url = await client.authorize(handle, {
      state: crypto.randomUUID(),
    });
    return Response.redirect(url.toString(), 302);
  } catch (e) {
    return redirectWithErrorMessage(request, "/", "bad_handle");
  }
});

router.post("/auth/logout", async (request: Request, env: Env, ctx: any) => {
  const response = new Response("LoggedOut", {
    status: 302,
    headers: { Location: "/" },
  });

  await deleteSealedSession(request, response);
  return response;
});

router.get("/auth/client-metadata.json", async (request, env, ctx) =>
  Response.json(await getMetadata(request, env))
);

// This endpoint is used to handle the OAuth callback from AT Protocol
// Once the user has been authenticated, we stablish a session using
// a sealed cookie containing the user's DID.
router.get("/auth/callback", async (request, env: Env, ctx) => {
  try {
    const client = await getClient(request, env);
    const queryParams = new URLSearchParams(request.url.split("?")[1]);
    const { session } = await client.callback(queryParams);
    const res = new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
    await createSealedSession(res, { did: session.did }, env.SECRET);
    return res;
  } catch (e) {
    return new Response("Something went wrong :-(", { status: 500 });
  }
});

router.get("/api/user", async (request, env: Env, ctx) => {
  const sessionContext = await getSessionContext(request, env);
  // make sure there is a session!
  if (!sessionContext.session || !sessionContext.atprotoAgent) {
    return new Response(null, { status: 403 });
  }

  const agent = sessionContext.atprotoAgent!;
  try {
    const { data: profileRecord } = await agent.app.bsky.actor.getProfile({
      actor: agent.assertDid,
    });
    if (profileRecord == null) {
      return new Response(null, { status: 404 });
    }
    const response = {
      did: agent.assertDid,
      displayName: profileRecord.displayName,
      description: profileRecord.description,
      avatarId: profileRecord.avatar,
      bannerId: profileRecord.banner,
    };
    return Response.json(response);
  } catch (err) {
    return new Response(null, { status: 502 });
  }
});

function redirectWithErrorMessage(
  original: Request,
  path: string,
  errorCode: ErrorCode
) {
  const url = new URL(original.url);
  url.pathname = path;
  url.searchParams.set("error", errorCode);
  const res = new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  });
  return res;
}

export default router satisfies ExportedHandler<Env>;
