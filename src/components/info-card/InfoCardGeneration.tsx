import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  X,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useGenerateInfoCard } from '@/hooks/useGenerateInfoCard';
import { MetadataForm } from './MetadataForm';
import type { ArtifactMetadata, InfoCard, ArtifactImage } from '@/types';

interface InfoCardGenerationProps {
  /** Artifact ID to generate info card for */
  artifactId: string;
  /** Images to use for generation (first one will be used) */
  images: ArtifactImage[];
  /** Initial metadata from artifact */
  initialMetadata?: ArtifactMetadata;
  /** Called when generation completes successfully */
  onComplete: (infoCard: InfoCard) => void;
  /** Called when user cancels */
  onCancel?: () => void;
}

type GenerationStep = 'metadata' | 'generating' | 'complete' | 'error';

export function InfoCardGeneration({
  artifactId,
  images,
  initialMetadata,
  onComplete,
  onCancel,
}: InfoCardGenerationProps) {
  // State
  const [step, setStep] = useState<GenerationStep>('metadata');
  const [metadata, setMetadata] = useState<ArtifactMetadata>(initialMetadata || {});

  // Memoize image URL to prevent memory leaks
  const primaryImageUrl = useMemo(() => {
    if (images.length === 0) return null;
    return URL.createObjectURL(images[0].blob);
  }, [images]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (primaryImageUrl) {
        URL.revokeObjectURL(primaryImageUrl);
      }
    };
  }, [primaryImageUrl]);

  // Generation hook
  const {
    generateCard,
    cancel,
    state,
    progress,
    error,
    isProcessing,
    reset,
  } = useGenerateInfoCard({
    artifactId,
    onSuccess: (infoCard) => {
      setStep('complete');
      onComplete(infoCard);
    },
    onError: () => {
      setStep('error');
    },
  });

  /**
   * Start the generation process
   */
  const handleGenerate = useCallback(async () => {
    if (images.length === 0) {
      alert('No images available for analysis');
      return;
    }

    setStep('generating');
    await generateCard(images[0].blob, metadata);
  }, [images, metadata, generateCard]);

  /**
   * Handle cancel during metadata step
   */
  const handleCancel = useCallback(() => {
    if (isProcessing) {
      cancel();
    }
    reset();
    setStep('metadata');
    onCancel?.();
  }, [isProcessing, cancel, reset, onCancel]);

  /**
   * Retry after error
   */
  const handleRetry = useCallback(() => {
    reset();
    setStep('metadata');
  }, [reset]);

  /**
   * Get status message based on state
   */
  const getStatusMessage = useCallback((): string => {
    switch (state) {
      case 'uploading':
        if (progress < 15) return 'Preparing image...';
        if (progress < 30) return 'Encoding image data...';
        return 'Sending to AI...';
      case 'processing':
        if (progress < 50) return 'Analyzing artifact...';
        if (progress < 70) return 'Identifying characteristics...';
        if (progress < 85) return 'Generating info card...';
        if (progress < 95) return 'Saving to database...';
        return 'Finishing up...';
      case 'complete':
        return 'Info card generated!';
      case 'error':
        return 'An error occurred';
      default:
        return 'Ready to analyze';
    }
  }, [state, progress]);

  // No images available
  if (images.length === 0) {
    return (
      <div className="rounded-xl border border-desert-sand bg-aged-paper p-6 text-center">
        <AlertCircle className="h-12 w-12 text-stone-gray/50 mx-auto mb-3" />
        <h3 className="font-heading font-semibold text-charcoal mb-2">
          No Images Available
        </h3>
        <p className="text-sm text-stone-gray">
          Capture some photos of your artifact first to generate an AI info card.
        </p>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="rounded-xl border border-rust-red/30 bg-rust-red/5 p-6">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-rust-red/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-6 w-6 text-rust-red" />
          </div>
          <h3 className="font-heading font-semibold text-charcoal mb-2">
            Generation Failed
          </h3>
          <p className="text-sm text-stone-gray mb-4">
            {error?.message || 'An error occurred while generating the info card.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-desert-sand text-charcoal hover:bg-aged-paper transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-terracotta text-bone-white hover:bg-clay transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generating state
  if (step === 'generating' || isProcessing) {
    return (
      <div className="rounded-xl border border-desert-sand bg-aged-paper p-6">
        {/* Preview image */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden mx-auto mb-4">
          <img
            src={primaryImageUrl || ''}
            alt="Artifact being analyzed"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/30 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-bone-white animate-spin" />
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-charcoal font-medium">{getStatusMessage()}</span>
            <span className="text-terracotta font-mono">{Math.round(progress)}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-desert-sand/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-terracotta to-clay transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs text-stone-gray text-center">
            AI is analyzing your artifact image...
          </p>
        </div>

        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-desert-sand text-stone-gray hover:bg-parchment transition-colors"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    );
  }

  // Metadata input step
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-desert-sand">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-terracotta to-clay flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-bone-white" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-charcoal">
            Generate AI Info Card
          </h3>
          <p className="text-sm text-stone-gray">
            Add context to improve analysis accuracy
          </p>
        </div>
      </div>

      {/* Selected image preview */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-aged-paper border border-desert-sand">
        <img
          src={primaryImageUrl || ''}
          alt="Selected image"
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
          <p className="text-sm font-medium text-charcoal">
            Image selected for analysis
          </p>
          <p className="text-xs text-stone-gray capitalize">
            {images[0].angle} view • {images.length} total images
          </p>
        </div>
      </div>

      {/* Metadata form */}
      <MetadataForm
        initialValues={initialMetadata}
        onChange={setMetadata}
        compact
      />

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-desert-sand">
        {onCancel && (
          <button
            onClick={handleCancel}
            className="flex-1 py-3 rounded-lg border border-desert-sand text-charcoal hover:bg-aged-paper transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleGenerate}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-terracotta text-bone-white font-medium hover:bg-clay transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Generate Info Card
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-stone-gray text-center">
        AI analysis is speculative and should be verified by qualified archaeologists.
      </p>
    </div>
  );
}

export default InfoCardGeneration;
