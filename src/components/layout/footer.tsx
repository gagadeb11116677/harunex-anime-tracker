"use client";

import { Send, Heart } from "lucide-react";
import { useStore } from "@/lib/store";
import Image from "next/image";

export function Footer() {
  const setView = useStore((s) => s.setView);

  return (
    <footer className="mt-auto border-t border-border/60 bg-background/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-8 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
        <div className="flex items-center gap-3">
          <span className="relative size-8 overflow-hidden rounded-lg ring-1 ring-primary/30">
            <Image
              src="/logo.png"
              alt="Harunex"
              fill
              sizes="32px"
              className="object-cover"
            />
          </span>
          <div className="text-sm">
            <div className="font-semibold text-foreground">
              Harunex{" "}
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                v1.1
              </span>
            </div>
            <div className="text-muted-foreground">
              Built with{" "}
              <Heart className="inline size-3 text-primary" aria-label="love" />{" "}
              by <span className="font-semibold text-foreground">xobe</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setView("about")}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </button>
          <span className="text-border" aria-hidden>
            |
          </span>
          <a
            href="https://t.me/xobedevelopment2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Send className="size-3.5" />
            @xobedevelopment2
          </a>
          <a
            href="https://t.me/xobedev1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Send className="size-3.5" />
            @xobedev1
          </a>
        </div>
      </div>
      <div className="border-t border-border/40 px-4 py-2.5 text-center text-xs text-muted-foreground/70">
        Harunex v1 · Data by Jikan, MangaDex &amp; AniList
      </div>
    </footer>
  );
}
