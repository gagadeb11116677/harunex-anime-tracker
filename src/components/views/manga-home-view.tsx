"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star, Clock, BookOpen, TrendingUp } from "lucide-react";
import { getMangaHome } from "@/lib/mangadex";
import type { MangaSummary } from "@/lib/types";
import { useStore } from "@/lib/store";
import { MangaCard } from "@/components/manga-card";
import {
  HorizontalSection,
  HorizontalItem,
} from "@/components/horizontal-section";

export function MangaHomeView() {
  const { setView, setSearch } = useStore();
  const [data, setData] = React.useState<{
    popular: MangaSummary[];
    topRated: MangaSummary[];
    recent: MangaSummary[];
    topYear: MangaSummary[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await getMangaHome();
        if (!active) return;
        setData(d);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Manga hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-elevated relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-8 sm:p-12"
      >
        <div className="absolute inset-0 bg-aurora opacity-50" />
        <div className="relative max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20">
            <BookOpen className="size-3.5" /> Manga · MangaDex
          </span>
          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Read & track manga
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Discover manga from MangaDex, track chapters you&apos;ve read, and
            build your reading list — all alongside your anime tracker.
          </p>
        </div>
      </motion.div>

      {error ? (
        <div className="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">
            Couldn&apos;t load manga data. MangaDex API may be rate-limiting.
          </p>
        </div>
      ) : (
        <div className="space-y-10 sm:space-y-14">
          <Section
            title="Most Followed"
            subtitle="The most popular manga on MangaDex"
            icon={<Flame className="size-5" />}
            loading={loading}
            items={data?.popular}
            onSeeAll={() => {
              setSearch("");
              setView("browse");
            }}
          />
          <Section
            title="Top Rated"
            subtitle="Highest rated by readers"
            icon={<Star className="size-5" />}
            loading={loading}
            items={data?.topRated}
            onSeeAll={() => {
              setSearch("");
              setView("browse");
            }}
          />
          <Section
            title="Recently Updated"
            subtitle="Fresh chapters uploaded"
            icon={<Clock className="size-5" />}
            loading={loading}
            items={data?.recent}
            onSeeAll={() => {
              setSearch("");
              setView("browse");
            }}
          />
          {data?.topYear && data.topYear.length > 0 ? (
            <Section
              title={`Top of ${new Date().getFullYear()}`}
              subtitle="This year's most followed new manga"
              icon={<TrendingUp className="size-5" />}
              loading={loading}
              items={data?.topYear}
              onSeeAll={() => {
                setSearch("");
                setView("browse");
              }}
            />
          ) : null}
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
  items?: MangaSummary[];
  onSeeAll?: () => void;
}) {
  return (
    <HorizontalSection title={title} subtitle={subtitle} onSeeAll={onSeeAll} accentIcon={icon}>
      {loading || !items
        ? Array.from({ length: 8 }).map((_, i) => (
            <HorizontalItem key={i}>
              <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
                <div className="aspect-[2/3] w-full shimmer" />
                <div className="space-y-2 p-2.5">
                  <div className="h-3.5 w-full shimmer rounded" />
                  <div className="h-3 w-1/2 shimmer rounded" />
                </div>
              </div>
            </HorizontalItem>
          ))
        : items.map((m) => (
            <HorizontalItem key={m.id}>
              <MangaCard manga={m} />
            </HorizontalItem>
          ))}
    </HorizontalSection>
  );
}
