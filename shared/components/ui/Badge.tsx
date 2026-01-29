"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// ─── Animated Dot ────────────────────────────────────────────
const AnimatedDot: React.FC<{ color: string; pulse?: boolean }> = ({
  color,
  pulse = true,
}) => (
  <span className="relative flex h-2 w-2">
    {pulse && (
      <span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
          color
        )}
      />
    )}
    <span
      className={cn(
        "relative inline-flex h-2 w-2 rounded-full",
        color
      )}
    />
  </span>
);

// ─── Badge Variants ──────────────────────────────────────────
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-full",
    "text-xs font-medium font-sans",
    "px-2.5 py-0.5",
    "transition-colors duration-150",
    "select-none",
    "whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        live: [
          "bg-[#00ff88]/15 text-[#00ff88]",
          "border border-[#00ff88]/25",
        ],
        ending: [
          "bg-[#f97316]/15 text-[#f97316]",
          "border border-[#f97316]/25",
        ],
        ended: [
          "bg-white/5 text-[#888888]",
          "border border-[rgba(255,255,255,0.08)]",
        ],
        drawing: [
          "bg-blue-500/15 text-blue-400",
          "border border-blue-500/25",
        ],
        scheduled: [
          "bg-purple-500/15 text-purple-400",
          "border border-purple-500/25",
        ],
        success: [
          "bg-[#00ff88]/15 text-[#00ff88]",
          "border border-[#00ff88]/25",
        ],
        warning: [
          "bg-[#f97316]/15 text-[#f97316]",
          "border border-[#f97316]/25",
        ],
        danger: [
          "bg-[#ff4444]/15 text-[#ff4444]",
          "border border-[#ff4444]/25",
        ],
        gold: [
          "bg-[#FFD700]/15 text-[#FFD700]",
          "border border-[#FFD700]/25",
        ],
        silver: [
          "bg-[#C0C0C0]/15 text-[#C0C0C0]",
          "border border-[#C0C0C0]/25",
        ],
        default: [
          "bg-white/5 text-white",
          "border border-[rgba(255,255,255,0.08)]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// ─── Dot configuration per variant ───────────────────────────
const DOT_CONFIG: Partial<
  Record<
    NonNullable<VariantProps<typeof badgeVariants>["variant"]>,
    { color: string; pulse: boolean }
  >
> = {
  live: { color: "bg-[#00ff88]", pulse: true },
  ending: { color: "bg-[#f97316]", pulse: true },
  drawing: { color: "bg-blue-400", pulse: true },
  scheduled: { color: "bg-purple-400", pulse: false },
  ended: { color: "bg-[#888888]", pulse: false },
};

// ─── Types ───────────────────────────────────────────────────
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Override whether to show the animated dot */
  showDot?: boolean;
}

// ─── Component ───────────────────────────────────────────────
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, showDot, children, ...props }, ref) => {
    const dotConfig = variant ? DOT_CONFIG[variant] : undefined;
    const shouldShowDot = showDot ?? !!dotConfig;

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      >
        {shouldShowDot && dotConfig && (
          <AnimatedDot color={dotConfig.color} pulse={dotConfig.pulse} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
