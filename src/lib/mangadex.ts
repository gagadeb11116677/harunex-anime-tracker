// ===== Harunex MangaDex API client =====
// Docs: https://api.mangadex.org/docs
// Features: in-memory TTL cache, simple queue (respect ~5 req/s), retry on 429/5xx.

import type {
  MangaDexChapter,
  MangaDexList,
  MangaDexManga,
  MangaSummary,
} from "./types";

const BASE = "/api/mangadex"; // proxied to api.mangadex.org (avoids CORS)
const CACHE_TTL = 5 * 60 * 1000;
// cover proxy (same-origin, avoids domain blocking in preview envs)
const COVER_PROXY = "/api/mangadex-cover";

interface CacheEntry<T> {
  ts: number;
  data: T;
}
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}
function setCached<T>(key: string, data: T) {
  cache.set(key, { ts: Date.now(), data });
  if (cache.size > 200) {
    const k = cache.keys().next().value;
    if (k) cache.delete(k);
  }
}

// light rate limit: serialize with small gap
let chain: Promise<unknown> = Promise.resolve();
const MIN_INTERVAL = 240; // ~4 req/s
function schedule<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const r = await fn();
    await new Promise((res) => setTimeout(res, MIN_INTERVAL));
    return r;
  });
  chain = run.catch(() => undefined);
  return run as Promise<T>;
}

async function fetchWithRetry(url: string, maxAttempts = 3): Promise<Response> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        attempt++;
        continue;
      }
      return res;
    } catch {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      attempt++;
    }
  }
  throw new Error("MangaDex request failed");
}

async function request<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  const cached = getCached<T>(url);
  if (cached) return cached;
  return schedule(async () => {
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`MangaDex API error: ${res.status}`);
    const json = (await res.json()) as T;
    setCached(url, json);
    return json;
  });
}

// ===== Helpers =====

function pickTitle(t: Record<string, string> | undefined): string {
  if (!t) return "Untitled";
  return t.en || t.romaji || t["ja-ro"] || Object.values(t)[0] || "Untitled";
}

function coverUrl(manga: MangaDexManga, size: 256 | 512 = 512): string {
  const rel = manga.relationships?.find((r) => r.type === "cover_art");
  const fileName = rel?.attributes?.fileName;
  if (!fileName) return "";
  // use same-origin proxy to avoid any domain blocking
  return `${COVER_PROXY}?id=${manga.id}&file=${encodeURIComponent(fileName)}&size=${size}`;
}

function authorName(manga: MangaDexManga): string | null {
  const rel = manga.relationships?.find((r) => r.type === "author");
  return rel?.attributes?.name ?? null;
}

function toSummary(manga: MangaDexManga): MangaSummary {
  const attrs = manga.attributes;
  const desc = attrs.description?.en || Object.values(attrs.description || {})[0] || "";
  const altTitles = (attrs.altTitles || [])
    .map((t) => pickTitle(t))
    .filter(Boolean)
    .slice(0, 5);
  const tags = (attrs.tags || [])
    .map((tg) => tg.attributes?.name?.en || Object.values(tg.attributes?.name || {})[0])
    .filter(Boolean) as string[];
  return {
    id: manga.id,
    title: pickTitle(attrs.title),
    altTitles,
    description: desc,
    status: attrs.status,
    year: attrs.year ?? null,
    contentRating: attrs.contentRating,
    tags,
    coverUrl: coverUrl(manga, 512),
    author: authorName(manga),
    lastChapter: attrs.lastChapter,
    lastVolume: attrs.lastVolume,
    availableLanguages: attrs.availableTranslatedLanguages || [],
  };
}

function dedupeManga(list: MangaDexManga[]): MangaDexManga[] {
  const seen = new Set<string>();
  const out: MangaDexManga[] = [];
  for (const m of list) {
    if (m?.id && !seen.has(m.id)) {
      seen.add(m.id);
      out.push(m);
    }
  }
  return out;
}

const COMMON_INCLUDES = "includes[]=cover_art&includes[]=author&includes[]=artist";
const SAFE_RATINGS =
  "contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica";

// ===== Public API =====

export interface MangaHomeSections {
  popular: MangaSummary[];
  topRated: MangaSummary[];
  recent: MangaSummary[];
  topYear: MangaSummary[];
}

export async function getMangaHome(): Promise<MangaHomeSections> {
  const year = new Date().getFullYear();
  const [popRes, topRes, recentRes, yearRes] = await Promise.all([
    request<MangaDexList<MangaDexManga>>(
      `/manga?${COMMON_INCLUDES}&${SAFE_RATINGS}&order[followedCount]=desc&hasAvailableChapters=true&limit=12`
    ),
    request<MangaDexList<MangaDexManga>>(
      `/manga?${COMMON_INCLUDES}&${SAFE_RATINGS}&order[rating]=desc&hasAvailableChapters=true&limit=12`
    ),
    request<MangaDexList<MangaDexManga>>(
      `/manga?${COMMON_INCLUDES}&${SAFE_RATINGS}&order[latestUploadedChapter]=desc&hasAvailableChapters=true&limit=12`
    ),
    request<MangaDexList<MangaDexManga>>(
      `/manga?${COMMON_INCLUDES}&${SAFE_RATINGS}&year=${year}&order[followedCount]=desc&hasAvailableChapters=true&limit=12`
    ),
  ]);
  return {
    popular: dedupeManga(popRes.data || []).map(toSummary),
    topRated: dedupeManga(topRes.data || []).map(toSummary),
    recent: dedupeManga(recentRes.data || []).map(toSummary),
    topYear: dedupeManga(yearRes.data || []).map(toSummary),
  };
}

export interface MangaBrowseParams {
  q?: string;
  status?: string; // ongoing, completed, hiatus, cancelled
  contentRating?: string; // safe, suggestive, erotica
  sort?: string; // followedCount, rating, latestUploadedChapter, title
  offset?: number;
}

export async function browseManga(
  params: MangaBrowseParams
): Promise<{ data: MangaSummary[]; total: number; offset: number; limit: number }> {
  // build query parts
  const parts: string[] = [
    `includes[]=cover_art`,
    `includes[]=author`,
    `includes[]=artist`,
    `limit=24`,
    `offset=${params.offset ?? 0}`,
  ];
  // content rating
  const ratings =
    params.contentRating && params.contentRating !== "all"
      ? [params.contentRating]
      : ["safe", "suggestive"];
  ratings.forEach((r) => parts.push(`contentRating[]=${r}`));
  // status
  if (params.status && params.status !== "all") {
    parts.push(`status[]=${params.status}`);
  }
  // sort
  const sortKey = params.sort || "followedCount";
  parts.push(`order[${sortKey}]=desc`);
  // has chapters
  parts.push(`hasAvailableChapters=true`);
  // title search
  if (params.q && params.q.trim()) {
    parts.push(`title=${encodeURIComponent(params.q.trim())}`);
  }
  const path = `/manga?${parts.join("&")}`;
  const res = await request<MangaDexList<MangaDexManga>>(path);
  return {
    data: dedupeManga(res.data || []).map(toSummary),
    total: res.total ?? 0,
    offset: res.offset ?? 0,
    limit: res.limit ?? 24,
  };
}

export async function getMangaDetail(id: string): Promise<MangaSummary | null> {
  try {
    const res = await request<{ data: MangaDexManga }>(
      `/manga/${id}?${COMMON_INCLUDES}`
    );
    if (!res.data) return null;
    return toSummary(res.data);
  } catch {
    return null;
  }
}

export async function getMangaChapters(
  id: string,
  limit = 24
): Promise<MangaDexChapter[]> {
  try {
    const res = await request<MangaDexList<MangaDexChapter>>(
      `/manga/${id}/feed?limit=${limit}&translatedLanguage[]=en&order[chapter]=asc&includes[]=scanlation_group&contentRating[]=safe&contentRating[]=suggestive`
    );
    return res.data || [];
  } catch {
    return [];
  }
}

// aggregate to get total chapter count available in english
export async function getMangaChapterCount(id: string): Promise<number | null> {
  try {
    const res = await request<{
      volumes: Record<string, { chapters: Record<string, { count: number; chapter: string }> }>;
    }>(`/manga/${id}/aggregate?translatedLanguage[]=en`);
    let max = 0;
    const volumes = res.volumes || {};
    for (const v of Object.values(volumes)) {
      for (const c of Object.values(v.chapters || {})) {
        const n = parseFloat(c.chapter);
        if (!isNaN(n) && n > max) max = n;
      }
    }
    return max > 0 ? Math.round(max) : null;
  } catch {
    return null;
  }
}
