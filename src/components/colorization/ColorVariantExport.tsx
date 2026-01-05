import { useState, useCallback, useEffect } from 'react';
import { Download, FileArchive, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColorVariant, ColorScheme } from '@/types/artifact';
import { exportVariantsAsZip, downloadVariant } from '@/lib/utils/zipExport';

export interface ColorVariantExportProps {
  /** Color variants available for export */
  variants: ColorVariant[];
  /** Name of the artifact (used for filename) */
  artifactName: string;
  /** Called when the export modal should close */
  onClose: () => void;
}

/**
 * Get color scheme display name and styling
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
 * Modal dialog for exporting color variants
 * Supports single variant download or batch ZIP export
 */
export function ColorVariantExport({
  variants,
  artifactName,
  onClose,
}: ColorVariantExportProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Generate thumbnails for variants
  useEffect(() => {
    const urls: Record<string, string> = {};
    variants.forEach((variant) => {
      if (variant.blob) {
        urls[variant.id] = URL.createObjectURL(variant.blob);
      }
    });
    setThumbnails(urls);

    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [variants]);

  const allSelected = selectedIds.size === variants.length && variants.length > 0;
  const someSelected = selectedIds.size > 0;

  /**
   * Toggle selection of a single variant
   */
  const toggleVariant = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Toggle select all variants
   */
  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(variants.map((v) => v.id)));
    }
  }, [allSelected, variants]);

  /**
   * Handle export action
   */
  const handleExport = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsExporting(true);
    setExportSuccess(false);

    try {
      const selectedVariants = variants.filter((v) => selectedIds.has(v.id));

      if (selectedVariants.length === 1 && !includeMetadata) {
        // Single variant without metadata - direct download
        downloadVariant(selectedVariants[0], artifactName);
      } else {
        // Multiple variants or include metadata - ZIP export
        await exportVariantsAsZip(selectedVariants, artifactName);
      }

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export variants. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [selectedIds, variants, artifactName, includeMetadata, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50">
      <div className="w-full max-w-md rounded-2xl bg-parchment shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-desert-sand flex-shrink-0">
          <h2 className="font-heading font-semibold text-charcoal">Export Color Variants</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-aged-paper transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-stone-gray" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {variants.length === 0 ? (
            <p className="text-sm text-stone-gray text-center py-8">
              No color variants available to export.
            </p>
          ) : (
            <>
              {/* Select All */}
              <label className="flex items-center gap-3 cursor-pointer" onClick={toggleSelectAll}>
                <div
                  className={cn(
                    'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                    allSelected
                      ? 'bg-terracotta border-terracotta'
                      : 'border-desert-sand hover:border-terracotta/50'
                  )}
                >
                  {allSelected && <Check className="h-3 w-3 text-bone-white" />}
                </div>
                <span className="text-sm font-medium text-charcoal">
                  Select All ({variants.length} variants)
                </span>
              </label>

              {/* Divider */}
              <div className="border-t border-desert-sand" />

              {/* Variant List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {variants.map((variant) => {
                  const schemeStyle = getColorSchemeStyle(variant.colorScheme);
                  const isSelected = selectedIds.has(variant.id);

                  return (
                    <label
                      key={variant.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                        isSelected
                          ? 'border-terracotta bg-terracotta/5'
                          : 'border-desert-sand hover:border-terracotta/50'
                      )}
                    >
                      <div
                        className={cn(
                          'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                          isSelected
                            ? 'bg-terracotta border-terracotta'
                            : 'border-desert-sand'
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleVariant(variant.id);
                        }}
                      >
                        {isSelected && <Check className="h-3 w-3 text-bone-white" />}
                      </div>

                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-aged-paper flex-shrink-0">
                        {thumbnails[variant.id] ? (
                          <img
                            src={thumbnails[variant.id]}
                            alt={schemeStyle.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-6 h-6 bg-stone-gray/20 rounded" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              schemeStyle.bg,
                              schemeStyle.text
                            )}
                          >
                            {schemeStyle.label}
                          </span>
                        </div>
                        <p className="text-xs text-stone-gray mt-1 truncate">
                          {variant.aiModel}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-desert-sand" />

              {/* Options */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={cn(
                    'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                    includeMetadata
                      ? 'bg-terracotta border-terracotta'
                      : 'border-desert-sand hover:border-terracotta/50'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setIncludeMetadata(!includeMetadata);
                  }}
                >
                  {includeMetadata && <Check className="h-3 w-3 text-bone-white" />}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-charcoal">Include Metadata</span>
                  <p className="text-xs text-stone-gray">
                    Add JSON file with color schemes, prompts, and AI model info
                  </p>
                </div>
              </label>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-desert-sand flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-desert-sand text-charcoal hover:bg-aged-paper transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !someSelected}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors',
              someSelected
                ? 'bg-terracotta text-bone-white hover:bg-clay disabled:opacity-50'
                : 'bg-stone-gray/30 text-stone-gray cursor-not-allowed'
            )}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : exportSuccess ? (
              <>
                <Check className="h-4 w-4" />
                Exported!
              </>
            ) : selectedIds.size > 1 || includeMetadata ? (
              <>
                <FileArchive className="h-4 w-4" />
                Download ZIP
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ColorVariantExport;
