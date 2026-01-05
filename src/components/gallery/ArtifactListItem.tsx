import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, FileText, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { Artifact } from '@/types';

interface ArtifactListItemProps {
  artifact: Artifact;
  className?: string;
}

/**
 * Get status badge styling
 */
function getStatusInfo(status: Artifact['status'], t: (key: string) => string): { color: string; label: string } {
  switch (status) {
    case 'draft':
      return { color: 'bg-stone-gray/20 text-stone-gray', label: t('common.status.draft') };
    case 'images-captured':
      return { color: 'bg-desert-teal/20 text-desert-teal', label: t('common.status.images') };
    case 'processing-3d':
      return { color: 'bg-gold-ochre/20 text-gold-ochre', label: t('common.status.processing') };
    case 'processing-info':
      return { color: 'bg-gold-ochre/20 text-gold-ochre', label: t('common.status.analyzing') };
    case 'complete':
      return { color: 'bg-oxidized-bronze/20 text-oxidized-bronze', label: t('common.status.complete') };
    case 'error':
      return { color: 'bg-rust-red/20 text-rust-red', label: t('common.status.error') };
    default:
      return { color: 'bg-stone-gray/20 text-stone-gray', label: t('common.status.unknown') };
  }
}

/**
 * Compact list row for artifact display
 */
export function ArtifactListItem({ artifact, className }: ArtifactListItemProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (artifact.thumbnailBlob) {
      const url = URL.createObjectURL(artifact.thumbnailBlob);
      setThumbnailUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [artifact.thumbnailBlob]);

  const statusInfo = getStatusInfo(artifact.status, t);
  const displayName = artifact.metadata?.name || t('pages.gallery.unnamedArtifact');
  const siteName = artifact.metadata?.siteName;
  const displayDate = formatDate(artifact.metadata?.dateFound || artifact.createdAt);

  return (
    <button
      onClick={() => navigate(`/artifact/${artifact.id}`)}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg',
        'bg-bone-white hover:bg-aged-paper/50',
        'border border-transparent hover:border-desert-sand',
        'transition-all duration-200',
        'text-left',
        className
      )}
      aria-label={`View ${displayName}`}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-aged-paper border border-desert-sand overflow-hidden">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Box className="w-5 h-5 text-stone-gray/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-medium text-charcoal truncate">{displayName}</h3>
          {artifact.model3DId && (
            <Box className="w-3.5 h-3.5 text-terracotta flex-shrink-0" aria-label={t('pages.gallery.has3DModel')} />
          )}
          {artifact.infoCardId && (
            <FileText className="w-3.5 h-3.5 text-terracotta flex-shrink-0" aria-label={t('pages.gallery.hasInfoCard')} />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-gray">
          {siteName && <span className="truncate">{siteName}</span>}
          {siteName && <span className="text-desert-sand">•</span>}
          <span className="flex-shrink-0">{displayDate}</span>
        </div>
      </div>

      {/* Status and chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusInfo.color)}>
          {statusInfo.label}
        </span>
        <ChevronRight className="w-4 h-4 text-stone-gray" />
      </div>
    </button>
  );
}
