import { useState, useEffect } from 'react';
import { X, Download, Trash2, Palette, Calendar, Cpu, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { ColorVariant, ArtifactImage, ColorScheme } from '@/types/artifact';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { LoadingSpinner } from '@/components/ui';

interface VariantDetailViewProps {
  variant: ColorVariant;
  originalImage: ArtifactImage;
  onClose: () => void;
  onDownload: () => void;
  onDelete?: () => void;
}

/**
 * Get color scheme display name and description
 */
function getColorSchemeInfo(scheme: ColorScheme): { label: string; description: string } {
  switch (scheme) {
    case 'roman':
      return {
        label: 'Roman',
        description: 'Rich reds, ochres, and earth tones typical of Roman art',
      };
    case 'greek':
      return {
        label: 'Greek',
        description: 'Blues, terracotta, and natural pigments of ancient Greece',
      };
    case 'egyptian':
      return {
        label: 'Egyptian',
        description: 'Vibrant blues, gold, and turquoise of ancient Egypt',
      };
    case 'mesopotamian':
      return {
        label: 'Mesopotamian',
        description: 'Deep blues, bronze, and earthy tones of Mesopotamia',
      };
    case 'weathered':
      return {
        label: 'Weathered',
        description: 'Faded colors showing effects of time and exposure',
      };
    case 'original':
      return {
        label: 'Original',
        description: 'Best estimate of original coloring based on analysis',
      };
    case 'custom':
      return {
        label: 'Custom',
        description: 'Custom color scheme based on specific prompt',
      };
    default:
      return {
        label: 'Unknown',
        description: 'Color scheme information unavailable',
      };
  }
}

/**
 * Full-screen modal view for color variant detail
 * Shows before/after comparison, metadata, and action buttons
 */
export function VariantDetailView({
  variant,
  originalImage,
  onClose,
  onDownload,
  onDelete,
}: VariantDetailViewProps) {
  const [variantUrl, setVariantUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create object URLs for images
  useEffect(() => {
    if (variant.blob) {
      const url = URL.createObjectURL(variant.blob);
      setVariantUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [variant.blob]);

  useEffect(() => {
    if (originalImage.blob) {
      const url = URL.createObjectURL(originalImage.blob);
      setOriginalUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [originalImage.blob]);

  const schemeInfo = getColorSchemeInfo(variant.colorScheme);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    onDelete?.();
    // Note: Parent component should handle closing the modal after delete
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteConfirm, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/90 backdrop-blur-sm"
        onClick={!showDeleteConfirm ? onClose : undefined}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] m-4 rounded-xl bg-aged-paper border border-desert-sand shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-desert-sand">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-terracotta/20 flex items-center justify-center">
              <Palette className="w-5 h-5 text-terracotta" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-charcoal">
                {schemeInfo.label} Color Variant
              </h2>
              <p className="text-sm text-stone-gray">{schemeInfo.description}</p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-desert-sand/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-stone-gray" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Before/After Slider */}
          {variantUrl && originalUrl && (
            <BeforeAfterSlider
              beforeImage={originalUrl}
              afterImage={variantUrl}
              beforeLabel="Original"
              afterLabel={schemeInfo.label}
              className="max-w-2xl mx-auto"
            />
          )}

          {/* Metadata */}
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Color scheme */}
            <div className="p-4 rounded-lg bg-bone-white border border-desert-sand">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-terracotta" />
                <span className="text-sm font-medium text-stone-gray">Color Scheme</span>
              </div>
              <p className="text-charcoal font-medium">{schemeInfo.label}</p>
            </div>

            {/* AI Model */}
            <div className="p-4 rounded-lg bg-bone-white border border-desert-sand">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-terracotta" />
                <span className="text-sm font-medium text-stone-gray">AI Model</span>
              </div>
              <p className="text-charcoal font-medium truncate">
                {variant.aiModel || 'Unknown'}
              </p>
            </div>

            {/* Created date */}
            <div className="p-4 rounded-lg bg-bone-white border border-desert-sand">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-terracotta" />
                <span className="text-sm font-medium text-stone-gray">Created</span>
              </div>
              <p className="text-charcoal font-medium">
                {formatDate(variant.createdAt)}
              </p>
            </div>
          </div>

          {/* Prompt (if custom) */}
          {variant.prompt && (
            <div className="max-w-2xl mx-auto p-4 rounded-lg bg-bone-white border border-desert-sand">
              <p className="text-sm font-medium text-stone-gray mb-2">Generation Prompt</p>
              <p className="text-charcoal">{variant.prompt}</p>
            </div>
          )}

          {/* Speculative disclaimer */}
          <div className="max-w-2xl mx-auto p-4 rounded-lg bg-gold-ochre/10 border border-gold-ochre/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-gold-ochre flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-charcoal mb-1">
                  Speculative Reconstruction
                </p>
                <p className="text-sm text-stone-gray">
                  This color reconstruction is AI-generated and represents a speculative
                  interpretation of how the artifact may have appeared. It should not be
                  considered historically accurate without expert validation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-desert-sand bg-bone-white">
          <div className="flex gap-3 justify-end">
            {/* Delete button */}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className={cn(
                  'px-4 py-2.5 rounded-lg',
                  'border border-rust-red text-rust-red',
                  'hover:bg-rust-red hover:text-bone-white',
                  'transition-colors flex items-center gap-2'
                )}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}

            {/* Download button */}
            <button
              onClick={onDownload}
              className={cn(
                'px-4 py-2.5 rounded-lg',
                'bg-terracotta text-bone-white',
                'hover:bg-terracotta/90',
                'transition-colors flex items-center gap-2'
              )}
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-charcoal/50"
            onClick={!isDeleting ? handleCancelDelete : undefined}
          />
          <div className="relative w-full max-w-md rounded-xl bg-aged-paper border border-desert-sand shadow-xl p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-rust-red/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-rust-red" />
              </div>
            </div>

            {/* Content */}
            <h3 className="font-heading text-xl font-semibold text-charcoal text-center mb-2">
              Delete Color Variant?
            </h3>

            <p className="text-stone-gray text-center mb-2">
              Are you sure you want to delete this{' '}
              <span className="font-medium text-charcoal">{schemeInfo.label}</span> color
              variant?
            </p>

            <p className="text-sm text-rust-red text-center mb-6">
              This action cannot be undone.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-lg border border-desert-sand bg-bone-white text-charcoal font-medium hover:bg-aged-paper transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-lg bg-rust-red text-bone-white font-medium hover:bg-rust-red/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
