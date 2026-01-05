import { FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Artifact } from '@/types';
import { ArtifactListItem } from './ArtifactListItem';

interface GalleryListProps {
  artifacts: Artifact[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Empty state when no artifacts exist
 */
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-aged-paper border-2 border-desert-sand flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-stone-gray/50" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-charcoal mb-2">
        {t('pages.gallery.noArtifactsFound')}
      </h3>
      <p className="text-sm text-stone-gray text-center max-w-xs">
        {t('pages.gallery.startCapturingList')}
      </p>
    </div>
  );
}

/**
 * Loading skeleton for list items
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-bone-white border border-desert-sand/30"
        >
          <div className="w-12 h-12 rounded-lg bg-aged-paper animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-aged-paper rounded animate-pulse w-3/4" />
            <div className="h-3 bg-aged-paper rounded animate-pulse w-1/2" />
          </div>
          <div className="w-16 h-5 bg-aged-paper rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/**
 * Vertical list layout for artifacts
 */
export function GalleryList({ artifacts, isLoading = false, className }: GalleryListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (artifacts.length === 0) {
    return <EmptyState t={t} />;
  }

  return (
    <div className={cn('w-full space-y-2', className)}>
      {artifacts.map((artifact) => (
        <ArtifactListItem key={artifact.id} artifact={artifact} />
      ))}
    </div>
  );
}
