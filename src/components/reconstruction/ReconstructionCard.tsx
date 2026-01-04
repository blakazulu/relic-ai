import { useCallback } from 'react';
import { Box, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MethodSelector, type ReconstructionMethod } from './MethodSelector';
import {
  ReconstructionProgress,
  type ReconstructionStatus,
} from './ReconstructionProgress';

export interface ReconstructionCardProps {
  /** Current reconstruction status */
  status: ReconstructionStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Custom status message */
  statusMessage?: string;
  /** Error message when status is 'error' */
  errorMessage?: string;
  /** Currently selected reconstruction method */
  selectedMethod: ReconstructionMethod;
  /** Callback when method selection changes */
  onMethodChange: (method: ReconstructionMethod) => void;
  /** Callback when start button is clicked */
  onStart: () => void;
  /** Callback when cancel button is clicked */
  onCancel: () => void;
  /** Callback when retry button is clicked after error */
  onRetry?: () => void;
  /** Callback when view result button is clicked after completion */
  onViewResult?: () => void;
  /** Number of images selected */
  imageCount?: number;
  /** Additional CSS classes */
  className?: string;
}

export function ReconstructionCard({
  status,
  progress,
  statusMessage,
  errorMessage,
  selectedMethod,
  onMethodChange,
  onStart,
  onCancel,
  onRetry,
  onViewResult,
  imageCount = 0,
  className,
}: ReconstructionCardProps) {
  const isIdle = status === 'idle';
  const isProcessing = status === 'uploading' || status === 'processing';
  const isCompleted = status === 'completed';
  const isError = status === 'error';

  // Determine if start button should be enabled
  const canStart =
    isIdle &&
    imageCount > 0 &&
    (selectedMethod === 'single' || imageCount >= 3);

  // Get start button text based on state
  const getStartButtonText = useCallback(() => {
    if (selectedMethod === 'single') {
      return imageCount > 0 ? 'Start Quick Capture' : 'Select an image';
    }
    if (imageCount === 0) {
      return 'Select images';
    }
    if (imageCount < 3) {
      return `Need ${3 - imageCount} more image${3 - imageCount > 1 ? 's' : ''}`;
    }
    return `Start Reconstruction (${imageCount} images)`;
  }, [selectedMethod, imageCount]);

  return (
    <div
      className={cn(
        'bg-bone-white rounded-2xl border border-desert-sand shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-desert-sand/60 bg-aged-paper/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
            <Box className="w-5 h-5 text-terracotta" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-charcoal">
              3D Reconstruction
            </h2>
            <p className="text-stone-gray text-sm">
              Create a 3D model from your artifact photos
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Method selector - only show when idle */}
        {isIdle && (
          <MethodSelector
            value={selectedMethod}
            onChange={onMethodChange}
            disabled={isProcessing}
          />
        )}

        {/* Progress display - show when processing or after */}
        {!isIdle && (
          <ReconstructionProgress
            status={status}
            progress={progress}
            statusMessage={statusMessage}
            errorMessage={errorMessage}
            onCancel={isProcessing ? onCancel : undefined}
          />
        )}

        {/* Image count indicator when idle */}
        {isIdle && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-aged-paper">
            <span className="text-sm text-stone-gray">Images selected</span>
            <span
              className={cn(
                'font-medium text-sm',
                imageCount > 0 ? 'text-charcoal' : 'text-stone-gray'
              )}
            >
              {imageCount} {selectedMethod === 'multi' && '/ 8-20 recommended'}
            </span>
          </div>
        )}
      </div>

      {/* Footer with action buttons */}
      <div className="px-5 py-4 border-t border-desert-sand/60 bg-aged-paper/30">
        {isIdle && (
          <button
            onClick={onStart}
            disabled={!canStart}
            className={cn(
              'w-full py-3.5 px-4 rounded-xl font-medium transition-all',
              'flex items-center justify-center gap-2',
              canStart
                ? 'bg-terracotta text-bone-white hover:bg-clay active:scale-[0.98]'
                : 'bg-desert-sand/50 text-stone-gray cursor-not-allowed'
            )}
          >
            {getStartButtonText()}
            {canStart && <ChevronRight className="w-5 h-5" />}
          </button>
        )}

        {isError && onRetry && (
          <button
            onClick={onRetry}
            className="w-full py-3.5 px-4 rounded-xl font-medium bg-terracotta text-bone-white hover:bg-clay active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
        )}

        {isCompleted && onViewResult && (
          <button
            onClick={onViewResult}
            className="w-full py-3.5 px-4 rounded-xl font-medium bg-oxidized-bronze text-bone-white hover:bg-oxidized-bronze/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            View 3D Model
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {isProcessing && (
          <p className="text-center text-sm text-stone-gray">
            Please don&apos;t close this page while processing...
          </p>
        )}
      </div>
    </div>
  );
}
