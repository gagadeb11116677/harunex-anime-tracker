// ===== MangaDex cover image proxy =====
// uploads.mangadex.org may be blocked/slow in some environments.
// This route fetches the cover server-side and streams it back same-origin.
// Includes in-memory cache.

import { NextResponse } from "next/server";

const COVERS = "https://uploads.mangadex.org/covers";

export const dynamic = "force-dynamic";

const coverCache = new Map<string, { buf: ArrayBuffer; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const file = url.searchParams.get("file");
  const size = url.searchParams.get("size") || "512";

  if (!id || !file) {
    return new NextResponse("Missing params", { status: 400 });
  }

  const cacheKey = `${id}/${file}/${size}`;
  const cached = coverCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new NextResponse(cached.buf, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  const target = `${COVERS}/${id}/${file}.${size}.jpg`;

  try {
    const res = await fetch(target, { cache: "no-store" });
    if (!res.ok) {
      return new NextResponse("Cover not found", { status: 404 });
    }
    const buf = await res.arrayBuffer();

    if (coverCache.size > 200) {
      const k = coverCache.keys().next().value;
      if (k) coverCache.delete(k);
    }
    coverCache.set(cacheKey, { buf, ts: Date.now() });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse("Proxy failed", { status: 502 });
  }
}
