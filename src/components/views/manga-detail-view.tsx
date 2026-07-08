"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Check,
  User,
  Calendar,
  Layers,
  Globe,
  Trash2,
  Tag,
  ExternalLink,
} from "lucide-react";
import {
  getMangaDetail,
  getMangaChapters,
  getMangaChapterCount,
} from "@/lib/mangadex";
import type { MangaDexChapter, MangaSummary, ReadStatus } from "@/lib/types";
import { useStore, STATUS_META, STATUS_ORDER } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/star-rating";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='230' height='325'><rect width='100%' height='100%' fill='%23221a16'/><text x='50%' y='50%' fill='%23888080' font-family='sans-serif' font-size='12' text-anchor='middle' dominant-baseline='middle'>No cover</text></svg>`
  );

export function MangaDetailView() {
  const id = useStore((s) => s.selectedMangaId);
  const setView = useStore((s) => s.setView);
  const setContentType = useStore((s) => s.setContentType);
  const mangaItems = useStore((s) => s.mangaItems);
  const addOrUpdateManga = useStore((s) => s.addOrUpdateManga);
  const setMangaStatus = useStore((s) => s.setMangaStatus);
  const setMangaProgress = useStore((s) => s.setMangaProgress);
  const setMangaRating = useStore((s) => s.setMangaRating);
  const removeManga = useStore((s) => s.removeManga);

  const [manga, setManga] = React.useState<MangaSummary | null>(null);
  const [chapters, setChapters] = React.useState<MangaDexChapter[]>([]);
  const [totalChapters, setTotalChapters] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [imgOk, setImgOk] = React.useState(true);
  const [backOk, setBackOk] = React.useState(true);

  React.useEffect(() => {
    if (!id) {
      setContentType("manga");
      setView("home");
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    setManga(null);
    setChapters([]);
    setTotalChapters(null);
    setImgOk(true);
    setBackOk(true);

    (async () => {
      try {
        const m = await getMangaDetail(id);
        if (!active) return;
        setManga(m);
        setLoading(false);
        // total chapter count
        getMangaChapterCount(id).then((n) => {
          if (active && n) setTotalChapters(n);
        });
        // chapters feed
        getMangaChapters(id, 24).then((c) => {
          if (active) setChapters(c);
        });
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [id, setView, setContentType]);

  const tracked = id ? mangaItems[id] : undefined;

  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setView("home")} />
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="aspect-[2/3] shimmer rounded-xl" />
          <div className="space-y-4">
            <div className="h-9 w-2/3 shimmer rounded" />
            <div className="h-4 w-1/3 shimmer rounded" />
            <div className="h-24 w-full shimmer rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setView("home")} />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">{error || "Manga not found."}</p>
        </div>
      </div>
    );
  }

  const effectiveTotal = totalChapters ?? (tracked?.totalChapters ?? null);

  const addToTracker = (status: ReadStatus) => {
    addOrUpdateManga(
      manga.id,
      {
        title: manga.title,
        image_url: manga.coverUrl,
        totalChapters: effectiveTotal,
      },
      status
    );
    toast({
      title: "Added to your manga list",
      description: `${manga.title} → ${STATUS_META[status].readingLabel}`,
    });
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={() => setView("home")} />

      {/* Backdrop */}
      <div className="relative -mx-4 h-56 overflow-hidden sm:-mx-6 sm:h-72">
        <img
          src={backOk && manga.coverUrl ? manga.coverUrl : PLACEHOLDER}
          alt=""
          onError={() => setBackOk(false)}
          className="size-full object-cover object-top opacity-40 blur-md scale-105"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-aurora opacity-50" />
      </div>

      <div className="relative -mt-40 grid gap-6 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr]">
        {/* Cover + tracker */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-black/40 ring-1 ring-primary/10"
          >
            <img
              src={imgOk && manga.coverUrl ? manga.coverUrl : PLACEHOLDER}
              alt={manga.title}
              onError={() => setImgOk(false)}
              className="size-full object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card-elevated rounded-2xl border border-border/60 bg-card/95 p-4 shadow-float backdrop-blur-sm space-y-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              My Tracker
            </h3>

            {!tracked ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Add this manga:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => addToTracker("plan")}
                    className="btn-primary-gradient col-span-2"
                  >
                    <Plus className="size-4" /> Add to list
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToTracker("watching")}
                  >
                    Reading
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToTracker("completed")}
                  >
                    Completed
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_META[tracked.status].color}>
                    {STATUS_META[tracked.status].readingLabel}
                  </Badge>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-500">
                    <Check className="size-3" /> Tracked
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <Select
                    value={tracked.status}
                    onValueChange={(v) => setMangaStatus(manga.id, v as ReadStatus)}
                  >
                    <SelectTrigger className="h-9">
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
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      Chapters read
                    </span>
                    <span className="font-semibold tabular-nums">
                      {tracked.progress}
                      {effectiveTotal ? ` / ${effectiveTotal}` : ""} ch
                    </span>
                  </div>
                  <Slider
                    value={[tracked.progress]}
                    max={effectiveTotal ?? Math.max(tracked.progress + 1, 24)}
                    min={0}
                    step={1}
                    onValueChange={(v) => setMangaProgress(manga.id, v[0])}
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 text-xs"
                      onClick={() =>
                        setMangaProgress(manga.id, Math.max(0, tracked.progress - 1))
                      }
                    >
                      −1 ch
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 text-xs"
                      onClick={() =>
                        setMangaProgress(manga.id, tracked.progress + 1)
                      }
                    >
                      +1 ch
                    </Button>
                    {effectiveTotal && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setMangaProgress(manga.id, effectiveTotal)}
                      >
                        Max
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Your rating
                  </label>
                  <StarRating
                    value={tracked.rating}
                    onChange={(v) => setMangaRating(manga.id, v)}
                    size={20}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => {
                    removeManga(manga.id);
                    toast({ title: "Removed from your manga list" });
                  }}
                >
                  <Trash2 className="size-4" /> Remove
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-6"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/90 text-primary-foreground">
                <BookOpen className="mr-1 size-3" /> Manga
              </Badge>
              {manga.status && (
                <Badge variant="secondary" className="capitalize">
                  {manga.status}
                </Badge>
              )}
              {manga.contentRating && manga.contentRating !== "safe" && (
                <Badge variant="outline" className="capitalize text-amber-500">
                  {manga.contentRating}
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-balance text-2xl font-extrabold leading-tight tracking-tight drop-shadow sm:text-4xl">
              {manga.title}
            </h1>
            {manga.altTitles?.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {manga.altTitles.slice(0, 3).join(" · ")}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Meta
              icon={<User className="size-4" />}
              label="Author"
              value={manga.author || "Unknown"}
            />
            <Meta
              icon={<Calendar className="size-4" />}
              label="Year"
              value={manga.year ? String(manga.year) : "—"}
            />
            <Meta
              icon={<Layers className="size-4" />}
              label="Last chapter"
              value={manga.lastChapter || (effectiveTotal ? String(effectiveTotal) : "—")}
            />
            <Meta
              icon={<Globe className="size-4" />}
              label="Languages"
              value={manga.availableLanguages?.length ? `${manga.availableLanguages.length} languages` : "—"}
            />
          </div>

          {/* Tags */}
          {manga.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {manga.tags.slice(0, 12).map((t) => (
                <Badge key={t} variant="secondary" className="font-normal">
                  <Tag className="mr-1 size-2.5" />
                  {t}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {manga.description && (
            <div>
              <h2 className="mb-2 text-lg font-bold">Synopsis</h2>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {manga.description.replace(/<[^>]+>/g, "")}
              </p>
            </div>
          )}

          <Separator />

          {/* Chapters */}
          {chapters.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Chapters</h2>
                <a
                  href={`https://mangadex.org/title/${manga.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Read on MangaDex <ExternalLink className="size-3.5" />
                </a>
              </div>
              <div className="max-h-96 space-y-1 overflow-y-auto thin-scrollbar rounded-lg border border-border/60 p-2">
                {chapters.map((c, idx) => {
                  const group = c.relationships?.find(
                    (r) => r.type === "scanlation_group"
                  );
                  return (
                    <a
                      key={c.id || idx}
                      href={`https://mangadex.org/chapter/${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary tabular-nums">
                        {c.attributes.chapter || "?"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-medium">
                          {c.attributes.title || `Chapter ${c.attributes.chapter || idx + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.attributes.translatedLanguage}
                          {group?.attributes?.name ? ` · ${group.attributes.name}` : ""}
                          {c.attributes.pages ? ` · ${c.attributes.pages}p` : ""}
                        </p>
                      </div>
                      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="-ml-2">
      <ArrowLeft className="size-4" /> Back
    </Button>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate font-medium">{value}</div>
      </div>
    </div>
  );
}
