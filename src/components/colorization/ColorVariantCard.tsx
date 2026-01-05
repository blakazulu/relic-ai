import { useState, useEffect } from 'react';
import { Trash2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { ColorVariant, ColorScheme } from '@/types/artifact';

interface ColorVariantCardProps {
  variant: ColorVariant;
  onClick: () => void;
  onDelete?: () => void;
  className?: string;
}

/**
 * Get color scheme badge styling and display name
 */
function getColorSchemeStyle(scheme: ColorScheme): { bg: string; text: string; label: string } {
  switch (scheme) {
    case 'roman':
      return { bg: 'bg-terracotta/20', text: 'text-terracotta', label: 'Roman' };
    case 'greek':
      return { bg: 'bg-desert-teal/20', text: 'text-desert-teal', label: 'Greek' };
    case 'egyptian':
      return { bg: 'bg-gold-ochre/20', text: 'text-gold-ochre', label: 'Egyptian' };
    case 'mesopotamian':
      return { bg: 'bg-oxidized-bronze/20', text: 'text-oxidized-bronze', label: 'Mesopotamian' };
    case 'weathered':
      return { bg: 'bg-stone-gray/20', text: 'text-stone-gray', label: 'Weathered' };
    case 'original':
      return { bg: 'bg-charcoal/20', text: 'text-charcoal', label: 'Original' };
    case 'custom':
      return { bg: 'bg-rust-red/20', text: 'text-rust-red', label: 'Custom' };
    default:
      return { bg: 'bg-stone-gray/20', text: 'text-stone-gray', label: 'Unknown' };
  }
}

/**
 * Individual color variant thumbnail card
 * Shows thumbnail, color scheme badge, created date, and optional delete button
 */
export function ColorVariantCard({
  variant,
  onClick,
  onDelete,
  className,
}: ColorVariantCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Create object URL for variant blob
  useEffect(() => {
    if (variant.blob) {
      const url = URL.createObjectURL(variant.blob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [variant.blob]);

  const schemeStyle = getColorSchemeStyle(variant.colorScheme);
  const displayDate = formatDate(variant.createdAt);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl overflow-hidden',
        'bg-bone-white border border-desert-sand',
        'shadow-sm hover:shadow-md hover:border-terracotta/50',
        'transition-all duration-200 hover:scale-[1.02]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta',
        className
      )}
      aria-label={`View ${schemeStyle.label} color variant`}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-aged-paper relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${schemeStyle.label} color variant`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Palette className="w-12 h-12 text-stone-gray/30" />
          </div>
        )}

        {/* Color scheme badge */}
        <div
          className={cn(
            'absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium',
            schemeStyle.bg,
            schemeStyle.text
          )}
        >
          {schemeStyle.label}
        </div>

        {/* Delete button */}
        {onDelete && !showDeleteConfirm && (
          <button
            onClick={handleDeleteClick}
            className={cn(
              'absolute top-2 right-2 p-1.5 rounded-full',
              'bg-charcoal/70 hover:bg-rust-red transition-colors',
              'text-bone-white'
            )}
            aria-label="Delete variant"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Delete confirmation overlay */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 bg-charcoal/80 flex flex-col items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-bone-white text-sm text-center mb-3">
              Delete this variant?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancelDelete}
                className="px-3 py-1.5 text-sm rounded-lg bg-stone-gray text-bone-white hover:bg-stone-gray/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-sm rounded-lg bg-rust-red text-bone-white hover:bg-rust-red/80 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1">
        <p className="text-sm text-stone-gray">{displayDate}</p>
        {variant.aiModel && (
          <p className="text-xs text-stone-gray/70 truncate">
            AI: {variant.aiModel}
          </p>
        )}
      </div>
    </button>
  );
}
