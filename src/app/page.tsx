"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HomeView } from "@/components/views/home-view";
import { BrowseView } from "@/components/views/browse-view";
import { DetailView } from "@/components/views/detail-view";
import { MyListView } from "@/components/views/mylist-view";
import { AboutView } from "@/components/views/about-view";
import { MangaHomeView } from "@/components/views/manga-home-view";
import { MangaBrowseView } from "@/components/views/manga-browse-view";
import { MangaDetailView } from "@/components/views/manga-detail-view";

export default function Home() {
  const view = useStore((s) => s.view);
  const contentType = useStore((s) => s.contentType);

  // scroll to top on view change
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [view, contentType]);

  // a composite key for transition that reflects both view + content type
  const transitionKey = `${contentType}:${view}`;

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-aurora" />
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={transitionKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {contentType === "anime" &&
              (view === "home" && <HomeView />)}
            {contentType === "anime" && view === "browse" && <BrowseView />}
            {contentType === "anime" && view === "detail" && <DetailView />}
            {contentType === "manga" && view === "home" && <MangaHomeView />}
            {contentType === "manga" && view === "browse" && <MangaBrowseView />}
            {contentType === "manga" && view === "detail" && <MangaDetailView />}
            {/* shared */}
            {view === "mylist" && <MyListView />}
            {view === "about" && <AboutView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
