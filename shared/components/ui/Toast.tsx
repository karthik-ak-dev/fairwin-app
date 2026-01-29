"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";

// ─── Types ───────────────────────────────────────────────────
export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number; // ms, default 5000
}

export interface ToastOptions {
  variant?: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  /** Convenience: toast.success("title") */
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Hook ────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

// ─── Icons ───────────────────────────────────────────────────
const icons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg
      className="h-5 w-5 text-[#00ff88] shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg
      className="h-5 w-5 text-[#ff4444] shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg
      className="h-5 w-5 text-blue-400 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg
      className="h-5 w-5 text-[#f97316] shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

const variantBorderColors: Record<ToastVariant, string> = {
  success: "border-l-[#00ff88]",
  error: "border-l-[#ff4444]",
  info: "border-l-blue-400",
  warning: "border-l-[#f97316]",
};

// ─── Close Icon ──────────────────────────────────────────────
const CloseIcon: React.FC = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 4L4 12M4 4l8 8" />
  </svg>
);

// ─── Single Toast Item ───────────────────────────────────────
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const dur = toast.duration ?? 5000;
    if (dur > 0) {
      timerRef.current = setTimeout(() => onDismiss(toast.id), dur);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={cn(
        "pointer-events-auto flex items-start gap-3",
        "w-[380px] max-w-[calc(100vw-2rem)]",
        "rounded-lg p-4",
        "bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)]",
        "border-l-4",
        variantBorderColors[toast.variant],
        "shadow-lg shadow-black/40"
      )}
      role="alert"
      aria-live="assertive"
    >
      {icons[toast.variant]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white leading-tight">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-1 text-xs text-[#888888] leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          "shrink-0 rounded-md p-1",
          "text-[#888888] hover:text-white",
          "hover:bg-white/5",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]/50"
        )}
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
    </motion.div>
  );
};

// ─── Toast Provider ──────────────────────────────────────────
export interface ToastProviderProps {
  children: React.ReactNode;
  /** Maximum visible toasts at once (default: 5) */
  maxToasts?: number;
}

let toastCounter = 0;

const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options: ToastOptions): string => {
      const id = `toast-${++toastCounter}-${Date.now()}`;
      const toast: Toast = {
        id,
        variant: options.variant ?? "info",
        title: options.title,
        description: options.description,
        duration: options.duration,
      };

      setToasts((prev) => {
        const next = [toast, ...prev];
        // Trim excess toasts
        if (next.length > maxToasts) {
          return next.slice(0, maxToasts);
        }
        return next;
      });

      return id;
    },
    [maxToasts]
  );

  const success = useCallback(
    (title: string, description?: string) =>
      addToast({ variant: "success", title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      addToast({ variant: "error", title, description }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) =>
      addToast({ variant: "info", title, description }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      addToast({ variant: "warning", title, description }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info, warning }}
    >
      {children}
      {/* Toast container — fixed top-right */}
      <div
        className={cn(
          "fixed top-4 right-4 z-[100]",
          "flex flex-col gap-2",
          "pointer-events-none"
        )}
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
ToastProvider.displayName = "ToastProvider";

export { ToastProvider };
