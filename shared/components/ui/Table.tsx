"use client";

import React from "react";
import { cn } from "../../utils/cn";

// ─── Table ───────────────────────────────────────────────────
export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table";

// ─── TableHeader ─────────────────────────────────────────────
export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-[rgba(255,255,255,0.08)]",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

// ─── TableBody ───────────────────────────────────────────────
export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
);
TableBody.displayName = "TableBody";

// ─── TableRow ────────────────────────────────────────────────
export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Clickable row */
  clickable?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, clickable, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-[rgba(255,255,255,0.08)]",
        "transition-colors duration-150",
        "hover:bg-white/[0.02]",
        clickable && "cursor-pointer hover:bg-white/[0.04]",
        "data-[state=selected]:bg-white/[0.04]",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

// ─── TableHead ───────────────────────────────────────────────
export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-11 px-4 text-left align-middle",
        "text-xs font-medium text-[#888888] uppercase tracking-wider",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

// ─── TableCell ───────────────────────────────────────────────
export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-4 py-3 align-middle",
        "text-sm text-white",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

// ─── TableCaption ────────────────────────────────────────────
export interface TableCaptionProps
  extends React.HTMLAttributes<HTMLTableCaptionElement> {}

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  TableCaptionProps
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      "mt-4 text-sm text-[#888888]",
      className
    )}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

// ─── TableEmpty ──────────────────────────────────────────────
export interface TableEmptyProps {
  colSpan: number;
  message?: string;
  className?: string;
}

const TableEmpty: React.FC<TableEmptyProps> = ({
  colSpan,
  message = "No data available",
  className,
}) => (
  <TableRow>
    <TableCell
      colSpan={colSpan}
      className={cn("h-24 text-center text-[#888888]", className)}
    >
      {message}
    </TableCell>
  </TableRow>
);
TableEmpty.displayName = "TableEmpty";

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableEmpty,
};
