"use client";

import React from "react";
import { cn } from "../../utils/cn";

// ─── Base Skeleton ───────────────────────────────────────────
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md",
        "bg-white/[0.06]",
        "animate-pulse",
        // Shimmer overlay via gradient animation
        "relative overflow-hidden",
        "after:absolute after:inset-0",
        "after:bg-gradient-to-r after:from-transparent after:via-white/[0.04] after:to-transparent",
        "after:animate-[shimmer_2s_ease-in-out_infinite]",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

// ─── SkeletonText ────────────────────────────────────────────
export interface SkeletonTextProps {
  /** Number of text lines to render */
  lines?: number;
  className?: string;
  /** Line height class override */
  lineHeight?: string;
}

const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className,
  lineHeight = "h-4",
}) => (
  <div className={cn("flex flex-col gap-2.5", className)} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          lineHeight,
          // Last line is shorter for a natural look
          i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
        )}
      />
    ))}
  </div>
);
SkeletonText.displayName = "SkeletonText";

// ─── SkeletonCard ────────────────────────────────────────────
export interface SkeletonCardProps {
  className?: string;
  /** Show header area */
  showHeader?: boolean;
  /** Show footer area */
  showFooter?: boolean;
  /** Number of content lines */
  contentLines?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className,
  showHeader = true,
  showFooter = true,
  contentLines = 3,
}) => (
  <div
    className={cn(
      "rounded-xl border border-[rgba(255,255,255,0.08)]",
      "bg-[rgba(255,255,255,0.03)]",
      "overflow-hidden",
      className
    )}
    aria-hidden="true"
  >
    {showHeader && (
      <div className="px-5 pt-5 pb-0 flex flex-col gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    )}

    <div className="px-5 py-4">
      <SkeletonText lines={contentLines} />
    </div>

    {showFooter && (
      <div className="px-5 pb-5 pt-0 flex items-center gap-3 border-t border-[rgba(255,255,255,0.08)]">
        <Skeleton className="h-8 w-24 mt-4" />
        <Skeleton className="h-8 w-20 mt-4" />
      </div>
    )}
  </div>
);
SkeletonCard.displayName = "SkeletonCard";

// ─── SkeletonTable ───────────────────────────────────────────
export interface SkeletonTableProps {
  className?: string;
  /** Number of columns */
  columns?: number;
  /** Number of rows */
  rows?: number;
}

const SkeletonTable: React.FC<SkeletonTableProps> = ({
  className,
  columns = 4,
  rows = 5,
}) => (
  <div
    className={cn(
      "w-full rounded-xl border border-[rgba(255,255,255,0.08)]",
      "bg-[rgba(255,255,255,0.03)]",
      "overflow-hidden",
      className
    )}
    aria-hidden="true"
  >
    {/* Header */}
    <div className="flex gap-4 px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={`head-${i}`}
          className={cn(
            "h-3 flex-1",
            i === 0 && "max-w-[120px]",
            i === columns - 1 && "max-w-[80px]"
          )}
        />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div
        key={`row-${rowIdx}`}
        className={cn(
          "flex gap-4 px-4 py-3",
          rowIdx < rows - 1 && "border-b border-[rgba(255,255,255,0.08)]"
        )}
      >
        {Array.from({ length: columns }).map((_, colIdx) => (
          <Skeleton
            key={`cell-${rowIdx}-${colIdx}`}
            className={cn(
              "h-4 flex-1",
              colIdx === 0 && "max-w-[120px]",
              colIdx === columns - 1 && "max-w-[80px]"
            )}
          />
        ))}
      </div>
    ))}
  </div>
);
SkeletonTable.displayName = "SkeletonTable";

// ─── SkeletonCircle ──────────────────────────────────────────
export interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = 40,
  className,
}) => (
  <Skeleton
    className={cn("rounded-full shrink-0", className)}
    style={{ width: size, height: size }}
  />
);
SkeletonCircle.displayName = "SkeletonCircle";

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonCircle,
};
