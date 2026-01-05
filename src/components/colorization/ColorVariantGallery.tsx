import { useState, useEffect } from 'react';
import { Palette, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColorVariant, ArtifactImage } from '@/types/artifact';
import { ColorVariantCard } from './ColorVariantCard';

interface ColorVariantGalleryProps {
  variants: ColorVariant[];
  originalImage?: ArtifactImage;
  onVariantClick: (variant: ColorVariant) => void;
  onVariantDelete?: (variantId: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Empty state component when no color variants exist
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-aged-paper border-2 border-desert-sand flex items-center justify-center mb-4">
        <Palette className="w-10 h-10 text-stone-gray/50" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">
        No Color Variants
      </h3>
      <p className="text-stone-gray text-center max-w-xs">
        {message}
      </p>
    </div>
  );
}

/**
 * Loading skeleton for gallery grid items
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
            <div className="h-4 bg-aged-paper rounded animate-pulse w-1/2" />
            <div className="h-3 bg-aged-paper rounded animate-pulse w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Original image card for comparison
 */
function OriginalImageCard({
  image,
  onClick,
}: {
  image: ArtifactImage;
  onClick?: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (image.blob) {
      const url = URL.createObjectURL(image.blob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [image.blob]);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl overflow-hidden',
        'bg-bone-white border-2 border-terracotta',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200 hover:scale-[1.02]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta'
      )}
      aria-label="View original image"
    >
      <div className="aspect-square bg-aged-paper relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Original artifact"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-12 h-12 text-stone-gray/30" />
          </div>
        )}

        {/* Original badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-terracotta text-bone-white">
          Original
        </div>
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-charcoal">Original Image</p>
      </div>
    </button>
  );
}

/**
 * Responsive grid gallery for color variants
 * 1 column on mobile, 2 on tablet, 3 on desktop
 */
export function ColorVariantGallery({
  variants,
  originalImage,
  onVariantClick,
  onVariantDelete,
  isLoading = false,
  emptyMessage = 'Generate color variants to see historical color reconstructions of your artifact.',
  className,
}: ColorVariantGalleryProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (variants.length === 0 && !originalImage) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {/* Show original image first if provided */}
      {originalImage && (
        <OriginalImageCard image={originalImage} />
      )}

      {/* Color variants */}
      {variants.map((variant) => (
        <ColorVariantCard
          key={variant.id}
          variant={variant}
          onClick={() => onVariantClick(variant)}
          onDelete={onVariantDelete ? () => onVariantDelete(variant.id) : undefined}
        />
      ))}

      {/* Empty message if only original image and no variants */}
      {variants.length === 0 && originalImage && (
        <div className="col-span-full">
          <EmptyState message={emptyMessage} />
        </div>
      )}
    </div>
  );
}
