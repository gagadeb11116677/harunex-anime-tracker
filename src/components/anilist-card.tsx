"use client";

import * as React from "react";
import { Star, Sparkles } from "lucide-react";
import type { AniListMedia } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn, proxyImg } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='230' height='325'><rect width='100%' height='100%' fill='%23221a16'/></svg>`
  );

interface Props {
  media: AniListMedia;
  className?: string;
}

export function AniListCard({ media, className }: Props) {
  const selectAnime = useStore((s) => s.selectAnime);
  const setView = useStore((s) => s.setView);
  const [imgOk, setImgOk] = React.useState(true);
  const img = proxyImg(
    media.coverImage?.extraLarge || media.coverImage?.large
  ) || PLACEHOLDER;
  const title = media.title?.english || media.title?.romaji || media.title?.native || "Untitled";

  const handleClick = () => {
    // Prefer MyAnimeList ID (Jikan can fetch full detail)
    if (media.idMal) {
      selectAnime(media.idMal);
    } else {
      // No MAL link — fall back to browse search by title
      useStore.getState().setSearch(title);
      setView("browse");
      toast({
        title: "No direct MAL link",
        description: "Searching in browse instead.",
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group card-base pressable text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        <img
          src={imgOk ? img : PLACEHOLDER}
          alt={title}
          loading="lazy"
          onError={() => setImgOk(false)}
          className="poster-img size-full object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
          {media.averageScore ? (
            <span className="badge-base bg-emerald-500/15 text-emerald-300 ring-emerald-400/30 backdrop-blur-md">
              <Star className="size-3 fill-emerald-300" />
              {(media.averageScore / 10).toFixed(1)}
            </span>
          ) : (
            <span />
          )}
          <span className="badge-base bg-[#3b6ee9]/80 text-white ring-white/20 backdrop-blur-md !text-[10px]">
            <Sparkles className="size-2.5" /> AniList
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="line-clamp-2 text-xs text-white/90">
            {media.description
              ? media.description.replace(/<[^>]+>/g, "").slice(0, 90) + "…"
              : "Tap to view details"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h3 className="card-title" title={title}>{title}</h3>
        <div className="card-meta">
          {media.format && <span>{media.format}</span>}
          {media.episodes ? (
            <>
              <span aria-hidden>·</span>
              <span>{media.episodes} ep</span>
            </>
          ) : null}
          {media.seasonYear ? (
            <>
              <span aria-hidden>·</span>
              <span>{media.seasonYear}</span>
            </>
          ) : null}
        </div>
      </div>
    </button>
  );
}
