"use client";

import * as React from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Play, Star, TrendingUp, Sparkles, Calendar, Trophy, Flame, Award } from "lucide-react";
import { getHomeSections, getTopAnime } from "@/lib/jikan";
import {
  getAniListTrending,
  getAniListPopularSeason,
  getAniListTopAllTime,
} from "@/lib/anilist";
import type { AniListMedia, Anime } from "@/lib/types";
import { useStore } from "@/lib/store";
import { proxyImg } from "@/lib/utils";
import { AnimeCard } from "@/components/anime-card";
import { AnimeCardSkeleton } from "@/components/anime-card-skeleton";
import { AniListCard } from "@/components/anilist-card";
import {
  HorizontalSection,
  HorizontalItem,
} from "@/components/horizontal-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'><rect width='100%' height='100%' fill='%231a1310'/></svg>`
  );

export function HomeView() {
  const { selectAnime, setView, setSearch } = useStore();
  const [data, setData] = React.useState<{
    trending: Anime[];
    seasonal: Anime[];
    top: Anime[];
    upcoming: Anime[];
    hero: Anime[];
  } | null>(null);
  const [anilist, setAnilist] = React.useState<AniListMedia[]>([]);
  const [anilistLoading, setAnilistLoading] = React.useState(true);
  const [anilistPopular, setAnilistPopular] = React.useState<AniListMedia[]>([]);
  const [anilistPopularLoading, setAnilistPopularLoading] = React.useState(true);
  const [anilistTop, setAnilistTop] = React.useState<AniListMedia[]>([]);
  const [anilistTopLoading, setAnilistTopLoading] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [heroIdx, setHeroIdx] = React.useState(0);
  const [heroImgOk, setHeroImgOk] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sections, top] = await Promise.all([
          getHomeSections(),
          getTopAnime(6),
        ]);
        if (!active) return;
        const heroPool = (top.length ? top : sections.top).slice(0, 6);
        setData({
          trending: sections.trending,
          seasonal: sections.seasonal,
          top: sections.top,
          upcoming: sections.upcoming,
          hero: heroPool,
        });
        setHeroIdx(0);
        // prefetch hero images biar instant saat rotate
        heroPool.slice(0, 3).forEach((h) => {
          const url = h.images?.jpg?.large_image_url || h.images?.webp?.large_image_url;
          if (url) {
            const img = new Image();
            img.src = `/api/img?url=${encodeURIComponent(url)}`;
          }
        });
      } catch (e) {
        if (!active) return;
        // Jikan failed — try AniList fallback for hero
        try {
          const alTop = await getAniListTopAllTime(6);
          if (!active || alTop.length === 0) throw new Error("no fallback");
          const fallbackHero: Anime[] = alTop.map((m) => ({
            mal_id: m.idMal || m.id,
            url: "",
            images: {
              jpg: {
                image_url: m.coverImage?.large || "",
                small_image_url: m.coverImage?.large || "",
                large_image_url: m.coverImage?.extraLarge || m.coverImage?.large || "",
              },
              webp: {
                image_url: m.coverImage?.large || "",
                small_image_url: m.coverImage?.large || "",
                large_image_url: m.coverImage?.extraLarge || m.coverImage?.large || "",
              },
            },
            title: m.title?.english || m.title?.romaji || m.title?.native || "Untitled",
            title_english: m.title?.english,
            type: m.format,
            episodes: m.episodes,
            score: m.averageScore ? m.averageScore / 10 : null,
            scored_by: null,
            rank: null,
            popularity: m.popularity,
            members: null,
            favorites: null,
            synopsis: m.description,
            background: null,
            status: m.status,
            airing: m.status === "RELEASING",
            aired: { string: m.seasonYear ? String(m.seasonYear) : "" },
            duration: null,
            rating: null,
            year: m.seasonYear,
            season: null,
            studios: m.studios?.nodes
              ? m.studios.nodes.filter((s) => s.isAnimationStudio).map((s) => ({ mal_id: 0, name: s.name }))
              : [],
            genres: m.genres || [],
            titles: [],
            themes: [],
            demographics: [],
            source: null,
            trailer: null,
            title_japanese: m.title?.native,
          } as Anime));
          if (!active) return;
          setData({
            trending: [],
            seasonal: [],
            top: [],
            upcoming: [],
            hero: fallbackHero,
          });
          setHeroIdx(0);
        } catch {
          if (active) setError("Jikan API is temporarily unavailable. AniList sections below still work — try refreshing in a moment.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    // AniList trending — load independently (non-blocking)
    getAniListTrending(12)
      .then((m) => { if (active) setAnilist(m); })
      .catch(() => {})
      .finally(() => { if (active) setAnilistLoading(false); });
    getAniListPopularSeason(12)
      .then((m) => { if (active) setAnilistPopular(m); })
      .catch(() => {})
      .finally(() => { if (active) setAnilistPopularLoading(false); });
    getAniListTopAllTime(12)
      .then((m) => { if (active) setAnilistTop(m); })
      .catch(() => {})
      .finally(() => { if (active) setAnilistTopLoading(false); });
    return () => {
      active = false;
    };
  }, []);

  // hero rotation
  React.useEffect(() => {
    if (!data?.hero?.length) return;
    const t = setInterval(() => {
      setHeroIdx((i) => (i + 1) % data.hero.length);
      setHeroImgOk(true);
    }, 7000);
    return () => clearInterval(t);
  }, [data?.hero?.length]);

  const hero = data?.hero?.[heroIdx];

  // parallax for hero image
  const heroRef = React.useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 120]);

  // greeting time-aware — only after mount to avoid hydration mismatch
  const [greeting, setGreeting] = React.useState<string>("");
  React.useEffect(() => {
    const h = new Date().getHours();
    if (h < 5) setGreeting("Burning the midnight oil");
    else if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else if (h < 21) setGreeting("Good evening");
    else setGreeting("Late night session");
  }, []);

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* ===== Cinematic Hero ===== */}
      <section ref={heroRef} className="relative -mx-4 -mt-6 overflow-hidden rounded-none sm:-mx-6 sm:rounded-2xl">
        <div className="relative h-[72vh] min-h-[520px] w-full">
          <AnimatePresence mode="wait">
            {hero && (
              <motion.img
                key={hero.mal_id}
                style={{ y: heroY }}
                src={
                  heroImgOk
                    ? proxyImg(
                        hero.images?.jpg?.large_image_url ||
                          hero.images?.webp?.large_image_url
                      ) || PLACEHOLDER
                    : PLACEHOLDER
                }
                alt={hero.title}
                onError={() => setHeroImgOk(false)}
                className="absolute inset-0 size-full object-cover object-center"
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>
          {!hero && <div className="absolute inset-0 shimmer" />}

          {/* Cinematic overlays — diagonal + atmospheric + grain */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-chart-5/5" />
          <div className="grain-overlay absolute inset-0" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 sm:pb-16">
              {loading && !hero ? (
                <div className="max-w-2xl space-y-3">
                  <div className="h-3 w-28 shimmer rounded-full" />
                  <div className="h-14 w-3/4 max-w-xl shimmer rounded-xl" />
                  <div className="h-4 w-full max-w-lg shimmer rounded" />
                  <div className="h-4 w-2/3 max-w-md shimmer rounded" />
                  <div className="mt-4 flex gap-3">
                    <div className="h-11 w-36 shimmer rounded-full" />
                    <div className="h-11 w-32 shimmer rounded-full" />
                  </div>
                </div>
              ) : hero ? (
                <motion.div
                  key={hero.mal_id}
                  initial="hidden"
                  animate="show"
                  className="max-w-2xl space-y-5"
                >
                  {/* Greeting + tagline — integrated, warmer */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.4 }}
                    className="space-y-1"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary/90">
                      {greeting || "Welcome"} · Featured pick
                    </p>
                  </motion.div>

                  {/* Badges — bigger, premium */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    {hero.airing && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/40 backdrop-blur-md">
                        <span className="inline-block size-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Currently Airing
                      </span>
                    )}
                    {hero.score && (
                      <span className="pill-score inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30 backdrop-blur-md">
                        <Star className="size-3.5 fill-amber-300" />
                        {hero.score.toFixed(2)}
                      </span>
                    )}
                    {hero.rank && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-border/60 backdrop-blur-md">
                        <Award className="size-3 text-primary" /> #{hero.rank}
                      </span>
                    )}
                  </motion.div>

                  {/* Title — big, tight kerning, dramatic */}
                  <motion.h1
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-depth font-display text-balance text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl"
                  >
                    {hero.title_english || hero.title}
                  </motion.h1>

                  {/* Meta — clear hierarchy, studio prominent */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                  >
                    {hero.studios?.[0]?.name && (
                      <span className="font-semibold text-foreground/90">
                        {hero.studios[0].name}
                      </span>
                    )}
                    <span className="flex items-center gap-2 text-foreground/60">
                      {hero.type && <span>{hero.type}</span>}
                      {hero.episodes && (
                        <>
                          <span className="text-border">•</span>
                          <span>{hero.episodes} eps</span>
                        </>
                      )}
                      {hero.year && (
                        <>
                          <span className="text-border">•</span>
                          <span>{hero.year}</span>
                        </>
                      )}
                    </span>
                  </motion.div>

                  {/* Synopsis — readable, capped width */}
                  <motion.p
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="line-clamp-3 max-w-xl text-sm leading-relaxed text-foreground/80 sm:text-base"
                  >
                    {hero.synopsis || "No synopsis available."}
                  </motion.p>

                  {/* Actions — prominent CTA */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="flex flex-wrap items-center gap-3 pt-2"
                  >
                    <Button
                      onClick={() => selectAnime(hero.mal_id)}
                      size="lg"
                      className="btn-hover-lift btn-primary-gradient h-12 rounded-full px-7 text-base font-semibold shadow-xl shadow-primary/30"
                    >
                      <Play className="size-4 fill-current" /> View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setView("browse")}
                      className="btn-hover-lift h-12 rounded-full border-border/60 bg-card/40 px-7 text-base font-semibold backdrop-blur-md hover:bg-card/70"
                    >
                      Browse more
                    </Button>
                  </motion.div>

                  {/* Hero pagination dots */}
                  {data?.hero && data.hero.length > 1 && (
                    <div className="flex items-center gap-2 pt-6">
                      {data.hero.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setHeroIdx(i);
                            setHeroImgOk(true);
                          }}
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: i === heroIdx ? 36 : 12,
                            background:
                              i === heroIdx
                                ? "var(--primary)"
                                : "color-mix(in oklch, var(--muted-foreground) 50%, transparent)",
                          }}
                          aria-label={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Sections ===== */}
      {error ? (
        <div className="mx-auto max-w-md rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="btn-hover-lift mt-4"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="space-y-10 sm:space-y-14">
          <Section
            title="Trending Now"
            subtitle="Currently airing, highest rated"
            icon={<TrendingUp className="size-5" />}
            loading={loading}
            items={data?.trending}
            onSeeAll={() => {
              setSearch("");
              setView("browse");
            }}
          />
          <Section
            title="This Season"
            subtitle="Anime airing right now"
            icon={<Calendar className="size-5" />}
            loading={loading}
            items={data?.seasonal}
            onSeeAll={() => {
              setSearch("");
              setView("browse");
            }}
          />
          <Section
            title="All-Time Top"
            subtitle="The highest rated anime ever"
            icon={<Trophy className="size-5" />}
            loading={loading}
            items={data?.top}
            onSeeAll={() => {
              setSearch("");
              setView("browse");
            }}
          />
          <Section
            title="Coming Soon"
            subtitle="Upcoming releases"
            icon={<Sparkles className="size-5" />}
            loading={loading}
            items={data?.upcoming}
            onSeeAll={() => {
              setSearch("");
              setView("browse");
            }}
          />

          {/* AniList sections — supplementary data */}
          <AniListSection
            title="Trending on AniList"
            subtitle="What the AniList community is buzzing about"
            icon={<Flame className="size-5" />}
            items={anilist}
            loading={anilistLoading}
            onSeeAll={() => {
              setSearch("");
              setView("browse");
            }}
          />
          <AniListSection
            title="Popular This Season"
            subtitle="AniList's most popular right now"
            icon={<Sparkles className="size-5" />}
            items={anilistPopular}
            loading={anilistPopularLoading}
            onSeeAll={() => {
              setSearch("");
              setView("browse");
            }}
          />
          <AniListSection
            title="AniList Top Rated"
            subtitle="The highest scored anime on AniList"
            icon={<Star className="size-5" />}
            items={anilistTop}
            loading={anilistTopLoading}
            onSeeAll={() => {
              setSearch("");
              setView("browse");
            }}
          />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  loading,
  items,
  onSeeAll,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  loading: boolean;
  items?: Anime[];
  onSeeAll?: () => void;
}) {
  return (
    <HorizontalSection
      title={title}
      subtitle={subtitle}
      onSeeAll={onSeeAll}
      accentIcon={icon}
    >
      {loading || !items
        ? Array.from({ length: 8 }).map((_, i) => (
            <HorizontalItem key={i}>
              <AnimeCardSkeleton />
            </HorizontalItem>
          ))
        : items.map((a) => (
            <HorizontalItem key={a.mal_id}>
              <AnimeCard anime={a} />
            </HorizontalItem>
          ))}
    </HorizontalSection>
  );
}

function AniListSection({
  title,
  subtitle,
  icon,
  items,
  loading,
  onSeeAll,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: AniListMedia[];
  loading: boolean;
  onSeeAll?: () => void;
}) {
  if (items.length === 0 && !loading) return null;
  return (
    <HorizontalSection
      title={title}
      subtitle={subtitle}
      onSeeAll={onSeeAll}
      accentIcon={icon}
    >
      {loading || items.length === 0
        ? Array.from({ length: 8 }).map((_, i) => (
            <HorizontalItem key={i}>
              <AnimeCardSkeleton />
            </HorizontalItem>
          ))
        : items.map((m) => (
            <HorizontalItem key={`al-${m.id}`}>
              <AniListCard media={m} />
            </HorizontalItem>
          ))}
    </HorizontalSection>
  );
}
