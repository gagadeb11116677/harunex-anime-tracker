"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number; // 0-10
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
  className,
}: Props) {
  const [hover, setHover] = React.useState(0);
  const display = hover || value;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={readOnly ? undefined : "radiogroup"}
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((i) => {
        // each star = 2 points; support half via value/2
        const filled = display >= i * 2;
        const half = !filled && display >= i * 2 - 1;
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(i * 2)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => {
              if (readOnly) return;
              // click left half = i*2-1, right half = i*2 (approx, simpler: toggle to i*2)
              if (onChange) onChange(i * 2 === value ? 0 : i * 2);
            }}
            className={cn(
              "relative transition-transform",
              !readOnly && "cursor-pointer hover:scale-110",
              readOnly && "cursor-default"
            )}
            aria-label={`${i} star`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                filled || half
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
      <span className="ml-1.5 text-xs font-medium text-muted-foreground tabular-nums">
        {value > 0 ? `${value}/10` : "—"}
      </span>
    </div>
  );
}
