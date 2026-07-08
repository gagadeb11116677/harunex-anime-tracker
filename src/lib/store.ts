// ===== Harunex global store (Zustand + persist) =====

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ContentType,
  MangaTrackedItem,
  ReadStatus,
  TrackedItem,
  View,
  WatchStatus,
} from "./types";

interface State {
  // navigation
  view: View;
  selectedId: number | null;
  selectedMangaId: string | null;
  contentType: ContentType;
  // browse state
  search: string;
  // tracker (anime)
  items: Record<number, TrackedItem>;
  // tracker (manga)
  mangaItems: Record<string, MangaTrackedItem>;

  // actions
  setView: (v: View) => void;
  setContentType: (c: ContentType) => void;
  selectAnime: (id: number) => void;
  selectManga: (id: string) => void;
  setSearch: (q: string) => void;

  // anime tracker
  addOrUpdate: (
    id: number,
    data: Omit<TrackedItem, "status" | "progress" | "rating" | "addedAt" | "updatedAt">,
    status?: WatchStatus
  ) => void;
  setStatus: (id: number, status: WatchStatus) => void;
  setProgress: (id: number, progress: number) => void;
  setRating: (id: number, rating: number) => void;
  remove: (id: number) => void;
  clearAll: () => void;

  // manga tracker
  addOrUpdateManga: (
    id: string,
    data: Omit<MangaTrackedItem, "status" | "progress" | "rating" | "addedAt" | "updatedAt">,
    status?: ReadStatus
  ) => void;
  setMangaStatus: (id: string, status: ReadStatus) => void;
  setMangaProgress: (id: string, progress: number) => void;
  setMangaRating: (id: string, rating: number) => void;
  removeManga: (id: string) => void;
  clearAllManga: () => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      view: "home",
      selectedId: null,
      selectedMangaId: null,
      contentType: "anime",
      search: "",
      items: {},
      mangaItems: {},

      setView: (v) => set({ view: v }),
      setContentType: (c) => set({ contentType: c, view: "home" }),
      selectAnime: (id) => set({ selectedId: id, view: "detail" }),
      selectManga: (id) => set({ selectedMangaId: id, view: "detail" }),
      setSearch: (q) => set({ search: q }),

      // ===== Anime tracker =====
      addOrUpdate: (id, data, status = "plan") =>
        set((s) => {
          const existing = s.items[id];
          const now = Date.now();
          return {
            items: {
              ...s.items,
              [id]: {
                ...data,
                status: existing?.status ?? status,
                progress: existing?.progress ?? 0,
                rating: existing?.rating ?? 0,
                addedAt: existing?.addedAt ?? now,
                updatedAt: now,
              },
            },
          };
        }),
      setStatus: (id, status) =>
        set((s) => {
          const it = s.items[id];
          if (!it) return s;
          return {
            items: { ...s.items, [id]: { ...it, status, updatedAt: Date.now() } },
          };
        }),
      setProgress: (id, progress) =>
        set((s) => {
          const it = s.items[id];
          if (!it) return s;
          let status = it.status;
          if (
            it.episodes &&
            progress >= it.episodes &&
            (status === "watching" || status === "plan")
          ) {
            status = "completed";
          } else if (
            progress > 0 &&
            progress < (it.episodes ?? Infinity) &&
            status === "plan"
          ) {
            status = "watching";
          }
          return {
            items: { ...s.items, [id]: { ...it, progress, status, updatedAt: Date.now() } },
          };
        }),
      setRating: (id, rating) =>
        set((s) => {
          const it = s.items[id];
          if (!it) return s;
          return {
            items: { ...s.items, [id]: { ...it, rating, updatedAt: Date.now() } },
          };
        }),
      remove: (id) =>
        set((s) => {
          const next = { ...s.items };
          delete next[id];
          return { items: next };
        }),
      clearAll: () => set({ items: {} }),

      // ===== Manga tracker =====
      addOrUpdateManga: (id, data, status = "plan") =>
        set((s) => {
          const existing = s.mangaItems[id];
          const now = Date.now();
          return {
            mangaItems: {
              ...s.mangaItems,
              [id]: {
                ...data,
                status: existing?.status ?? status,
                progress: existing?.progress ?? 0,
                rating: existing?.rating ?? 0,
                addedAt: existing?.addedAt ?? now,
                updatedAt: now,
              },
            },
          };
        }),
      setMangaStatus: (id, status) =>
        set((s) => {
          const it = s.mangaItems[id];
          if (!it) return s;
          return {
            mangaItems: { ...s.mangaItems, [id]: { ...it, status, updatedAt: Date.now() } },
          };
        }),
      setMangaProgress: (id, progress) =>
        set((s) => {
          const it = s.mangaItems[id];
          if (!it) return s;
          let status = it.status;
          if (
            it.totalChapters &&
            progress >= it.totalChapters &&
            (status === "watching" || status === "plan")
          ) {
            status = "completed";
          } else if (
            progress > 0 &&
            (it.totalChapters ? progress < it.totalChapters : true) &&
            status === "plan"
          ) {
            status = "watching";
          }
          return {
            mangaItems: {
              ...s.mangaItems,
              [id]: { ...it, progress, status, updatedAt: Date.now() },
            },
          };
        }),
      setMangaRating: (id, rating) =>
        set((s) => {
          const it = s.mangaItems[id];
          if (!it) return s;
          return {
            mangaItems: { ...s.mangaItems, [id]: { ...it, rating, updatedAt: Date.now() } },
          };
        }),
      removeManga: (id) =>
        set((s) => {
          const next = { ...s.mangaItems };
          delete next[id];
          return { mangaItems: next };
        }),
      clearAllManga: () => set({ mangaItems: {} }),
    }),
    {
      name: "harunex-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, mangaItems: s.mangaItems }),
    }
  )
);

// status metadata
export const STATUS_META: Record<
  WatchStatus,
  { label: string; short: string; color: string; dot: string; readingLabel: string }
> = {
  watching: {
    label: "Watching",
    short: "Watching",
    color: "bg-sky-500/15 text-sky-500 border-sky-500/30",
    dot: "bg-sky-500",
    readingLabel: "Reading",
  },
  completed: {
    label: "Completed",
    short: "Done",
    color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    dot: "bg-emerald-500",
    readingLabel: "Completed",
  },
  plan: {
    label: "Plan to Watch",
    short: "Plan",
    color: "bg-primary/15 text-primary border-primary/30",
    dot: "bg-primary",
    readingLabel: "Plan to Read",
  },
  onhold: {
    label: "On Hold",
    short: "Hold",
    color: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    dot: "bg-amber-500",
    readingLabel: "On Hold",
  },
  dropped: {
    label: "Dropped",
    short: "Drop",
    color: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    dot: "bg-rose-500",
    readingLabel: "Dropped",
  },
};

export const STATUS_ORDER: WatchStatus[] = [
  "watching",
  "completed",
  "plan",
  "onhold",
  "dropped",
];
