import { Palette, Wand2, X, RotateCcw, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColorScheme } from '@/types/artifact';
import { ColorSchemeSelector } from './ColorSchemeSelector';
import {
  ColorizationProgress,
  type ColorizationStatus,
} from './ColorizationProgress';

export interface ColorizationCardProps {
  /** Current colorization status */
  status: ColorizationStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Custom status message */
  statusMessage?: string;
  /** Error message when status is 'error' */
  errorMessage?: string;
  /** Currently selected color scheme */
  selectedScheme: ColorScheme;
  /** Callback when scheme selection changes */
  onSchemeChange: (scheme: ColorScheme) => void;
  /** Custom prompt for 'custom' scheme */
  customPrompt?: string;
  /** Callback when custom prompt changes */
  onCustomPromptChange?: (prompt: string) => void;
  /** Callback when generate button is clicked */
  onGenerate: () => void;
  /** Callback when cancel button is clicked */
  onCancel: () => void;
  /** Callback when retry button is clicked after error */
  onRetry?: () => void;
  /** Callback when view result button is clicked after completion */
  onViewResult?: () => void;
  /** Whether an artifact model is loaded */
  hasModel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ColorizationCard({
  status,
  progress,
  statusMessage,
  errorMessage,
  selectedScheme,
  onSchemeChange,
  customPrompt = '',
  onCustomPromptChange,
  onGenerate,
  onCancel,
  onRetry,
  onViewResult,
  hasModel = false,
  className,
}: ColorizationCardProps) {
  const isIdle = status === 'idle';
  const isProcessing = status === 'processing';
  const isCompleted = status === 'completed';
  const isError = status === 'error';

  // Determine if generate button should be enabled
  const canGenerate =
    isIdle &&
    hasModel &&
    (selectedScheme !== 'custom' || customPrompt.trim().length > 0);

  // Get button text based on state
  const getButtonText = () => {
    if (!hasModel) {
      return 'Load a 3D model first';
    }
    if (selectedScheme === 'custom' && !customPrompt.trim()) {
      return 'Enter a custom prompt';
    }
    return 'Generate Colors';
  };

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
            <Palette className="w-5 h-5 text-terracotta" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-charcoal">
              PastPalette Colorization
            </h2>
            <p className="text-stone-gray text-sm">
              Restore original colors to your artifact
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Scheme selector - only show when idle */}
        {isIdle && (
          <ColorSchemeSelector
            value={selectedScheme}
            onChange={onSchemeChange}
            customPrompt={customPrompt}
            onCustomPromptChange={onCustomPromptChange}
            disabled={isProcessing}
          />
        )}

        {/* Progress display - show when processing or after */}
        {!isIdle && (
          <ColorizationProgress
            status={status}
            progress={progress}
            statusMessage={statusMessage}
            errorMessage={errorMessage}
            onCancel={isProcessing ? onCancel : undefined}
          />
        )}

        {/* Model status indicator when idle */}
        {isIdle && !hasModel && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rust-red/10 border border-rust-red/30">
            <AlertCircle className="w-4 h-4 text-rust-red shrink-0" />
            <span className="text-sm text-rust-red">
              Please create or load a 3D model before colorizing
            </span>
          </div>
        )}

        {/* Selected scheme indicator when idle and has model */}
        {isIdle && hasModel && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-aged-paper">
            <span className="text-sm text-stone-gray">Selected scheme</span>
            <span className="font-medium text-sm text-charcoal capitalize">
              {selectedScheme}
            </span>
          </div>
        )}
      </div>

      {/* Footer with action buttons */}
      <div className="px-5 py-4 border-t border-desert-sand/60 bg-aged-paper/30">
        {isIdle && (
          <button
            onClick={onGenerate}
            disabled={!canGenerate}
            className={cn(
              'w-full py-3.5 px-4 rounded-xl font-medium transition-all',
              'flex items-center justify-center gap-2',
              canGenerate
                ? 'bg-terracotta text-bone-white hover:bg-clay active:scale-[0.98]'
                : 'bg-desert-sand/50 text-stone-gray cursor-not-allowed'
            )}
          >
            <Wand2 className="w-5 h-5" />
            {getButtonText()}
          </button>
        )}

        {isProcessing && (
          <button
            onClick={onCancel}
            className="w-full py-3.5 px-4 rounded-xl font-medium border-2 border-stone-gray/30 text-stone-gray hover:border-rust-red hover:text-rust-red hover:bg-rust-red/10 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancel Generation
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
            View Colorized Model
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {isProcessing && (
          <p className="mt-3 text-center text-sm text-stone-gray">
            Please don&apos;t close this page while processing...
          </p>
        )}
      </div>
    </div>
  );
}
