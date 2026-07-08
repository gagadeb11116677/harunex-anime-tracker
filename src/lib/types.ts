// ===== Harunex types — mirrors Jikan v4 response shapes (subset we use) =====

export interface AnimeImage {
  jpg: { image_url: string; small_image_url: string; large_image_url: string };
  webp: { image_url: string; small_image_url: string; large_image_url: string };
}

export interface AnimeGenre {
  mal_id: number;
  name: string;
  type: string;
  url: string;
}

export type AnimeStatus = "Finished Airing" | "Currently Airing" | "Not yet aired";

export interface Anime {
  mal_id: number;
  url: string;
  images: AnimeImage;
  trailer?: { youtube_id?: string | null; url?: string | null; embed_url?: string | null };
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  titles: { type: string; title: string }[];
  type: string | null;
  source: string | null;
  episodes: number | null;
  status: AnimeStatus | string | null;
  airing: boolean;
  aired: { string?: string };
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  studios: { mal_id: number; name: string }[];
  genres: AnimeGenre[];
  themes: AnimeGenre[];
  demographics: AnimeGenre[];
}

export interface Character {
  mal_id: number;
  url: string;
  images: AnimeImage;
  name: string;
}

// Jikan v4 /anime/{id}/characters returns entries with a nested `character` object
export interface CharacterEntry {
  character: Character;
  role: string;
  voice_actors?: {
    person: { mal_id: number; name: string; images: AnimeImage };
    language: string;
  }[];
}

export interface RecommendationAnime {
  mal_id: number;
  url: string;
  images: AnimeImage;
  title: string;
  synopsis?: string | null;
}

export interface Recommendation {
  entry: RecommendationAnime;
}

export interface RelationEntry {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Relation {
  relation: string;
  entry: RelationEntry[];
}

export interface JikanResponse<T> {
  data: T;
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number | null;
    items?: { count: number; total: number; per_page: number };
  };
}

// ===== Tracker (local) types =====

export type WatchStatus =
  | "watching"
  | "completed"
  | "plan"
  | "onhold"
  | "dropped";

// reading status for manga (reuses same keys for UI consistency)
export type ReadStatus = WatchStatus;

export interface TrackedItem {
  mal_id: number;
  title: string;
  image_url: string;
  type: string | null;
  episodes: number | null;
  score: number | null;
  status: WatchStatus;
  progress: number;
  rating: number; // 0-10
  addedAt: number;
  updatedAt: number;
}

export interface MangaTrackedItem {
  id: string; // MangaDex UUID
  title: string;
  image_url: string;
  status: ReadStatus;
  progress: number; // chapters read
  totalChapters: number | null;
  rating: number; // 0-10
  addedAt: number;
  updatedAt: number;
}

export type View = "home" | "browse" | "detail" | "mylist" | "about";
export type ContentType = "anime" | "manga";

// ===== MangaDex types (subset we use) =====

export interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: Record<string, unknown> & { name?: string; fileName?: string };
}

export interface MangaDexManga {
  id: string;
  type: "manga";
  attributes: {
    title: Record<string, string>;
    altTitles: Record<string, string>[];
    description: Record<string, string>;
    status: string;
    year: number | null;
    contentRating: string;
    tags: { id: string; type: string; attributes: { name: Record<string, string> } }[];
    lastVolume: string | null;
    lastChapter: string | null;
    availableTranslatedLanguages: string[];
    state: string;
  };
  relationships: MangaDexRelationship[];
}

export interface MangaDexList<T> {
  result: string;
  response: string;
  data: T[];
  limit: number;
  offset: number;
  total: number;
}

export interface MangaDexChapter {
  id: string;
  type: "chapter";
  attributes: {
    volume: string | null;
    chapter: string | null;
    title: string | null;
    translatedLanguage: string;
    externalUrl: string | null;
    publishAt: string;
    readableAt: string;
    pages: number;
  };
  relationships: MangaDexRelationship[];
}

export interface MangaSummary {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  status: string;
  year: number | null;
  contentRating: string;
  tags: string[];
  coverUrl: string;
  author: string | null;
  lastChapter: string | null;
  lastVolume: string | null;
  availableLanguages: string[];
}

// ===== AniList types =====

export interface AniListTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
}

export interface AniListMedia {
  id: number;
  idMal?: number | null;
  title: AniListTitle;
  coverImage: { large: string; extraLarge: string; color?: string | null };
  bannerImage?: string | null;
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  episodes?: number | null;
  chapters?: number | null;
  format?: string | null;
  status?: string | null;
  seasonYear?: number | null;
  description?: string | null;
  genres?: string[];
  studios?: { nodes: { name: string; isAnimationStudio: boolean }[] };
}

