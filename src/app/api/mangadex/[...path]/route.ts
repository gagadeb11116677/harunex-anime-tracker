// ===== MangaDex proxy route =====
// MangaDex API does not send CORS headers, so browser requests get blocked.
// This server-side route forwards requests to api.mangadex.org (server has no CORS).
// Client should call /api/mangadex/<path>?<query> instead of https://api.mangadex.org/<path>?<query>.

import { NextResponse } from "next/server";

const UPSTREAM = "https://api.mangadex.org";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const url = new URL(_req.url);
  const target = `${UPSTREAM}/${path.join("/")}?${url.searchParams.toString()}`;

  try {
    const res = await fetch(target, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { result: "error", errors: [{ message: "Proxy failed" }] },
      { status: 502 }
    );
  }
}
