import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { Artifact } from '@/types';

interface ArtifactCardProps {
  artifact: Artifact;
  className?: string;
}

/**
 * Get status badge styling based on artifact status
 */
function getStatusStyle(status: Artifact['status'], t: (key: string) => string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'draft':
      return { bg: 'bg-stone-gray/20', text: 'text-stone-gray', label: t('common.status.draft') };
    case 'images-captured':
      return { bg: 'bg-desert-teal/20', text: 'text-desert-teal', label: t('common.status.images') };
    case 'processing-3d':
      return { bg: 'bg-gold-ochre/20', text: 'text-gold-ochre', label: t('common.status.processing') };
    case 'processing-info':
      return { bg: 'bg-gold-ochre/20', text: 'text-gold-ochre', label: t('common.status.analyzing') };
    case 'complete':
      return { bg: 'bg-oxidized-bronze/20', text: 'text-oxidized-bronze', label: t('common.status.complete') };
    case 'error':
      return { bg: 'bg-rust-red/20', text: 'text-rust-red', label: t('common.status.error') };
    default:
      return { bg: 'bg-stone-gray/20', text: 'text-stone-gray', label: t('common.status.unknown') };
  }
}

/**
 * Artifact card component for grid display
 * Shows thumbnail, name, date, status badge, and site name
 */
export function ArtifactCard({ artifact, className }: ArtifactCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Create object URL for thumbnail blob
  useEffect(() => {
    if (artifact.thumbnailBlob) {
      const url = URL.createObjectURL(artifact.thumbnailBlob);
      setThumbnailUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [artifact.thumbnailBlob]);

  const statusStyle = getStatusStyle(artifact.status, t);
  const displayName = artifact.metadata?.name || t('pages.gallery.unnamedArtifact');
  const siteName = artifact.metadata?.siteName;
  const displayDate = formatDate(artifact.metadata?.dateFound || artifact.createdAt);

  const handleClick = () => {
    navigate(`/artifact/${artifact.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left rounded-xl overflow-hidden',
        'bg-bone-white border border-desert-sand',
        'shadow-sm hover:shadow-md hover:border-terracotta/50',
        'transition-all duration-200 hover:scale-[1.02]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta',
        className
      )}
      aria-label={`View ${displayName}`}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-aged-paper relative overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Box className="w-12 h-12 text-stone-gray/30" />
          </div>
        )}

        {/* Status badge */}
        <div
          className={cn(
            'absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium',
            statusStyle.bg,
            statusStyle.text
          )}
        >
          {statusStyle.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1">
        <h3 className="font-heading font-semibold text-charcoal truncate">
          {displayName}
        </h3>

        <p className="text-sm text-stone-gray">{displayDate}</p>

        {siteName && (
          <div className="flex items-center gap-1 text-xs text-stone-gray">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{siteName}</span>
          </div>
        )}
      </div>
    </button>
  );
}
