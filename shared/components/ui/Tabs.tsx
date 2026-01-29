"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "../../utils/cn";

// ─── Context ─────────────────────────────────────────────────
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("Tabs compound components must be used within <Tabs>");
  }
  return ctx;
}

// ─── Tabs (Root) ─────────────────────────────────────────────
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Currently active tab value (controlled) */
  value?: string;
  /** Default active tab value (uncontrolled) */
  defaultValue?: string;
  /** Callback when active tab changes */
  onValueChange?: (value: string) => void;
}

const Tabs: React.FC<TabsProps> = ({
  value,
  defaultValue = "",
  onValueChange,
  className,
  children,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = value ?? internalValue;

  const setActiveTab = useCallback(
    (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};
Tabs.displayName = "Tabs";

// ─── TabsList ────────────────────────────────────────────────
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1",
        "rounded-lg p-1",
        "bg-white/[0.03]",
        "border border-[rgba(255,255,255,0.08)]",
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = "TabsList";

// ─── TabsTrigger ─────────────────────────────────────────────
export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Unique value for this tab */
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        disabled={disabled}
        onClick={() => setActiveTab(value)}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "px-4 py-2 rounded-md",
          "text-sm font-medium font-sans",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]/50",
          "disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-[#00ff88]/10 text-[#00ff88] shadow-sm"
            : "text-[#888888] hover:text-white hover:bg-white/5",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

// ─── TabsContent ─────────────────────────────────────────────
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Value matching a TabsTrigger */
  value: string;
  /** Keep content mounted when inactive (useful for forms) */
  forceMount?: boolean;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, forceMount = false, children, ...props }, ref) => {
    const { activeTab } = useTabsContext();
    const isActive = activeTab === value;

    if (!isActive && !forceMount) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${value}`}
        aria-labelledby={`tab-${value}`}
        hidden={!isActive}
        className={cn(
          "mt-3 focus-visible:outline-none",
          !isActive && "hidden",
          className
        )}
        tabIndex={0}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
