"use client";

import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// ─── Spinner ─────────────────────────────────────────────────
const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn("animate-spin", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

// ─── Button Variants ─────────────────────────────────────────
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium font-sans",
    "rounded-lg",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97]",
    "select-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[#00ff88] text-black",
          "hover:bg-[#00ff88]/90 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]",
        ],
        secondary: [
          "bg-transparent text-white",
          "border border-[rgba(255,255,255,0.08)]",
          "hover:bg-white/5 hover:border-[rgba(255,255,255,0.15)]",
        ],
        danger: [
          "bg-[#ff4444] text-white",
          "hover:bg-[#ff4444]/90 hover:shadow-[0_0_20px_rgba(255,68,68,0.3)]",
        ],
        warning: [
          "bg-[#f97316] text-white",
          "hover:bg-[#f97316]/90 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]",
        ],
        outline: [
          "bg-transparent text-[#00ff88]",
          "border border-[#00ff88]/30",
          "hover:bg-[#00ff88]/10 hover:border-[#00ff88]/50",
        ],
        ghost: [
          "bg-transparent text-white",
          "hover:bg-white/5",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// ─── Types ───────────────────────────────────────────────────
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child element (uses Radix Slot) */
  asChild?: boolean;
  /** Show loading spinner and disable interactions */
  loading?: boolean;
  /** Icon to render before children */
  leftIcon?: React.ReactNode;
  /** Icon to render after children */
  rightIcon?: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className="h-4 w-4" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="inline-flex shrink-0">{leftIcon}</span>
            )}
            {children}
            {rightIcon && (
              <span className="inline-flex shrink-0">{rightIcon}</span>
            )}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
