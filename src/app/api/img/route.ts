// ===== Universal image proxy =====
// Some preview environments block external image domains.
// This route proxies images from whitelisted hosts (MAL, AniList, MangaDex)
// so all images are served same-origin. Includes in-memory cache.

import { NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "cdn.myanimelist.net",
  "uploads.mangadex.org",
  "s4.anilist.co",
  "s3.anilist.co",
  "s2.anilist.co",
  "s1.anilist.co",
];

export const dynamic = "force-dynamic";

// in-memory cache: url -> { buf, ct, ts }
const imgCache = new Map<string, { buf: ArrayBuffer; ct: string; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 60 min (images jarang berubah)

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  if (!target) return new NextResponse("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  // check cache
  const cached = imgCache.get(target);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new NextResponse(cached.buf, {
      status: 200,
      headers: {
        "Content-Type": cached.ct,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  try {
    const res = await fetch(parsed.toString(), { cache: "no-store" });
    if (!res.ok) return new NextResponse("Image not found", { status: 404 });
    const buf = await res.arrayBuffer();
    const ct = res.headers.get("content-type") || "image/jpeg";

    // cache it (cap at 200 entries)
    if (imgCache.size > 200) {
      const firstKey = imgCache.keys().next().value;
      if (firstKey) imgCache.delete(firstKey);
    }
    imgCache.set(target, { buf, ct, ts: Date.now() });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse("Proxy failed", { status: 502 });
  }
}
