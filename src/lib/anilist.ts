// ===== Harunex AniList GraphQL client =====
// Docs: https://docs.anilist.co
// Used as a supplementary source: trending anime feed + score enrichment.

import type { AniListMedia } from "./types";

const ENDPOINT = "https://graphql.anilist.co";
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  ts: number;
  data: T;
}
const cache = new Map<string, CacheEntry<unknown>>();
function getCached<T>(key: string): T | null {
  const e = cache.get(key) as CacheEntry<T> | undefined;
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return e.data;
}
function setCached<T>(key: string, data: T) {
  cache.set(key, { ts: Date.now(), data });
  if (cache.size > 80) {
    const k = cache.keys().next().value;
    if (k) cache.delete(k);
  }
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const key = `${query}::${JSON.stringify(variables)}`;
  const cached = getCached<T>(key);
  if (cached) return cached;

  let attempt = 0;
  while (attempt < 3) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query, variables }),
        cache: "no-store",
      });
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        attempt++;
        continue;
      }
      if (!res.ok) throw new Error(`AniList error: ${res.status}`);
      const json = (await res.json()) as { data: T; errors?: { message: string }[] };
      if (json.errors) throw new Error("AniList GraphQL error");
      setCached(key, json.data);
      return json.data;
    } catch (e) {
      attempt++;
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw new Error("AniList request failed");
}

export interface AniListPage {
  Page: {
    media: AniListMedia[];
  };
}

export interface AniListMediaResp {
  Media: AniListMedia | null;
}

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native }
  coverImage { large extraLarge color }
  bannerImage
  averageScore
  meanScore
  popularity
  episodes
  chapters
  format
  status
  seasonYear
  description
  genres
  studios { nodes { name isAnimationStudio } }
`;

export async function getAniListTrending(limit = 12): Promise<AniListMedia[]> {
  const query = `
    query($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await gql<AniListPage>(query, { perPage: limit });
    return data.Page?.media || [];
  } catch {
    return [];
  }
}

export async function getAniListPopularSeason(limit = 12): Promise<AniListMedia[]> {
  const query = `
    query($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await gql<AniListPage>(query, { perPage: limit });
    return data.Page?.media || [];
  } catch {
    return [];
  }
}

export async function getAniListTopAllTime(limit = 12): Promise<AniListMedia[]> {
  const query = `
    query($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await gql<AniListPage>(query, { perPage: limit });
    return data.Page?.media || [];
  } catch {
    return [];
  }
}

// Search AniList anime by title (used as supplementary)
export async function searchAniListAnime(q: string, perPage = 24): Promise<AniListMedia[]> {
  if (!q.trim()) return [];
  const query = `
    query($search: String!, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await gql<AniListPage>(query, { search: q.trim(), perPage });
    return data.Page?.media || [];
  } catch {
    return [];
  }
}
