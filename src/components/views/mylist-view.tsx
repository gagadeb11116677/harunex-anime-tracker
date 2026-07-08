"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Trash2,
  ChevronRight,
  ListChecks,
  Film,
  BookOpen,
  Star,
  Clock,
  TrendingUp,
  Search,
  Tv,
  Sparkles,
  Download,
  Upload,
  ArrowUpDown,
} from "lucide-react";
import { useStore, STATUS_META, STATUS_ORDER } from "@/lib/store";
import { proxyImg } from "@/lib/utils";
import type {
  ContentType,
  MangaTrackedItem,
  TrackedItem,
  WatchStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { StarRating } from "@/components/star-rating";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

type ListKind = "all" | "anime" | "manga";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='140'><rect width='100%' height='100%' fill='%23221a16'/></svg>`
  );

export function MyListView() {
  const items = useStore((s) => s.items);
  const mangaItems = useStore((s) => s.mangaItems);
  const setView = useStore((s) => s.setView);
  const setContentType = useStore((s) => s.setContentType);
  const remove = useStore((s) => s.remove);
  const removeManga = useStore((s) => s.removeManga);
  const setProgress = useStore((s) => s.setProgress);
  const setRating = useStore((s) => s.setRating);
  const setStatus = useStore((s) => s.setStatus);
  const setMangaProgress = useStore((s) => s.setMangaProgress);
  const setMangaRating = useStore((s) => s.setMangaRating);
  const setMangaStatus = useStore((s) => s.setMangaStatus);
  const clearAll = useStore((s) => s.clearAll);
  const clearAllManga = useStore((s) => s.clearAllManga);

  const [kindTab, setKindTab] = React.useState<ListKind>("all");
  const [statusTab, setStatusTab] = React.useState<WatchStatus | "all">("all");
  const [sortBy, setSortBy] = React.useState<"recent" | "rating" | "title" | "progress">("recent");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const animeList = React.useMemo(() => {
    const list = Object.values(items) as TrackedItem[];
    const sorted = [...list];
    if (sortBy === "rating") return sorted.sort((a, b) => b.rating - a.rating);
    if (sortBy === "title") return sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "progress") return sorted.sort((a, b) => b.progress - a.progress);
    return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [items, sortBy]);
  const mangaList = React.useMemo(() => {
    const list = Object.values(mangaItems) as MangaTrackedItem[];
    const sorted = [...list];
    if (sortBy === "rating") return sorted.sort((a, b) => b.rating - a.rating);
    if (sortBy === "title") return sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "progress") return sorted.sort((a, b) => b.progress - a.progress);
    return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [mangaItems, sortBy]);

  const filteredAnime = React.useMemo(() => {
    if (statusTab === "all") return animeList;
    return animeList.filter((i) => i.status === statusTab);
  }, [animeList, statusTab]);
  const filteredManga = React.useMemo(() => {
    if (statusTab === "all") return mangaList;
    return mangaList.filter((i) => i.status === statusTab);
  }, [mangaList, statusTab]);

  const showAnime = kindTab === "all" || kindTab === "anime";
  const showManga = kindTab === "all" || kindTab === "manga";

  const total = animeList.length + mangaList.length;
  const totalEpisodes =
    animeList.reduce((s, i) => s + i.progress, 0) +
    mangaList.reduce((s, i) => s + i.progress, 0);
  const rated = [...animeList, ...mangaList].filter((i) => i.rating > 0);
  const avg =
    rated.length > 0
      ? rated.reduce((s, i) => s + i.rating, 0) / rated.length
      : 0;
  const completedCount =
    animeList.filter((i) => i.status === "completed").length +
    mangaList.filter((i) => i.status === "completed").length;

  if (!mounted) return <div className="h-64" />;

  const goBrowse = (c: ContentType) => {
    setContentType(c);
    setView("browse");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="section-accent" />
          <div>
            <h1 className="page-heading">My List</h1>
            <p className="page-subheading">
              Track anime &amp; manga. Saved locally in your browser.
            </p>
          </div>
        </div>
        {total > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort dropdown */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-9 w-[140px] text-xs">
                <ArrowUpDown className="mr-1 size-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently updated</SelectItem>
                <SelectItem value="rating">Highest rated</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="progress">Most progress</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const exportData = {
                  version: "1.1",
                  exportedAt: new Date().toISOString(),
                  anime: items,
                  manga: mangaItems,
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `harunex-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "List exported", description: "Backup downloaded as JSON" });
              }}
            >
              <Download className="size-4" /> Export
            </Button>

            {/* Import */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/json";
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    if (data.anime) {
                      Object.values(data.anime).forEach((item: any) => {
                        useStore.getState().addOrUpdate(item.mal_id, {
                          title: item.title,
                          image_url: item.image_url,
                          type: item.type,
                          episodes: item.episodes,
                          score: item.score,
                        }, item.status);
                        useStore.getState().setProgress(item.mal_id, item.progress);
                        useStore.getState().setRating(item.mal_id, item.rating);
                      });
                    }
                    if (data.manga) {
                      Object.values(data.manga).forEach((item: any) => {
                        useStore.getState().addOrUpdateManga(item.id, {
                          title: item.title,
                          image_url: item.image_url,
                          totalChapters: item.totalChapters,
                        }, item.status);
                        useStore.getState().setMangaProgress(item.id, item.progress);
                        useStore.getState().setMangaRating(item.id, item.rating);
                      });
                    }
                    toast({ title: "List imported", description: "Backup restored successfully" });
                  } catch {
                    toast({ title: "Import failed", description: "Invalid backup file" });
                  }
                };
                input.click();
              }}
            >
              <Upload className="size-4" /> Import
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm("Clear your entire list (anime + manga)? This can't be undone.")) {
                  clearAll();
                  clearAllManga();
                  toast({ title: "List cleared" });
                }
              }}
            >
              <Trash2 className="size-4" /> Clear
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<ListChecks className="size-4 text-primary" />}
            label="Total entries"
            value={total}
          />
          <StatCard
            icon={<Film className="size-4 text-primary" />}
            label="Episodes + chapters"
            value={totalEpisodes}
          />
          <StatCard
            icon={<Star className="size-4 text-amber-400" />}
            label="Average rating"
            value={avg > 0 ? avg.toFixed(1) : "—"}
          />
          <StatCard
            icon={<TrendingUp className="size-4 text-emerald-500" />}
            label="Completed"
            value={completedCount}
          />
        </div>
      )}

      {/* Contextual insight — a personal touch */}
      {total > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          {totalEpisodes === 0 ? (
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Tip:</span> Update
              your progress on each entry to see how much you&apos;ve watched and
              read over time.
            </p>
          ) : completedCount === 0 ? (
            <p className="text-muted-foreground">
              You&apos;ve logged{" "}
              <span className="font-semibold text-foreground">{totalEpisodes}</span>{" "}
              episodes &amp; chapters so far. Keep going — your first completion
              is right around the corner.
            </p>
          ) : (
            <p className="text-muted-foreground">
              You&apos;ve enjoyed{" "}
              <span className="font-semibold text-foreground">
                {totalEpisodes}
              </span>{" "}
              episodes &amp; chapters, and finished{" "}
              <span className="font-semibold text-foreground">
                {completedCount}
              </span>{" "}
              {completedCount === 1 ? "title" : "titles"}. That&apos;s dedication.
            </p>
          )}
        </div>
      )}

      {/* Kind tabs (All / Anime / Manga) */}
      <Tabs value={kindTab} onValueChange={(v) => setKindTab(v as ListKind)}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="all">
            All <span className="ml-1 text-xs text-muted-foreground">{total}</span>
          </TabsTrigger>
          <TabsTrigger value="anime">
            <Tv className="mr-1 size-3.5" /> Anime{" "}
            <span className="ml-1 text-xs text-muted-foreground">{animeList.length}</span>
          </TabsTrigger>
          <TabsTrigger value="manga">
            <BookOpen className="mr-1 size-3.5" /> Manga{" "}
            <span className="ml-1 text-xs text-muted-foreground">{mangaList.length}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Status filter */}
      <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as WatchStatus | "all")}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="all">
            Any status
          </TabsTrigger>
          {STATUS_ORDER.map((s) => (
            <TabsTrigger key={s} value={s}>
              {STATUS_META[s].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Empty overall */}
      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-12 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-primary/10">
            <Sparkles className="size-7 text-primary" />
          </div>
          <p className="text-lg font-semibold">Start your collection</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Your tracked anime and manga will appear here. Add titles from
            browse or detail pages — progress, ratings, and stats are saved
            locally in your browser.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button className="btn-primary-gradient" onClick={() => goBrowse("anime")}>
              <Search className="size-4" /> Browse anime
            </Button>
            <Button variant="outline" onClick={() => goBrowse("manga")}>
              <BookOpen className="size-4" /> Browse manga
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {showAnime && (
            <div className="space-y-3">
              {filteredAnime.length > 0 && (
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Tv className="size-4 text-primary" /> Anime
                  <span className="text-muted-foreground/60">({filteredAnime.length})</span>
                </div>
              )}
              {filteredAnime.map((item, idx) => (
                <AnimeListItem
                  key={`anime-${item.mal_id}`}
                  item={item}
                  index={idx}
                  onOpen={() => {
                    setContentType("anime");
                    useStore.getState().selectAnime(item.mal_id);
                  }}
                  onRemove={() => {
                    remove(item.mal_id);
                    toast({ title: "Removed", description: item.title });
                  }}
                  onProgress={(v) => setProgress(item.mal_id, v)}
                  onRating={(v) => setRating(item.mal_id, v)}
                  onStatus={(v) => setStatus(item.mal_id, v)}
                />
              ))}
            </div>
          )}

          {showManga && (
            <div className="space-y-3">
              {filteredManga.length > 0 && (
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <BookOpen className="size-4 text-primary" /> Manga
                  <span className="text-muted-foreground/60">({filteredManga.length})</span>
                </div>
              )}
              {filteredManga.map((item, idx) => (
                <MangaListItem
                  key={`manga-${item.id}`}
                  item={item}
                  index={idx}
                  onOpen={() => {
                    setContentType("manga");
                    useStore.getState().selectManga(item.id);
                  }}
                  onRemove={() => {
                    removeManga(item.id);
                    toast({ title: "Removed", description: item.title });
                  }}
                  onProgress={(v) => setMangaProgress(item.id, v)}
                  onRating={(v) => setMangaRating(item.id, v)}
                  onStatus={(v) => setMangaStatus(item.id, v)}
                />
              ))}
            </div>
          )}

          {/* per-kind empty */}
          {showAnime && filteredAnime.length === 0 && animeList.length > 0 && (
            <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              No anime with this status.
            </p>
          )}
          {showManga && filteredManga.length === 0 && mangaList.length > 0 && (
            <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              No manga with this status.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="card-elevated relative overflow-hidden rounded-xl border border-border/60 bg-card p-4">
      <div className="absolute -right-3 -top-3 size-16 rounded-full bg-primary/10 blur-xl" />
      <div className="relative flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="relative mt-1 text-2xl font-extrabold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function AnimeListItem({
  item,
  index,
  onOpen,
  onRemove,
  onProgress,
  onRating,
  onStatus,
}: {
  item: TrackedItem;
  index: number;
  onOpen: () => void;
  onRemove: () => void;
  onProgress: (v: number) => void;
  onRating: (v: number) => void;
  onStatus: (v: WatchStatus) => void;
}) {
  const [ok, setOk] = React.useState(true);
  const meta = STATUS_META[item.status];
  const maxEp = item.episodes ?? Math.max(item.progress + 1, 24);
  const pct = item.episodes
    ? Math.min(100, (item.progress / item.episodes) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
    >
      <div className="card-elevated group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-3 card-glow sm:flex-row sm:items-center">
        <button
          onClick={onOpen}
          className="group/poster relative aspect-[2/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-16"
          aria-label={`Open ${item.title}`}
        >
          <img
            src={ok ? proxyImg(item.image_url) || PLACEHOLDER : PLACEHOLDER}
            alt={item.title}
            onError={() => setOk(false)}
            className="size-full object-cover transition-transform duration-500 group-hover/poster:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover/poster:bg-black/25" />
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <button
                onClick={onOpen}
                title={item.title}
                className="line-clamp-1 text-left text-sm font-semibold leading-snug transition-colors hover:text-primary"
              >
                {item.title}
              </button>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-primary">
                  <Tv className="size-3" /> Anime
                </span>
                {item.type && <span>· {item.type}</span>}
                {item.score ? (
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    · <Star className="size-3 fill-amber-400" /> {item.score.toFixed(1)}
                  </span>
                ) : null}
                {item.episodes ? <span>· {item.episodes} eps</span> : null}
              </div>
            </div>
            <Badge className={meta.color}>{meta.label}</Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold tabular-nums">
                {item.progress}
                {item.episodes ? ` / ${item.episodes}` : ""} ep
                {pct > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ({Math.round(pct)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
            <Slider
              value={[item.progress]}
              max={maxEp}
              min={0}
              step={1}
              onValueChange={(v) => onProgress(v[0])}
              className="mt-1"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StarRating value={item.rating} onChange={onRating} size={16} />
            <div className="ml-auto flex items-center gap-2">
              <Select value={item.status} onValueChange={(v) => onStatus(v as WatchStatus)}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={onRemove}
                aria-label="Remove"
              >
                <Trash2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={onOpen}
                aria-label="Open"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MangaListItem({
  item,
  index,
  onOpen,
  onRemove,
  onProgress,
  onRating,
  onStatus,
}: {
  item: MangaTrackedItem;
  index: number;
  onOpen: () => void;
  onRemove: () => void;
  onProgress: (v: number) => void;
  onRating: (v: number) => void;
  onStatus: (v: WatchStatus) => void;
}) {
  const [ok, setOk] = React.useState(true);
  const meta = STATUS_META[item.status];
  const maxCh = item.totalChapters ?? Math.max(item.progress + 1, 24);
  const pct = item.totalChapters
    ? Math.min(100, (item.progress / item.totalChapters) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
    >
      <div className="card-elevated group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-3 card-glow sm:flex-row sm:items-center">
        <button
          onClick={onOpen}
          className="group/poster relative aspect-[2/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-16"
          aria-label={`Open ${item.title}`}
        >
          <img
            src={ok ? proxyImg(item.image_url) || PLACEHOLDER : PLACEHOLDER}
            alt={item.title}
            onError={() => setOk(false)}
            className="size-full object-cover transition-transform duration-500 group-hover/poster:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover/poster:bg-black/25" />
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <button
                onClick={onOpen}
                title={item.title}
                className="line-clamp-1 text-left text-sm font-semibold leading-snug transition-colors hover:text-primary"
              >
                {item.title}
              </button>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-primary">
                  <BookOpen className="size-3" /> Manga
                </span>
                {item.totalChapters ? <span>· {item.totalChapters} ch</span> : null}
              </div>
            </div>
            <Badge className={meta.color}>{meta.readingLabel}</Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold tabular-nums">
                {item.progress}
                {item.totalChapters ? ` / ${item.totalChapters}` : ""} ch
                {pct > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ({Math.round(pct)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
            <Slider
              value={[item.progress]}
              max={maxCh}
              min={0}
              step={1}
              onValueChange={(v) => onProgress(v[0])}
              className="mt-1"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StarRating value={item.rating} onChange={onRating} size={16} />
            <div className="ml-auto flex items-center gap-2">
              <Select value={item.status} onValueChange={(v) => onStatus(v as WatchStatus)}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].readingLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={onRemove}
                aria-label="Remove"
              >
                <Trash2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={onOpen}
                aria-label="Open"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
