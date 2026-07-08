"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { browseAnime, getGenres } from "@/lib/jikan";
import type { Anime, Genre } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AnimeCard } from "@/components/anime-card";
import { AnimeCardGridSkeleton } from "@/components/anime-card-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const TYPES = ["all", "tv", "movie", "ova", "ona", "special"];
const STATUSES = ["all", "airing", "complete", "upcoming"];
const SORTS = [
  { value: "default", label: "Relevance" },
  { value: "score", label: "Score" },
  { value: "popularity", label: "Popularity" },
  { value: "title", label: "Title" },
  { value: "start_date", label: "Date" },
  { value: "episodes", label: "Episodes" },
];

export function BrowseView() {
  const initialSearch = useStore((s) => s.search);

  const [q, setQ] = React.useState(initialSearch);
  const [type, setType] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [genre, setGenre] = React.useState("all");
  const [sort, setSort] = React.useState("default");
  const [genres, setGenres] = React.useState<Genre[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);

  const [data, setData] = React.useState<Anime[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasNext, setHasNext] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searched, setSearched] = React.useState(!!initialSearch);

  // load genres once
  React.useEffect(() => {
    getGenres().then(setGenres).catch(() => {});
  }, []);

  // sync external search
  React.useEffect(() => {
    setQ(initialSearch);
  }, [initialSearch]);

  // debounce search + filters
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setPage(1);
    const t = setTimeout(async () => {
      try {
        const res = await browseAnime({
          q,
          type,
          status,
          genres: genre,
          order_by: sort,
          sort: sort === "title" ? "asc" : "desc",
          page: 1,
        });
        if (!active) return;
        setData(res.data);
        setHasNext(res.hasNext);
        setSearched(!!q.trim() || type !== "all" || status !== "all" || genre !== "all" || sort !== "default");
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q, type, status, genre, sort]);

  const loadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const res = await browseAnime({
        q,
        type,
        status,
        genres: genre,
        order_by: sort,
        sort: sort === "title" ? "asc" : "desc",
        page: page + 1,
      });
      setData((d) => [...d, ...res.data]);
      setHasNext(res.hasNext);
      setPage((p) => p + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const resetFilters = () => {
    setQ("");
    setType("all");
    setStatus("all");
    setGenre("all");
    setSort("default");
  };

  const activeFilters =
    (type !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (genre !== "all" ? 1 : 0) +
    (sort !== "default" ? 1 : 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="section-accent" />
        <div>
          <h1 className="page-heading">Browse Anime</h1>
          <p className="page-subheading">
            Search and filter thousands of titles from MyAnimeList.
          </p>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search anime by title…"
            className="h-10 rounded-full border-border/70 bg-card/60 pl-9 shadow-sm focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/30"
            aria-label="Search anime"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-secondary"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters((v) => !v)}
          className="h-10"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeFilters > 0 && (
            <Badge className="ml-1 bg-primary-foreground/20 text-primary-foreground">
              {activeFilters}
            </Badge>
          )}
        </Button>
      </div>

      {/* Quick genre chips */}
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGenre("all")}
            className={cn(
              "btn-hover-lift rounded-full px-3 py-1 text-xs font-medium transition-all",
              genre === "all"
                ? "bg-primary text-primary-foreground"
                : "border border-border/60 bg-card/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            All
          </button>
          {genres.slice(0, 12).map((g) => (
            <button
              key={g.mal_id}
              onClick={() => setGenre(String(g.mal_id))}
              className={cn(
                "btn-hover-lift rounded-full px-3 py-1 text-xs font-medium transition-all",
                genre === String(g.mal_id)
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/60 bg-card/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-card p-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t === "all" ? "All types" : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t === "all" ? "All status" : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Genre</label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All genres</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g.mal_id} value={String(g.mal_id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Sort by</label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="col-span-2 justify-start sm:col-span-4"
            >
              <X className="size-4" /> Reset all filters
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <AnimeCardGridSkeleton count={12} />
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-12 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-primary/10">
            <Search className="size-7 text-primary" />
          </div>
          <p className="text-lg font-semibold">No anime found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {searched
              ? "Try different keywords or filters."
              : "Start by searching for a title above."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.map((a) => (
              <AnimeCard key={a.mal_id} anime={a} />
            ))}
          </div>
          {hasNext && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="min-w-40"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
