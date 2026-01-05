import { useState, useRef, useCallback } from 'react';
import { colorize, APIError } from '@/lib/api/client';
import { addColorVariant, updateArtifact } from '@/lib/db';
import { useAppStore } from '@/stores/appStore';
import type { ColorVariant, ColorScheme, ProcessingStatus } from '@/types';

/**
 * Progress state for the colorization process
 */
export type ColorizeProgressState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error';

/**
 * Error type for colorization failures
 */
export interface ColorizeError {
  type: 'upload-failed' | 'processing-failed' | 'cancelled' | 'network' | 'unknown';
  message: string;
  originalError?: Error;
}

/**
 * Options for the useColorize hook
 */
export interface UseColorizeOptions {
  /** Artifact ID to associate the color variant with */
  artifactId: string;
  /** Called when colorization completes successfully */
  onSuccess?: (variant: ColorVariant) => void;
  /** Called when colorization fails */
  onError?: (error: ColorizeError) => void;
  /** Called when progress updates */
  onProgress?: (progress: number, state: ColorizeProgressState) => void;
}

/**
 * Return type for the useColorize hook
 */
export interface UseColorizeReturn {
  /** Start the colorization process */
  colorize: (image: Blob, colorScheme: ColorScheme, customPrompt?: string) => Promise<ColorVariant | null>;
  /** Cancel the in-flight colorization */
  cancel: () => void;
  /** Current progress state */
  state: ColorizeProgressState;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error details if state is 'error' */
  error: ColorizeError | null;
  /** Whether colorization is in progress */
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
 * Converts a base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Generates a unique ID for the color variant
 */
function generateId(): string {
  return `colorvariant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hook for AI-powered artifact colorization
 *
 * Handles the complete colorization workflow:
 * 1. Upload image to the API
 * 2. Track processing progress
 * 3. Save resulting color variant to IndexedDB
 * 4. Update artifact status
 * 5. Integrate with app store for global state
 */
export function useColorize(options: UseColorizeOptions): UseColorizeReturn {
  const { artifactId, onSuccess, onError, onProgress } = options;

  // State
  const [state, setState] = useState<ColorizeProgressState>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<ColorizeError | null>(null);

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
    (newState: ColorizeProgressState, newProgress: number, message: string) => {
      setState(newState);
      setProgress(newProgress);
      onProgress?.(newProgress, newState);

      // Map local state to ProcessingStep for app store
      const stepMap: Record<ColorizeProgressState, ProcessingStatus['step']> = {
        idle: 'idle',
        uploading: 'uploading',
        processing: 'colorizing',
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
    (errorType: ColorizeError['type'], message: string, originalError?: Error) => {
      const colorizeError: ColorizeError = {
        type: errorType,
        message,
        originalError,
      };

      setState('error');
      setError(colorizeError);
      setProcessingError(message);
      onError?.(colorizeError);

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
   * Cancel the in-flight colorization
   */
  const cancel = useCallback(() => {
    isCancelledRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    handleError('cancelled', 'Colorization was cancelled');
  }, [handleError]);

  /**
   * Start the colorization process
   */
  const colorizeImage = useCallback(
    async (image: Blob, colorScheme: ColorScheme, customPrompt?: string): Promise<ColorVariant | null> => {
      // Validate inputs
      if (!image) {
        handleError('upload-failed', 'No image provided for colorization');
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
        message: 'Preparing image for colorization...',
      });

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
        updateState('processing', 30, 'Applying color scheme...');

        // Call the API
        const response = await colorize({
          imageBase64,
          colorScheme,
          customPrompt,
        });

        if (isCancelledRef.current) {
          return null;
        }

        updateState('processing', 70, 'Processing colorized image...');

        // Check for API errors
        if (!response.success || !response.colorizedImageBase64) {
          handleError(
            'processing-failed',
            response.error || 'Failed to colorize image'
          );
          return null;
        }

        updateState('processing', 85, 'Converting image data...');

        // Phase 3: Save to IndexedDB (90-100%)
        updateState('processing', 90, 'Saving color variant...');

        // Convert base64 to blob
        const colorizedBlob = base64ToBlob(response.colorizedImageBase64);

        // Build the prompt string for storage
        const promptUsed = customPrompt || `${colorScheme} color scheme`;

        // Create color variant object
        const variant: ColorVariant = {
          id: generateId(),
          artifactId,
          blob: colorizedBlob,
          createdAt: new Date(),
          colorScheme,
          prompt: promptUsed,
          aiModel: 'deoldify',
          isSpeculative: true,
        };

        if (isCancelledRef.current) {
          return null;
        }

        // Save to IndexedDB
        await addColorVariant(variant);

        updateState('processing', 95, 'Updating artifact...');

        // Phase 4: Complete
        updateState('complete', 100, 'Colorization complete!');

        // Call success callback
        onSuccess?.(variant);

        // Clear processing status after a short delay
        setTimeout(() => {
          setProcessingStatus(null);
        }, 1500);

        return variant;
      } catch (err) {
        if (isCancelledRef.current) {
          return null;
        }

        const caughtError = err as Error;

        // Determine error type
        let errorType: ColorizeError['type'] = 'unknown';
        let errorMessage = 'An unexpected error occurred during colorization';

        if (caughtError instanceof APIError) {
          if (caughtError.statusCode >= 500) {
            errorType = 'processing-failed';
            errorMessage = 'Server error during colorization. Please try again.';
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
          errorMessage = 'Colorization was cancelled';
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
    colorize: colorizeImage,
    cancel,
    state,
    progress,
    error,
    isProcessing: state === 'uploading' || state === 'processing',
    reset,
  };
}
