import { FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Artifact } from '@/types';
import { ArtifactCard } from './ArtifactCard';

interface GalleryGridProps {
  artifacts: Artifact[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Empty state component when no artifacts exist
 */
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-aged-paper border-2 border-desert-sand flex items-center justify-center mb-4">
        <FolderOpen className="w-10 h-10 text-stone-gray/50" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">
        {t('pages.gallery.noArtifactsYet')}
      </h3>
      <p className="text-stone-gray text-center max-w-xs">
        {t('pages.gallery.startCapturing')}
      </p>
    </div>
  );
}

/**
 * Loading skeleton for grid items
 */
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden bg-bone-white border border-desert-sand"
        >
          <div className="aspect-square bg-aged-paper animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-5 bg-aged-paper rounded animate-pulse w-3/4" />
            <div className="h-4 bg-aged-paper rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Responsive grid layout for artifact cards
 * 1 column on mobile, 2 on tablet, 3 on desktop
 */
export function GalleryGrid({ artifacts, isLoading = false, className }: GalleryGridProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (artifacts.length === 0) {
    return <EmptyState t={t} />;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact.id} artifact={artifact} />
      ))}
    </div>
  );
}
