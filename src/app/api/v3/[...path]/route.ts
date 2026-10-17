import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  const apiOrigin = process.env.FLIXYFY_API_ORIGIN;
  if (!apiOrigin) {
    return Response.json({ error: "API origin is not configured" }, { status: 503 });
  }

  let origin: URL;
  try {
    origin = new URL(apiOrigin);
  } catch {
    return Response.json({ error: "API origin is invalid" }, { status: 500 });
  }
  if (origin.protocol !== "https:" && origin.hostname !== "127.0.0.1" && origin.hostname !== "localhost") {
    return Response.json({ error: "API origin must use HTTPS" }, { status: 500 });
  }

  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const target = new URL(`/api/v3/${path.map(encodeURIComponent).join("/")}`, origin);
  target.search = incomingUrl.search;

  const requestHeaders = new Headers({ Accept: request.headers.get("accept") ?? "application/json" });
  // Vercel provides this short-lived, request-scoped token to the server function.
  // Forward it only server-side so a protected backend Preview can trust the frontend project.
  const oidcToken = (await headers()).get("x-vercel-oidc-token");
  if (oidcToken) requestHeaders.set("x-vercel-trusted-oidc-idp-token", oidcToken);

  try {
    const upstream = await fetch(target, { headers: requestHeaders, cache: "no-store", redirect: "manual" });
    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    responseHeaders.set("cache-control", "no-store");
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ error: "API request failed" }, { status: 502 });
  }
}
