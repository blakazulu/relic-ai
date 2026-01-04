import { useState, useMemo } from 'react';
import type { Artifact, ArtifactStatus } from '@/types';

export interface GalleryFilters {
  search: string;
  status: ArtifactStatus | 'all';
  sortBy: 'date' | 'name' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface UseGalleryFiltersReturn {
  filters: GalleryFilters;
  setSearch: (search: string) => void;
  setStatus: (status: ArtifactStatus | 'all') => void;
  setSortBy: (sortBy: 'date' | 'name' | 'status') => void;
  toggleSortOrder: () => void;
  filteredArtifacts: Artifact[];
  resultCount: number;
}

/**
 * Custom hook for filtering and sorting artifacts in the gallery
 */
export function useGalleryFilters(artifacts: Artifact[]): UseGalleryFiltersReturn {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ArtifactStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const filteredArtifacts = useMemo(() => {
    let result = [...artifacts];

    // Filter by search (artifact name, site name)
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((artifact) => {
        const name = artifact.metadata?.name?.toLowerCase() ?? '';
        const site = artifact.metadata?.siteName?.toLowerCase() ?? '';
        return name.includes(searchLower) || site.includes(searchLower);
      });
    }

    // Filter by status
    if (status !== 'all') {
      result = result.filter((artifact) => artifact.status === status);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name': {
          const nameA = a.metadata?.name?.toLowerCase() ?? '';
          const nameB = b.metadata?.name?.toLowerCase() ?? '';
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [artifacts, search, status, sortBy, sortOrder]);

  return {
    filters: { search, status, sortBy, sortOrder },
    setSearch,
    setStatus,
    setSortBy,
    toggleSortOrder,
    filteredArtifacts,
    resultCount: filteredArtifacts.length,
  };
}
