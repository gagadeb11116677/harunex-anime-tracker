"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X, Loader2, BookOpen } from "lucide-react";
import { browseManga } from "@/lib/mangadex";
import type { MangaSummary } from "@/lib/types";
import { useStore } from "@/lib/store";
import { MangaCard } from "@/components/manga-card";
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

const STATUSES = ["all", "ongoing", "completed", "hiatus", "cancelled"];
const RATINGS = ["all", "safe", "suggestive", "erotica"];
const SORTS = [
  { value: "followedCount", label: "Most followed" },
  { value: "rating", label: "Top rated" },
  { value: "latestUploadedChapter", label: "Recently updated" },
  { value: "title", label: "Title" },
];

export function MangaBrowseView() {
  const initialSearch = useStore((s) => s.search);

  const [q, setQ] = React.useState(initialSearch);
  const [status, setStatus] = React.useState("all");
  const [rating, setRating] = React.useState("all");
  const [sort, setSort] = React.useState("followedCount");
  const [showFilters, setShowFilters] = React.useState(false);

  const [data, setData] = React.useState<MangaSummary[]>([]);
  const [offset, setOffset] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setQ(initialSearch);
  }, [initialSearch]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setOffset(0);
    const t = setTimeout(async () => {
      try {
        const res = await browseManga({
          q,
          status,
          contentRating: rating,
          sort,
          offset: 0,
        });
        if (!active) return;
        setData(res.data);
        setTotal(res.total);
        setOffset(res.offset);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (active) setLoading(false);
      }
    }, 450);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q, status, rating, sort]);

  const loadMore = async () => {
    if (loadingMore || data.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await browseManga({
        q,
        status,
        contentRating: rating,
        sort,
        offset: offset + 24,
      });
      setData((d) => [...d, ...res.data]);
      setOffset(res.offset);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const resetFilters = () => {
    setQ("");
    setStatus("all");
    setRating("all");
    setSort("followedCount");
  };

  const activeFilters =
    (status !== "all" ? 1 : 0) +
    (rating !== "all" ? 1 : 0) +
    (sort !== "followedCount" ? 1 : 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="section-accent" />
        <div>
          <h1 className="page-heading">Browse Manga</h1>
          <p className="page-subheading">
            Search thousands of manga titles on MangaDex.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search manga by title…"
            className="h-10 rounded-full border-border/70 bg-card/60 pl-9 shadow-sm focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/30"
            aria-label="Search manga"
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
          className="h-10 rounded-full"
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

      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-card p-4 sm:grid-cols-3">
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
            <label className="text-xs font-medium text-muted-foreground">Content</label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATINGS.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t === "all" ? "All content" : t}
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
              className="col-span-2 justify-start sm:col-span-3"
            >
              <X className="size-4" /> Reset all filters
            </Button>
          )}
        </div>
      )}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex w-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card"
            >
              <div className="aspect-[2/3] w-full shimmer" />
              <div className="space-y-2 p-2.5">
                <div className="h-3.5 w-full shimmer rounded" />
                <div className="h-3 w-1/2 shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-12 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-primary/10">
            <BookOpen className="size-7 text-primary" />
          </div>
          <p className="text-lg font-semibold">No manga found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try different keywords or filters.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.map((m) => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </div>
          {data.length < total && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="min-w-40 rounded-full"
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
