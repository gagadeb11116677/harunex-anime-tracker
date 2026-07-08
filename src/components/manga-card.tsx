"use client";

import * as React from "react";
import { BookOpen, Check } from "lucide-react";
import type { MangaSummary } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Props {
  manga: MangaSummary;
  className?: string;
}

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='230' height='325'><rect width='100%' height='100%' fill='%23221a16'/><text x='50%' y='50%' fill='%23888080' font-family='sans-serif' font-size='12' text-anchor='middle' dominant-baseline='middle'>No cover</text></svg>`
  );

export function MangaCard({ manga, className }: Props) {
  const selectManga = useStore((s) => s.selectManga);
  const mangaItems = useStore((s) => s.mangaItems);
  const [imgOk, setImgOk] = React.useState(true);
  const tracked = mangaItems[manga.id];

  const img = manga.coverUrl || PLACEHOLDER;

  return (
    <button
      onClick={() => selectManga(manga.id)}
      className={cn(
        "group card-base pressable text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        <img
          src={imgOk ? img : PLACEHOLDER}
          alt={manga.title}
          loading="lazy"
          onError={() => setImgOk(false)}
          className="poster-img size-full object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
          <span className="badge-base badge-primary">
            <BookOpen className="size-3" />
            {manga.status || "Manga"}
          </span>
          {tracked && (
            <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-white/20">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        {tracked && tracked.totalChapters ? (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70"
              style={{
                width: `${Math.min(
                  100,
                  (tracked.progress / tracked.totalChapters) * 100
                )}%`,
              }}
            />
          </div>
        ) : null}
        {tracked && (
          <div className="absolute bottom-2 left-2">
            <span className="badge-base badge-info !px-1.5 !py-0.5 !text-[10px] uppercase tracking-wide">
              {tracked.status}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="line-clamp-2 text-xs text-white/90">
            {manga.description ? manga.description.replace(/<[^>]+>/g, "").slice(0, 90) + "…" : "Tap to view details"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h3 className="card-title" title={manga.title}>{manga.title}</h3>
        <div className="card-meta">
          {manga.year && <span>{manga.year}</span>}
          {manga.author ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{manga.author}</span>
            </>
          ) : null}
        </div>
      </div>
    </button>
  );
}
