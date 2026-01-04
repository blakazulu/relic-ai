import { useState, useRef, useCallback } from 'react';
import { generateInfoCard, APIError } from '@/lib/api/client';
import { saveInfoCard, updateArtifact } from '@/lib/db';
import { useAppStore } from '@/stores/appStore';
import type { InfoCard, ArtifactMetadata, ProcessingStatus } from '@/types';

/**
 * Progress state for the info card generation process
 */
export type GenerateInfoCardState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error';

/**
 * Error type for generation failures
 */
export interface GenerateInfoCardError {
  type: 'upload-failed' | 'processing-failed' | 'cancelled' | 'network' | 'unknown';
  message: string;
  originalError?: Error;
}

/**
 * Options for the useGenerateInfoCard hook
 */
export interface UseGenerateInfoCardOptions {
  /** Artifact ID to associate the info card with */
  artifactId: string;
  /** Called when generation completes successfully */
  onSuccess?: (infoCard: InfoCard) => void;
  /** Called when generation fails */
  onError?: (error: GenerateInfoCardError) => void;
  /** Called when progress updates */
  onProgress?: (progress: number, state: GenerateInfoCardState) => void;
}

/**
 * Return type for the useGenerateInfoCard hook
 */
export interface UseGenerateInfoCardReturn {
  /** Start the info card generation process */
  generateCard: (image: Blob, metadata?: ArtifactMetadata) => Promise<InfoCard | null>;
  /** Cancel the in-flight generation */
  cancel: () => void;
  /** Current progress state */
  state: GenerateInfoCardState;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error details if state is 'error' */
  error: GenerateInfoCardError | null;
  /** Whether generation is in progress */
  isProcessing: boolean;
  /** Reset the hook state */
  reset: () => void;
}

/**
 * Converts a Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Generates a unique ID for the info card
 */
function generateId(): string {
  return `infocard-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hook for generating AI-powered info cards from artifact images
 *
 * Handles the complete generation workflow:
 * 1. Upload image to the API
 * 2. Track processing progress
 * 3. Save resulting info card to IndexedDB
 * 4. Update artifact status
 * 5. Integrate with app store for global state
 */
export function useGenerateInfoCard(options: UseGenerateInfoCardOptions): UseGenerateInfoCardReturn {
  const { artifactId, onSuccess, onError, onProgress } = options;

  // State
  const [state, setState] = useState<GenerateInfoCardState>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<GenerateInfoCardError | null>(null);

  // Refs for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  // App store integration
  const setProcessingStatus = useAppStore((s) => s.setProcessingStatus);
  const setProcessingStep = useAppStore((s) => s.setProcessingStep);
  const updateProcessingProgress = useAppStore((s) => s.updateProcessingProgress);
  const setProcessingError = useAppStore((s) => s.setProcessingError);

  /**
   * Updates both local and global state
   */
  const updateState = useCallback(
    (newState: GenerateInfoCardState, newProgress: number, message: string) => {
      setState(newState);
      setProgress(newProgress);
      onProgress?.(newProgress, newState);

      // Map local state to ProcessingStep for app store
      const stepMap: Record<GenerateInfoCardState, ProcessingStatus['step']> = {
        idle: 'idle',
        uploading: 'uploading',
        processing: 'generating-info',
        complete: 'complete',
        error: 'error',
      };

      updateProcessingProgress(newProgress, message);

      if (newState === 'complete' || newState === 'error' || newState === 'idle') {
        setProcessingStep(stepMap[newState]);
      }
    },
    [onProgress, updateProcessingProgress, setProcessingStep]
  );

  /**
   * Sets error state
   */
  const handleError = useCallback(
    (errorType: GenerateInfoCardError['type'], message: string, originalError?: Error) => {
      const generateError: GenerateInfoCardError = {
        type: errorType,
        message,
        originalError,
      };

      setState('error');
      setError(generateError);
      setProcessingError(message);
      onError?.(generateError);

      // Update artifact status to error
      updateArtifact(artifactId, { status: 'error' }).catch(console.error);
    },
    [artifactId, onError, setProcessingError]
  );

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setState('idle');
    setProgress(0);
    setError(null);
    isCancelledRef.current = false;
    abortControllerRef.current = null;
    setProcessingStatus(null);
  }, [setProcessingStatus]);

  /**
   * Cancel the in-flight generation
   */
  const cancel = useCallback(() => {
    isCancelledRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    handleError('cancelled', 'Info card generation was cancelled');
  }, [handleError]);

  /**
   * Start the info card generation process
   */
  const generateCard = useCallback(
    async (image: Blob, metadata?: ArtifactMetadata): Promise<InfoCard | null> => {
      // Validate inputs
      if (!image) {
        handleError('upload-failed', 'No image provided for info card generation');
        return null;
      }

      // Validate image is not empty or corrupted
      if (image.size === 0) {
        handleError('upload-failed', 'Image file is empty or corrupted');
        return null;
      }

      // Validate minimum image size (at least 1KB)
      if (image.size < 1024) {
        handleError('upload-failed', 'Image file is too small. Please use a higher quality image.');
        return null;
      }

      // Reset state
      isCancelledRef.current = false;
      setError(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Initialize processing status in app store
      setProcessingStatus({
        artifactId,
        step: 'uploading',
        progress: 0,
        message: 'Preparing image for analysis...',
      });

      // Update artifact status
      await updateArtifact(artifactId, { status: 'processing-info' });

      try {
        // Phase 1: Upload/Convert image (0-30%)
        updateState('uploading', 0, 'Converting image...');

        if (isCancelledRef.current) {
          return null;
        }

        updateState('uploading', 15, 'Encoding image...');

        const imageBase64 = await blobToBase64(image);

        if (isCancelledRef.current) {
          return null;
        }

        updateState('uploading', 30, 'Sending to AI...');

        // Phase 2: Processing (30-90%)
        updateState('processing', 30, 'Analyzing artifact...');

        // Call the API
        const response = await generateInfoCard({
          imageBase64,
          metadata: metadata ? {
            discoveryLocation: metadata.discoveryLocation,
            excavationLayer: metadata.excavationLayer,
            siteName: metadata.siteName,
            notes: metadata.notes,
          } : undefined,
        });

        if (isCancelledRef.current) {
          return null;
        }

        updateState('processing', 70, 'Processing AI response...');

        // Check for API errors
        if (!response.success || !response.infoCard) {
          handleError(
            'processing-failed',
            response.error || 'Failed to generate info card'
          );
          return null;
        }

        updateState('processing', 85, 'Formatting info card...');

        // Phase 3: Save to IndexedDB (90-100%)
        updateState('processing', 90, 'Saving info card...');

        // Create info card object
        const infoCard: InfoCard = {
          id: generateId(),
          artifactId,
          createdAt: new Date(),
          updatedAt: new Date(),
          material: response.infoCard.material,
          estimatedAge: response.infoCard.estimatedAge,
          possibleUse: response.infoCard.possibleUse,
          culturalContext: response.infoCard.culturalContext,
          similarArtifacts: response.infoCard.similarArtifacts || [],
          preservationNotes: response.infoCard.preservationNotes,
          aiModel: 'llama-3.2-90b-vision-preview',
          aiConfidence: response.infoCard.aiConfidence || 0.75,
          isHumanEdited: false,
          disclaimer: response.infoCard.disclaimer,
        };

        if (isCancelledRef.current) {
          return null;
        }

        // Save to IndexedDB
        await saveInfoCard(infoCard);

        updateState('processing', 95, 'Updating artifact...');

        // Update artifact status
        await updateArtifact(artifactId, {
          status: 'complete',
          infoCardId: infoCard.id,
        });

        // Phase 4: Complete
        updateState('complete', 100, 'Info card generated!');

        // Call success callback
        onSuccess?.(infoCard);

        // Clear processing status after a short delay
        setTimeout(() => {
          setProcessingStatus(null);
        }, 1500);

        return infoCard;
      } catch (err) {
        if (isCancelledRef.current) {
          return null;
        }

        const caughtError = err as Error;

        // Determine error type
        let errorType: GenerateInfoCardError['type'] = 'unknown';
        let errorMessage = 'An unexpected error occurred during info card generation';

        if (caughtError instanceof APIError) {
          if (caughtError.statusCode >= 500) {
            errorType = 'processing-failed';
            errorMessage = 'Server error during analysis. Please try again.';
          } else if (caughtError.statusCode === 0 || caughtError.message.includes('network')) {
            errorType = 'network';
            errorMessage = 'Network error. Please check your connection and try again.';
          } else if (caughtError.statusCode === 429) {
            errorType = 'processing-failed';
            errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
          } else {
            errorType = 'processing-failed';
            errorMessage = caughtError.message;
          }
        } else if (caughtError.name === 'AbortError') {
          errorType = 'cancelled';
          errorMessage = 'Info card generation was cancelled';
        } else if (caughtError.message.includes('Failed to read blob')) {
          errorType = 'upload-failed';
          errorMessage = 'Failed to process image. Please try a different image.';
        }

        handleError(errorType, errorMessage, caughtError);
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [artifactId, onSuccess, handleError, updateState, setProcessingStatus]
  );

  return {
    generateCard,
    cancel,
    state,
    progress,
    error,
    isProcessing: state === 'uploading' || state === 'processing',
    reset,
  };
}
