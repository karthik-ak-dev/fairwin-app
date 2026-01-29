"use client";

import React, { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";

// ─── Close Icon ──────────────────────────────────────────────
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M15 5L5 15M5 5L15 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Overlay ─────────────────────────────────────────────────
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// ─── Content animations ─────────────────────────────────────
const contentVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

// ─── Types ───────────────────────────────────────────────────
export interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog should close */
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  /** Max width class override (default: max-w-md) */
  maxWidth?: string;
  /** Show close button */
  showClose?: boolean;
  /** Close callback (injected by Dialog) */
  onClose?: () => void;
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface DialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

// ─── Dialog (Root) ───────────────────────────────────────────
const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Content container — centered */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            {React.Children.map(children, (child) => {
              if (React.isValidElement<DialogContentProps>(child)) {
                return React.cloneElement(child, {
                  onClose: () => onOpenChange(false),
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
Dialog.displayName = "Dialog";

// ─── DialogContent ───────────────────────────────────────────
const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      className,
      children,
      maxWidth = "max-w-md",
      showClose = true,
      onClose,
    },
    ref
  ) => (
    <motion.div
      ref={ref}
      className={cn(
        "relative w-full pointer-events-auto",
        maxWidth,
        "rounded-xl",
        "bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)]",
        "shadow-2xl shadow-black/50",
        "p-6",
        className
      )}
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={(e) => e.stopPropagation()}
    >
      {showClose && onClose && (
        <button
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4",
            "rounded-lg p-1",
            "text-[#888888] hover:text-white",
            "hover:bg-white/5",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]/50"
          )}
          aria-label="Close dialog"
        >
          <CloseIcon />
        </button>
      )}
      {children}
    </motion.div>
  )
);
DialogContent.displayName = "DialogContent";

// ─── DialogHeader ────────────────────────────────────────────
const DialogHeader: React.FC<DialogHeaderProps> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col gap-1.5 mb-4 pr-8", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

// ─── DialogTitle ─────────────────────────────────────────────
const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "text-lg font-semibold text-white leading-tight",
        className
      )}
      {...props}
    />
  )
);
DialogTitle.displayName = "DialogTitle";

// ─── DialogDescription ──────────────────────────────────────
const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#888888]", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

// ─── DialogFooter ────────────────────────────────────────────
const DialogFooter: React.FC<DialogFooterProps> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex items-center justify-end gap-3 mt-6 pt-4",
      "border-t border-[rgba(255,255,255,0.08)]",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
