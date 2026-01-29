import Link from 'next/link';
import { type ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  /** Optional right-aligned action slot */
  action?: ReactNode;
}

export default function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 mb-4" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <span key={idx} className="flex items-center gap-2">
                {idx > 0 && (
                  <span className="text-[#888888] text-xs select-none">/</span>
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-xs text-[#888888] uppercase tracking-[0.1em] transition-colors hover:text-white"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={`text-xs uppercase tracking-[0.1em] ${
                      isLast ? 'text-white' : 'text-[#888888]'
                    }`}
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-[#888888]">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
