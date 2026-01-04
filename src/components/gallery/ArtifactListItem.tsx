import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, FileText, ChevronRight } from 'lucide-react';
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
function getStatusInfo(status: Artifact['status']): { color: string; label: string } {
  switch (status) {
    case 'draft':
      return { color: 'bg-stone-gray/20 text-stone-gray', label: 'Draft' };
    case 'images-captured':
      return { color: 'bg-desert-teal/20 text-desert-teal', label: 'Images' };
    case 'processing-3d':
      return { color: 'bg-gold-ochre/20 text-gold-ochre', label: 'Processing' };
    case 'processing-info':
      return { color: 'bg-gold-ochre/20 text-gold-ochre', label: 'Analyzing' };
    case 'complete':
      return { color: 'bg-oxidized-bronze/20 text-oxidized-bronze', label: 'Complete' };
    case 'error':
      return { color: 'bg-rust-red/20 text-rust-red', label: 'Error' };
    default:
      return { color: 'bg-stone-gray/20 text-stone-gray', label: 'Unknown' };
  }
}

/**
 * Compact list row for artifact display
 */
export function ArtifactListItem({ artifact, className }: ArtifactListItemProps) {
  const navigate = useNavigate();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (artifact.thumbnailBlob) {
      const url = URL.createObjectURL(artifact.thumbnailBlob);
      setThumbnailUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [artifact.thumbnailBlob]);

  const statusInfo = getStatusInfo(artifact.status);
  const displayName = artifact.metadata?.name || 'Unnamed Artifact';
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
            <Box className="w-3.5 h-3.5 text-terracotta flex-shrink-0" aria-label="Has 3D model" />
          )}
          {artifact.infoCardId && (
            <FileText className="w-3.5 h-3.5 text-terracotta flex-shrink-0" aria-label="Has info card" />
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
