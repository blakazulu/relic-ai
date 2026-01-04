import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useGalleryFilters } from '@/hooks';
import { GalleryGrid, GalleryList, GalleryToolbar } from '@/components/gallery';
import type { Artifact } from '@/types';

type ViewMode = 'grid' | 'list';

export function GalleryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Load artifacts from IndexedDB with live query
  const artifacts = useLiveQuery(
    () => db.artifacts.orderBy('createdAt').reverse().toArray(),
    []
  );

  // Use the gallery filters hook
  const {
    filters,
    setSearch,
    setStatus,
    setSortBy,
    toggleSortOrder,
    filteredArtifacts,
    resultCount,
  } = useGalleryFilters(artifacts ?? []);

  const isLoading = artifacts === undefined;

  return (
    <div className="px-4 py-6 pb-24">
      {/* Toolbar with filters and view toggle */}
      <GalleryToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        setSearch={setSearch}
        setStatus={setStatus}
        setSortBy={setSortBy}
        toggleSortOrder={toggleSortOrder}
        resultCount={resultCount}
      />

      {/* Gallery Content */}
      <div className="mt-6">
        {viewMode === 'grid' ? (
          <GalleryGrid
            artifacts={filteredArtifacts}
            isLoading={isLoading}
          />
        ) : (
          <GalleryList
            artifacts={filteredArtifacts}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
