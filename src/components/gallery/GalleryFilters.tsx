import { Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArtifactStatus } from '@/types';
import type { GalleryFilters as GalleryFiltersType } from '@/hooks/useGalleryFilters';

interface GalleryFiltersProps {
  filters: GalleryFiltersType;
  setSearch: (search: string) => void;
  setStatus: (status: ArtifactStatus | 'all') => void;
  setSortBy: (sortBy: 'date' | 'name' | 'status') => void;
  toggleSortOrder: () => void;
  resultCount: number;
}

const STATUS_OPTIONS: { value: ArtifactStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'images-captured', label: 'Images Captured' },
  { value: 'processing-3d', label: 'Processing 3D' },
  { value: 'processing-info', label: 'Processing Info' },
  { value: 'complete', label: 'Complete' },
  { value: 'error', label: 'Error' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
] as const;

export function GalleryFilters({
  filters,
  setSearch,
  setStatus,
  setSortBy,
  toggleSortOrder,
  resultCount,
}: GalleryFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-gray" />
        <input
          type="text"
          placeholder="Search artifacts..."
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-desert-sand bg-aged-paper py-2.5 pl-10 pr-4 text-sm text-charcoal placeholder:text-stone-gray focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20 transition-colors"
        />
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => setStatus(e.target.value as ArtifactStatus | 'all')}
            className="w-full rounded-lg border border-desert-sand bg-aged-paper py-2.5 pl-3 pr-8 text-sm text-charcoal focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20 transition-colors appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 text-stone-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Sort By */}
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'status')}
            className="w-full rounded-lg border border-desert-sand bg-aged-paper py-2.5 pl-3 pr-8 text-sm text-charcoal focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20 transition-colors appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 text-stone-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Sort Order Toggle */}
        <button
          onClick={toggleSortOrder}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg border border-desert-sand bg-aged-paper py-2.5 px-4 text-sm font-medium transition-colors',
            'hover:bg-desert-sand/30 active:scale-95',
            'focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20'
          )}
          aria-label={`Sort order: ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
        >
          <ArrowUpDown
            className={cn(
              'h-4 w-4 text-charcoal transition-transform',
              filters.sortOrder === 'desc' && 'rotate-180'
            )}
          />
          <span className="text-charcoal">
            {filters.sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
          </span>
        </button>
      </div>

      {/* Result Count */}
      <div className="text-sm text-stone-gray">
        {resultCount} {resultCount === 1 ? 'artifact' : 'artifacts'} found
      </div>
    </div>
  );
}
