// ─── UI Component Barrel Exports ─────────────────────────────
// All shared UI components for FairWin

// Button
export { Button, buttonVariants } from "./Button";
export type { ButtonProps } from "./Button";

// Card
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  cardVariants,
} from "./Card";
export type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardTitleProps,
  CardDescriptionProps,
} from "./Card";

// Badge
export { Badge, badgeVariants } from "./Badge";
export type { BadgeProps } from "./Badge";

// Input
export { Input } from "./Input";
export type { InputProps } from "./Input";

// Select
export { Select } from "./Select";
export type { SelectProps, SelectOption } from "./Select";

// Dialog
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
export type {
  DialogProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogFooterProps,
} from "./Dialog";

// Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from "./Tabs";

// Table
export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableEmpty,
} from "./Table";
export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableCaptionProps,
  TableEmptyProps,
} from "./Table";

// Skeleton
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonCircle,
} from "./Skeleton";
export type {
  SkeletonProps,
  SkeletonTextProps,
  SkeletonCardProps,
  SkeletonTableProps,
  SkeletonCircleProps,
} from "./Skeleton";

// Toast
export { ToastProvider, useToast } from "./Toast";
export type {
  Toast,
  ToastVariant,
  ToastOptions,
  ToastProviderProps,
} from "./Toast";
