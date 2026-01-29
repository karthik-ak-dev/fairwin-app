"use client";

import React from "react";
import { cn } from "../../utils/cn";

// ─── SelectOption ────────────────────────────────────────────
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// ─── Types ───────────────────────────────────────────────────
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Label text displayed above the select */
  label?: string;
  /** Hint text displayed below the select */
  hint?: string;
  /** Error message — replaces hint and styles with danger border */
  error?: string;
  /** Array of option objects */
  options?: SelectOption[];
  /** Placeholder text (first disabled option) */
  placeholder?: string;
  /** Size variant */
  selectSize?: "sm" | "md" | "lg";
  /** Full-width container */
  fullWidth?: boolean;
}

// ─── Chevron Icon ────────────────────────────────────────────
const ChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Component ───────────────────────────────────────────────
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      hint,
      error,
      options,
      placeholder,
      selectSize = "md",
      fullWidth = true,
      id,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const sizeClasses = {
      sm: "h-8 text-xs pl-3 pr-8",
      md: "h-10 text-sm pl-4 pr-10",
      lg: "h-12 text-base pl-5 pr-12",
    };

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-white"
          >
            {label}
          </label>
        )}

        {/* Select wrapper */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              // Base
              "w-full appearance-none rounded-lg",
              "bg-[rgba(255,255,255,0.03)]",
              "text-white",
              "font-sans cursor-pointer",
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
              sizeClasses[selectSize],
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {/* Chevron indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#888888]">
            <ChevronDown />
          </div>
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

Select.displayName = "Select";

export { Select };
