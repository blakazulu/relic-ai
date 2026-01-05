import { Grid, List, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { GalleryFilters } from './GalleryFilters';
import type { ArtifactStatus } from '@/types';
import type { GalleryFilters as GalleryFiltersType } from '@/hooks/useGalleryFilters';

type ViewMode = 'grid' | 'list';

interface GalleryToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filters: GalleryFiltersType;
  setSearch: (search: string) => void;
  setStatus: (status: ArtifactStatus | 'all') => void;
  setSortBy: (sortBy: 'date' | 'name' | 'status') => void;
  toggleSortOrder: () => void;
  resultCount: number;
}

export function GalleryToolbar({
  viewMode,
  onViewModeChange,
  filters,
  setSearch,
  setStatus,
  setSortBy,
  toggleSortOrder,
  resultCount,
}: GalleryToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Top Row: View Toggle + New Capture Button */}
      <div className="flex items-center justify-between gap-3">
        {/* View Toggle */}
        <div className="flex rounded-lg border border-desert-sand bg-aged-paper p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'rounded p-2 transition-colors',
              viewMode === 'grid'
                ? 'bg-terracotta text-bone-white'
                : 'text-stone-gray hover:text-charcoal hover:bg-desert-sand/20'
            )}
            aria-label={t('pages.gallery.gridView')}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'rounded p-2 transition-colors',
              viewMode === 'list'
                ? 'bg-terracotta text-bone-white'
                : 'text-stone-gray hover:text-charcoal hover:bg-desert-sand/20'
            )}
            aria-label={t('pages.gallery.listView')}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* New Capture Button */}
        <Link
          to="/capture"
          className="flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2.5 text-sm font-medium text-bone-white transition-all hover:bg-clay active:scale-95 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('pages.gallery.newCapture')}</span>
        </Link>
      </div>

      {/* Filters */}
      <GalleryFilters
        filters={filters}
        setSearch={setSearch}
        setStatus={setStatus}
        setSortBy={setSortBy}
        toggleSortOrder={toggleSortOrder}
        resultCount={resultCount}
      />
    </div>
  );
}
