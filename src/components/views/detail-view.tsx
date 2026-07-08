"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Play,
  Plus,
  Check,
  Users,
  Sparkles,
  Calendar,
  Tv,
  Clock,
  Building2,
  Award,
  Trash2,
} from "lucide-react";
import {
  getAnimeFull,
  getAnimeCharacters,
  getAnimeRecommendations,
  getAnimeRelations,
} from "@/lib/jikan";
import type { Anime, CharacterEntry, Recommendation, Relation, WatchStatus } from "@/lib/types";
import { useStore, STATUS_META, STATUS_ORDER } from "@/lib/store";
import { proxyImg } from "@/lib/utils";
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
import { AnimeCard } from "@/components/anime-card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='230' height='325'><rect width='100%' height='100%' fill='%23221a16'/><text x='50%' y='50%' fill='%23888080' font-family='sans-serif' font-size='12' text-anchor='middle' dominant-baseline='middle'>No image</text></svg>`
  );

export function DetailView() {
  const id = useStore((s) => s.selectedId);
  const setView = useStore((s) => s.setView);
  const items = useStore((s) => s.items);
  const addOrUpdate = useStore((s) => s.addOrUpdate);
  const setStatus = useStore((s) => s.setStatus);
  const setProgress = useStore((s) => s.setProgress);
  const setRating = useStore((s) => s.setRating);
  const remove = useStore((s) => s.remove);

  const [anime, setAnime] = React.useState<Anime | null>(null);
  const [chars, setChars] = React.useState<CharacterEntry[]>([]);
  const [recs, setRecs] = React.useState<Recommendation[]>([]);
  const [relations, setRelations] = React.useState<Relation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [imgOk, setImgOk] = React.useState(true);
  const [backImgOk, setBackImgOk] = React.useState(true);

  React.useEffect(() => {
    if (!id) {
      setView("home");
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    setAnime(null);
    setChars([]);
    setRecs([]);
    setImgOk(true);
    setBackImgOk(true);

    (async () => {
      try {
        const a = await getAnimeFull(id);
        if (!active) return;
        setAnime(a);
        setLoading(false);
        try {
          const c = await getAnimeCharacters(id);
          if (active) setChars(c.slice(0, 12));
        } catch {
          /* non-fatal */
        }
        try {
          const r = await getAnimeRecommendations(id);
          if (active) setRecs(r.slice(0, 12));
        } catch {
          /* non-fatal */
        }
        try {
          const rel = await getAnimeRelations(id);
          if (active) setRelations(rel);
        } catch {
          /* non-fatal */
        }
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
  }, [id, setView]);

  const tracked = id ? items[id] : undefined;

  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setView("home")} />
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
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

  if (error || !anime) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => setView("home")} />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">{error || "Anime not found."}</p>
        </div>
      </div>
    );
  }

  const addToTracker = (status: WatchStatus) => {
    addOrUpdate(
      anime.mal_id,
      {
        title: anime.title_english || anime.title,
        image_url:
          anime.images?.webp?.large_image_url ||
          anime.images?.jpg?.image_url ||
          "",
        type: anime.type,
        episodes: anime.episodes,
        score: anime.score,
      },
      status
    );
    toast({
      title: "Added to your list",
      description: `${anime.title_english || anime.title} → ${STATUS_META[status].label}`,
    });
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={() => setView("home")} />

      {/* Cinematic backdrop */}
      <div className="relative -mx-4 h-56 overflow-hidden sm:-mx-6 sm:h-72">
        <img
          src={
            backImgOk
              ? proxyImg(anime.images?.jpg?.large_image_url) || PLACEHOLDER
              : PLACEHOLDER
          }
          alt=""
          onError={() => setBackImgOk(false)}
          className="size-full object-cover object-top opacity-40 blur-md scale-105"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-aurora opacity-50" />
      </div>

      <div className="relative -mt-40 grid gap-6 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr]">
        {/* Poster + floating tracker */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-black/40 ring-1 ring-primary/10"
          >
            <img
              src={
                imgOk
                  ? proxyImg(
                      anime.images?.webp?.large_image_url ||
                        anime.images?.jpg?.large_image_url
                    ) || PLACEHOLDER
                  : PLACEHOLDER
              }
              alt={anime.title}
              onError={() => setImgOk(false)}
              className="size-full object-cover"
            />
          </motion.div>

          {/* Tracker panel */}
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
                <p className="text-sm text-muted-foreground">
                  Add this to your list:
                </p>
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
                    Watching
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
                    {STATUS_META[tracked.status].label}
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
                    onValueChange={(v) => setStatus(anime.mal_id, v as WatchStatus)}
                  >
                    <SelectTrigger className="h-9">
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
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      Progress
                    </span>
                    <span className="font-semibold tabular-nums">
                      {tracked.progress}
                      {anime.episodes ? ` / ${anime.episodes}` : ""} ep
                    </span>
                  </div>
                  <Slider
                    value={[tracked.progress]}
                    max={anime.episodes ?? Math.max(tracked.progress + 1, 24)}
                    min={0}
                    step={1}
                    onValueChange={(v) => setProgress(anime.mal_id, v[0])}
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 text-xs"
                      onClick={() =>
                        setProgress(anime.mal_id, Math.max(0, tracked.progress - 1))
                      }
                    >
                      −1 ep
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 text-xs"
                      onClick={() =>
                        setProgress(
                          anime.mal_id,
                          Math.min(
                            anime.episodes ?? tracked.progress + 1,
                            tracked.progress + 1
                          )
                        )
                      }
                    >
                      +1 ep
                    </Button>
                    {anime.episodes && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          setProgress(anime.mal_id, anime.episodes as number)
                        }
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
                    onChange={(v) => setRating(anime.mal_id, v)}
                    size={20}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => {
                    remove(anime.mal_id);
                    toast({ title: "Removed from your list" });
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
              {anime.airing && (
                <Badge className="bg-emerald-500/90 text-white">
                  <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-white" />
                  Airing
                </Badge>
              )}
              {anime.type && <Badge variant="secondary">{anime.type}</Badge>}
              {anime.rating && (
                <Badge variant="outline" className="text-muted-foreground">
                  {anime.rating.split(" ")[0]}
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-balance text-2xl font-extrabold leading-tight tracking-tight drop-shadow sm:text-4xl">
              {anime.title_english || anime.title}
            </h1>
            {anime.title_japanese && (
              <p className="mt-1 text-sm text-muted-foreground">
                {anime.title_japanese}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={<Star className="size-4 text-amber-400" />}
              label="Score"
              value={anime.score ? anime.score.toFixed(2) : "—"}
              sub={anime.scored_by ? `${anime.scored_by.toLocaleString()} users` : undefined}
            />
            <Stat
              icon={<Award className="size-4 text-primary" />}
              label="Rank"
              value={anime.rank ? `#${anime.rank}` : "—"}
            />
            <Stat
              icon={<Users className="size-4 text-primary" />}
              label="Members"
              value={anime.members ? anime.members.toLocaleString() : "—"}
            />
            <Stat
              icon={<Sparkles className="size-4 text-primary" />}
              label="Favorites"
              value={anime.favorites ? anime.favorites.toLocaleString() : "—"}
            />
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Meta icon={<Tv className="size-4" />} label="Episodes" value={anime.episodes ? String(anime.episodes) : "Unknown"} />
            <Meta icon={<Clock className="size-4" />} label="Duration" value={anime.duration || "—"} />
            <Meta icon={<Calendar className="size-4" />} label="Aired" value={anime.aired?.string || "—"} />
            <Meta icon={<Building2 className="size-4" />} label="Studio" value={anime.studios?.[0]?.name || "—"} />
            <Meta icon={<Play className="size-4" />} label="Status" value={(anime.status as string) || "—"} />
            <Meta icon={<Sparkles className="size-4" />} label="Source" value={anime.source || "—"} />
          </div>

          {/* Genres */}
          {anime.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {anime.genres.map((g) => (
                <Badge key={g.mal_id} variant="secondary" className="font-normal">
                  {g.name}
                </Badge>
              ))}
              {anime.themes?.map((g) => (
                <Badge key={g.mal_id} variant="outline" className="font-normal text-muted-foreground">
                  {g.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {anime.synopsis && (
            <div>
              <h2 className="mb-2 text-lg font-bold">Synopsis</h2>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {anime.synopsis}
              </p>
            </div>
          )}

          {anime.background && (
            <div>
              <h2 className="mb-2 text-lg font-bold">Background</h2>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {anime.background}
              </p>
            </div>
          )}

          <Separator />

          {/* Characters */}
          {chars.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold">Characters</h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {chars.map((c) => (
                  <CharacterCard key={c.character.mal_id} c={c} />
                ))}
              </div>
            </div>
          )}

          {/* Relations */}
          {relations.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold">Relations</h2>
              <div className="space-y-2">
                {relations.slice(0, 6).map((rel, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card/40 p-2.5">
                    <span className="badge-base badge-primary shrink-0">
                      {rel.relation}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rel.entry.slice(0, 3).map((e) => (
                        <button
                          key={e.mal_id}
                          onClick={() => e.type === "anime" && useStore.getState().selectAnime(e.mal_id)}
                          className="btn-hover-lift rounded-md bg-secondary/60 px-2 py-0.5 text-xs font-medium hover:bg-secondary"
                        >
                          {e.name}
                          <span className="ml-1 text-muted-foreground capitalize">({e.type})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recs.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold">Recommendations</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {recs.map((r) => (
                  <AnimeCard
                    key={r.entry.mal_id}
                    anime={
                      {
                        mal_id: r.entry.mal_id,
                        title: r.entry.title,
                        images: r.entry.images,
                        type: null,
                        episodes: null,
                        score: null,
                        year: null,
                      } as Anime
                    }
                  />
                ))}
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

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card-elevated rounded-xl border border-border/60 bg-card/80 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-extrabold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
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

function CharacterCard({ c }: { c: CharacterEntry }) {
  const [ok, setOk] = React.useState(true);
  const img = proxyImg(c.character?.images?.jpg?.image_url);
  return (
    <div className="group overflow-hidden rounded-lg border border-border/60 bg-card card-glow">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        <img
          src={ok ? img : PLACEHOLDER}
          alt={c.character?.name}
          loading="lazy"
          onError={() => setOk(false)}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-2">
        <p className="line-clamp-1 text-xs font-semibold">{c.character?.name}</p>
        {c.role && (
          <p className="text-[10px] uppercase tracking-wide text-primary/80">
            {c.role}
          </p>
        )}
      </div>
    </div>
  );
}
