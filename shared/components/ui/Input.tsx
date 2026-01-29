"use client";

import React from "react";
import { cn } from "../../utils/cn";

// ─── Types ───────────────────────────────────────────────────
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label text displayed above the input */
  label?: string;
  /** Hint text displayed below the input */
  hint?: string;
  /** Error message — replaces hint and styles input with danger border */
  error?: string;
  /** Unit suffix displayed inside the input (e.g. "USDC", "%") */
  unit?: string;
  /** Left icon or element */
  leftElement?: React.ReactNode;
  /** Size variant */
  inputSize?: "sm" | "md" | "lg";
  /** Full-width container */
  fullWidth?: boolean;
}

// ─── Component ───────────────────────────────────────────────
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      hint,
      error,
      unit,
      leftElement,
      inputSize = "md",
      fullWidth = true,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const sizeClasses = {
      sm: "h-8 text-xs px-3",
      md: "h-10 text-sm px-4",
      lg: "h-12 text-base px-5",
    };

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-white"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Left element */}
          {leftElement && (
            <div className="absolute left-3 flex items-center text-[#888888] pointer-events-none">
              {leftElement}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(
              // Base styles
              "w-full rounded-lg",
              "bg-[rgba(255,255,255,0.03)]",
              "text-white placeholder:text-[#888888]/50",
              "font-sans",
              "transition-all duration-200",
              // Border
              error
                ? "border border-[#ff4444]/50 focus:border-[#ff4444] focus:ring-2 focus:ring-[#ff4444]/20"
                : "border border-[rgba(255,255,255,0.08)] focus:border-[#00ff88]/50 focus:ring-2 focus:ring-[#00ff88]/20",
              // Focus
              "outline-none",
              // Disabled
              "disabled:opacity-50 disabled:cursor-not-allowed",
              // Size
              sizeClasses[inputSize],
              // Left element padding
              leftElement && "pl-10",
              // Unit padding
              unit && "pr-14",
              // Mono font for number inputs
              (type === "number" || type === "tel") && "font-mono",
              className
            )}
            {...props}
          />

          {/* Unit suffix */}
          {unit && (
            <div
              className={cn(
                "absolute right-0 flex items-center justify-center",
                "h-full px-3",
                "text-xs font-medium text-[#888888]",
                "border-l border-[rgba(255,255,255,0.08)]",
                "bg-white/[0.02] rounded-r-lg",
                "pointer-events-none select-none",
                "font-mono uppercase tracking-wider"
              )}
            >
              {unit}
            </div>
          )}
        </div>

        {/* Hint / Error */}
        {(error || hint) && (
          <p
            className={cn(
              "text-xs",
              error ? "text-[#ff4444]" : "text-[#888888]"
            )}
            role={error ? "alert" : undefined}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
