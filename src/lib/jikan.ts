// ===== Harunex Jikan API client =====
// Features: in-memory TTL cache, client-side rate limiter (3 req/s), retry w/ backoff.
// All requests go through `request()` which serializes calls to respect Jikan limits.

import type {
  Anime,
  CharacterEntry,
  JikanResponse,
  Recommendation,
  Relation,
} from "./types";

const BASE = "https://api.jikan.moe/v4";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (home data jarang berubah)

// --- simple in-memory cache (no persistence needed) ---
interface CacheEntry<T> {
  ts: number;
  data: T;
}
const cache = new Map<string, CacheEntry<unknown>>();

// dedupe by mal_id (Jikan occasionally returns duplicates)
function dedupeAnime(list: Anime[]): Anime[] {
  const seen = new Set<number>();
  const out: Anime[] = [];
  for (const a of list) {
    if (a && typeof a.mal_id === "number" && !seen.has(a.mal_id)) {
      seen.add(a.mal_id);
      out.push(a);
    }
  }
  return out;
}

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
  // cap cache size
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

// --- rate limiter: max ~2.5 req/s, serialized queue ---
let chain: Promise<unknown> = Promise.resolve();
const MIN_INTERVAL = 280; // ms between requests (~3.5 req/s, safe under 3/s limit... actually Jikan allows 3/s, we use 2.8/s for safety)

function schedule<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const result = await fn();
    // enforce min interval AFTER a successful/failed call before next in queue
    await new Promise((r) => setTimeout(r, MIN_INTERVAL));
    return result;
  });
  // keep the chain alive even if this one rejects
  chain = run.catch(() => undefined);
  return run as Promise<T>;
}

async function fetchWithRetry(
  url: string,
  maxAttempts = 5
): Promise<Response> {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt < maxAttempts) {
    try {
      // add timeout via AbortController (8s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      // Jikan returns 429 when rate limited — backoff and retry
      if (res.status === 429) {
        const wait = 800 * (attempt + 1);
        await new Promise((r) => setTimeout(r, wait));
        attempt++;
        continue;
      }
      // 5xx → retry with longer backoff
      if (res.status >= 500) {
        const wait = 800 * (attempt + 1) + 200;
        await new Promise((r) => setTimeout(r, wait));
        attempt++;
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      const wait = 600 * (attempt + 1);
      await new Promise((r) => setTimeout(r, wait));
      attempt++;
    }
  }
  throw lastErr ?? new Error("Request failed");
}

async function request<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  const cached = getCached<T>(url);
  if (cached) return cached;

  return schedule(async () => {
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      throw new Error(`Jikan API error: ${res.status}`);
    }
    const json = (await res.json()) as T;
    setCached(url, json);
    return json;
  });
}

// ===== Public API =====

export interface HomeSections {
  trending: Anime[];
  seasonal: Anime[];
  top: Anime[];
  upcoming: Anime[];
}

function nowSeason(): { season: "winter" | "spring" | "summer" | "fall"; year: number } {
  const d = new Date();
  const month = d.getMonth(); // 0-11
  const year = d.getFullYear();
  let season: "winter" | "spring" | "summer" | "fall";
  if (month <= 2) season = "winter";
  else if (month <= 5) season = "spring";
  else if (month <= 8) season = "summer";
  else season = "fall";
  return { season, year };
}

export async function getHomeSections(): Promise<HomeSections> {
  const { season, year } = nowSeason();
  // fire sequentially via our queue (cached too)
  const [topRes, seasonRes, topAllRes, upcomingRes] = await Promise.all([
    request<JikanResponse<Anime[]>>(
      `/top/anime?filter=airing&limit=12`
    ),
    request<JikanResponse<Anime[]>>(
      `/seasons/${year}/${season}?limit=18`
    ),
    request<JikanResponse<Anime[]>>(`/top/anime?limit=12`),
    request<JikanResponse<Anime[]>>(
      `/seasons/upcoming?limit=12`
    ),
  ]);
  return {
    trending: dedupeAnime(topRes.data ?? []),
    seasonal: dedupeAnime(seasonRes.data ?? []),
    top: dedupeAnime(topAllRes.data ?? []),
    upcoming: dedupeAnime(upcomingRes.data ?? []),
  };
}

export interface BrowseParams {
  q?: string;
  type?: string;
  status?: string;
  genres?: string;
  order_by?: string;
  sort?: "asc" | "desc";
  page?: number;
  min_score?: number;
}

export async function browseAnime(
  params: BrowseParams
): Promise<{ data: Anime[]; hasNext: boolean; page: number }> {
  const sp = new URLSearchParams();
  sp.set("limit", "24");
  if (params.q && params.q.trim()) sp.set("q", params.q.trim());
  if (params.type && params.type !== "all") sp.set("type", params.type);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.genres && params.genres !== "all") sp.set("genres", params.genres);
  if (params.order_by && params.order_by !== "default")
    sp.set("order_by", params.order_by);
  if (params.sort) sp.set("sort", params.sort);
  if (params.page) sp.set("page", String(params.page));
  if (params.min_score) sp.set("min_score", String(params.min_score));

  // if no query/filters, default to popularity sort for a nice feed
  const path = `/anime?${sp.toString()}`;
  const res = await request<JikanResponse<Anime[]>>(path);
  return {
    data: dedupeAnime(res.data ?? []),
    hasNext: res.pagination?.has_next_page ?? false,
    page: params.page ?? 1,
  };
}

export async function getAnimeFull(id: number): Promise<Anime> {
  const res = await request<JikanResponse<Anime>>(`/anime/${id}/full`);
  return res.data;
}

export async function getAnimeCharacters(id: number): Promise<CharacterEntry[]> {
  const res = await request<JikanResponse<CharacterEntry[]>>(
    `/anime/${id}/characters`
  );
  const list = res.data ?? [];
  const seen = new Set<number>();
  return list.filter((c) => {
    const mid = c.character?.mal_id;
    if (!mid || seen.has(mid)) return false;
    seen.add(mid);
    return true;
  });
}

export async function getAnimeRecommendations(
  id: number
): Promise<Recommendation[]> {
  const res = await request<JikanResponse<Recommendation[]>>(
    `/anime/${id}/recommendations`
  );
  const list = res.data ?? [];
  const seen = new Set<number>();
  return list.filter((r) => {
    const mid = r.entry?.mal_id;
    if (!mid || seen.has(mid)) return false;
    seen.add(mid);
    return true;
  });
}

export async function getAnimeRelations(id: number): Promise<Relation[]> {
  const res = await request<JikanResponse<Relation[]>>(
    `/anime/${id}/relations`
  );
  return res.data ?? [];
}

export async function getTopAnime(limit = 6): Promise<Anime[]> {
  const res = await request<JikanResponse<Anime[]>>(
    `/top/anime?limit=${limit}`
  );
  return res.data ?? [];
}

export interface Genre {
  mal_id: number;
  name: string;
}

let genreCache: Genre[] | null = null;
export async function getGenres(): Promise<Genre[]> {
  if (genreCache) return genreCache;
  const res = await request<JikanResponse<Genre>>(`/genres/anime?order_by=name`);
  genreCache = res.data ?? [];
  return genreCache;
}
