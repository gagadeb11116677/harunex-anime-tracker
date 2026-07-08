"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSeeAll?: () => void;
  accentIcon?: React.ReactNode;
}

export function HorizontalSection({
  title,
  subtitle,
  children,
  onSeeAll,
  accentIcon,
}: Props) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="section-accent" />
          <div>
            <h2 className="section-title">{title}</h2>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="group btn-hover-lift mr-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              See all
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
          <button
            onClick={() => scrollBy(-1)}
            className="btn-hover-lift grid size-8 place-items-center rounded-full border border-border/60 transition-colors hover:border-primary/40 hover:bg-secondary active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="btn-hover-lift grid size-8 place-items-center rounded-full border border-border/60 transition-colors hover:border-primary/40 hover:bg-secondary active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className={cn(
          "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:px-0"
        )}
      >
        {children}
      </div>
    </motion.section>
  );
}

export function HorizontalItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[160px] shrink-0 snap-start sm:w-[180px]">{children}</div>
  );
}
