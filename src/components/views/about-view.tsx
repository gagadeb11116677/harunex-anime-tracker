"use client";

import { motion } from "framer-motion";
import { Send, Heart, Code2, Database, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export function AboutView() {
  const setView = useStore((s) => s.setView);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-8 text-center sm:p-12"
      >
        <div className="absolute inset-0 bg-aurora opacity-70" />
        <div className="relative">
          <div className="mx-auto mb-5 size-24 overflow-hidden rounded-3xl shadow-2xl ring-2 ring-primary/30">
            <Image
              src="/logo.png"
              alt="Harunex logo"
              width={96}
              height={96}
              className="size-full object-cover"
              priority
            />
          </div>
          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Harunex
          </h1>
          <p className="mt-2 text-base text-muted-foreground sm:text-lg">
            Your anime, beautifully tracked.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge className="bg-primary/15 text-primary border-primary/30">
              Powered by Jikan, MangaDex &amp; AniList
            </Badge>
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <Sparkles className="mr-1 size-3" /> v1.1 · Stable
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* v1.1 release notice */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
      >
        <h2 className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
          <Sparkles className="size-5" />
          What&apos;s new in v1.1
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Harunex v1.1 brings a faster, more complete experience. We added
          genre quick-filters in browse, export &amp; import for your list
          (JSON backup), sort options, anime relations in detail pages,
          recent searches, a stats overview, and a top loading bar. Performance
          is improved with smarter caching, image preloading, and faster
          search response — first load is now noticeably quicker.
        </p>
      </motion.div>

      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="size-5 text-primary" />
          What is Harunex?
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Harunex is a clean, modern tracker for both anime and manga. Browse
          and discover anime from MyAnimeList (Jikan) with trending picks from
          AniList, plus manga from MangaDex. Track your progress episode by
          episode or chapter by chapter, rate what you consume, and organize
          everything by status — all saved right in your browser.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Feature
          icon={<Code2 className="size-5 text-primary" />}
          title="Built modern"
          desc="Next.js, TypeScript, Tailwind CSS and shadcn/ui."
        />
        <Feature
          icon={<Database className="size-5 text-primary" />}
          title="Local-first"
          desc="Your list is saved in your browser. No account needed."
        />
        <Feature
          icon={<Sparkles className="size-5 text-primary" />}
          title="Rich data"
          desc="Scores, characters, recommendations and more from Jikan."
        />
      </div>

      {/* Credits */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4 text-center"
      >
        <div className="absolute inset-0 bg-aurora opacity-40" />
        <div className="relative">
          <h2 className="text-lg font-bold">Credits</h2>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-muted-foreground">Designed & built by</p>
            <p className="text-3xl font-extrabold tracking-tight">xobe</p>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Contact the developer on Telegram
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="btn-primary-gradient shadow-lg shadow-primary/25">
                <a
                  href="https://t.me/xobedevelopment2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="size-4" />
                  @xobedevelopment2
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://t.me/xobedev1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="size-4" />
                  @xobedev1
                </a>
              </Button>
            </div>
          </div>

          <p className="flex items-center justify-center gap-1.5 pt-4 text-xs text-muted-foreground">
            Made with <Heart className="size-3 text-primary" /> for anime fans
          </p>
        </div>
      </motion.div>

      <div className="text-center">
        <Button variant="outline" onClick={() => setView("home")}>
          Back to home
        </Button>
      </div>

      <p className="pb-4 text-center text-xs text-muted-foreground/70">
        Harunex is a demo project and is not affiliated with MyAnimeList. All
        anime data belongs to their respective owners.
      </p>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2 card-glow">
      <div className="grid size-10 place-items-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
