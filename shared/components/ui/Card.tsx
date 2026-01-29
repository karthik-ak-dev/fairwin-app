"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// ─── Card Variants ───────────────────────────────────────────
const cardVariants = cva(
  [
    "rounded-xl border",
    "transition-all duration-200",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-[rgba(255,255,255,0.03)]",
          "border-[rgba(255,255,255,0.08)]",
        ],
        highlight: [
          "bg-[rgba(255,255,255,0.03)]",
          "border-[#00ff88]/30",
          "shadow-[0_0_15px_rgba(0,255,136,0.08)]",
          "hover:shadow-[0_0_25px_rgba(0,255,136,0.15)]",
          "hover:border-[#00ff88]/50",
        ],
        gradient: [
          "bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(0,255,136,0.03)]",
          "border-[rgba(255,255,255,0.08)]",
          "hover:from-[rgba(255,255,255,0.07)] hover:to-[rgba(0,255,136,0.05)]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// ─── Card ────────────────────────────────────────────────────
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

// ─── CardHeader ──────────────────────────────────────────────
export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1.5 px-5 pt-5 pb-0",
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// ─── CardContent ─────────────────────────────────────────────
export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-5 py-4", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

// ─── CardFooter ──────────────────────────────────────────────
export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center px-5 pt-0 pb-5",
        "border-t border-[rgba(255,255,255,0.08)]",
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// ─── CardTitle (convenience) ─────────────────────────────────
export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-lg font-semibold text-white leading-tight tracking-tight",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

// ─── CardDescription (convenience) ──────────────────────────
export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#888888]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  cardVariants,
};
