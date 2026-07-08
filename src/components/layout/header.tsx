"use client";

import * as React from "react";
import { Search, Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import type { ContentType, View } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

const NAV: { key: View; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "browse", label: "Browse" },
  { key: "mylist", label: "My List" },
  { key: "about", label: "About" },
];

export function Header() {
  const { view, setView, setSearch, contentType, setContentType } = useStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setMounted(true), []);

  // keyboard shortcut: Ctrl/Cmd+K focuses search
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setView("browse");
        setMobileOpen(false);
        // focus after render
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setView]);

  const goBrowse = (query?: string) => {
    if (query !== undefined) {
      setSearch(query);
      setQ(query);
    }
    setView("browse");
    setMobileOpen(false);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goBrowse(q);
  };

  const onNav = (v: View) => {
    setView(v);
    setMobileOpen(false);
  };

  const switchContentType = (c: ContentType) => {
    setContentType(c);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => onNav("home")}
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="Harunex home"
        >
          <span className="relative size-9 overflow-hidden rounded-xl ring-1 ring-primary/30 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Harunex"
              fill
              sizes="36px"
              className="object-cover"
              priority
            />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-base font-extrabold tracking-tight">Harunex</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              v1.1
            </span>
          </span>
        </button>

        {/* Content type switch */}
        <div className="hidden items-center rounded-full border border-border/60 bg-card/40 p-0.5 md:flex">
          {(["anime", "manga"] as ContentType[]).map((c) => (
            <button
              key={c}
              onClick={() => switchContentType(c)}
              className={cn(
                "btn-hover-lift rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wide transition-all",
                contentType === c
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => onNav(n.key)}
              className={cn(
                "btn-hover-lift rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                view === n.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* Search */}
        <form
          onSubmit={onSearchSubmit}
          className="relative ml-auto hidden max-w-xs flex-1 items-center sm:flex"
        >
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={contentType === "anime" ? "Search anime…" : "Search manga…"}
            className="h-9 rounded-full border-border/70 bg-card/60 pl-9 pr-12 shadow-sm focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/30"
            aria-label="Search"
          />
          <kbd className="pointer-events-none absolute right-3 hidden select-none items-center gap-0.5 rounded border border-border/60 bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="rounded-full"
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-3">
            <div className="flex items-center rounded-full border border-border/60 bg-secondary/40 p-0.5">
              {(["anime", "manga"] as ContentType[]).map((c) => (
                <button
                  key={c}
                  onClick={() => switchContentType(c)}
                  className={cn(
                    "flex-1 rounded-full py-1.5 text-xs font-bold uppercase tracking-wide transition-all",
                    contentType === c
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <form onSubmit={onSearchSubmit} className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={contentType === "anime" ? "Search anime…" : "Search manga…"}
                className="h-10 rounded-full pl-9"
              />
            </form>
            <nav className="grid grid-cols-2 gap-1">
              {NAV.map((n) => (
                <button
                  key={n.key}
                  onClick={() => onNav(n.key)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                    view === n.key
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  {n.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
