'use client';

import { useState } from 'react';

interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchField?: keyof T;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxHeight?: string; // e.g., "520px" for scrollable tables
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  searchField,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  maxHeight,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data based on search
  const filteredData = searchable && searchField
    ? data.filter((item) => {
        const value = item[searchField];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      })
    : data;

  return (
    <div>
      {/* Search Bar */}
      {searchable && (
        <div className="mb-4">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full sm:w-64 px-4 py-2 bg-white/[0.02] border border-white/8 rounded-lg text-white text-sm focus:outline-none focus:border-accent focus:bg-white/[0.05] transition-all placeholder:text-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Card Layout */}
      <div className={`sm:hidden space-y-3 ${maxHeight ? `${maxHeight} overflow-y-auto` : ''}`}>
        {filteredData.length > 0 ? (
          filteredData.map((row, rowIndex) => (
            <div key={rowIndex} className="bg-white/[0.02] border border-white/8 rounded-lg p-4">
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-b-0">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">{column.label}</span>
                  <span className="text-sm font-medium">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">{emptyMessage}</div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className={`hidden sm:block ${maxHeight ? `${maxHeight} overflow-y-auto` : ''}`}>
        {/* Header */}
        <div className="grid gap-4 pb-3 border-b border-white/8 text-xs text-gray-400 uppercase tracking-wider"
          style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((column) => (
            <div key={column.key} className={`text-${column.align || 'left'}`}>
              {column.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-0">
          {filteredData.length > 0 ? (
            filteredData.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid gap-4 py-3 border-b border-white/8 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
              >
                {columns.map((column) => (
                  <div key={column.key} className={`text-${column.align || 'left'} text-sm`}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">{emptyMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
}
