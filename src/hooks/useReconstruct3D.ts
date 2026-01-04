import { useState, useRef, useCallback } from 'react';
import { reconstruct3D, APIError } from '@/lib/api/client';
import { saveModel, updateArtifact } from '@/lib/db';
import { useAppStore } from '@/stores/appStore';
import type { Model3D, ProcessingStatus } from '@/types';

/**
 * Reconstruction method type
 */
export type ReconstructMethod = 'single' | 'multi';

/**
 * Progress state for the reconstruction process
 */
export type ReconstructProgressState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error';

/**
 * Error type for reconstruction failures
 */
export interface ReconstructError {
  type: 'upload-failed' | 'processing-failed' | 'cancelled' | 'network' | 'unknown';
  message: string;
  originalError?: Error;
}

/**
 * Options for the useReconstruct3D hook
 */
export interface UseReconstruct3DOptions {
  /** Artifact ID to associate the model with */
  artifactId: string;
  /** Called when reconstruction completes successfully */
  onSuccess?: (model: Model3D) => void;
  /** Called when reconstruction fails */
  onError?: (error: ReconstructError) => void;
  /** Called when progress updates */
  onProgress?: (progress: number, state: ReconstructProgressState) => void;
}

/**
 * Return type for the useReconstruct3D hook
 */
export interface UseReconstruct3DReturn {
  /** Start the reconstruction process */
  startReconstruction: (images: Blob[], method: ReconstructMethod) => Promise<Model3D | null>;
  /** Cancel the in-flight reconstruction */
  cancel: () => void;
  /** Current progress state */
  state: ReconstructProgressState;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error details if state is 'error' */
  error: ReconstructError | null;
  /** Whether reconstruction is in progress */
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
function base64ToBlob(base64: string, mimeType: string = 'model/gltf-binary'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Generates a unique ID for the model
 */
function generateId(): string {
  return `model-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Maps API method to internal source type
 */
function methodToSource(method: ReconstructMethod): '3d-single' | '3d-multi' {
  return method === 'single' ? '3d-single' : '3d-multi';
}

/**
 * Maps API method to Trellis/TripoSR method
 */
function methodToApiMethod(method: ReconstructMethod): 'trellis' | 'triposr' {
  // Single image uses TripoSR, multi-image uses Trellis
  return method === 'single' ? 'triposr' : 'trellis';
}

/**
 * Hook for 3D reconstruction from images
 *
 * Handles the complete reconstruction workflow:
 * 1. Upload images to the API
 * 2. Track processing progress
 * 3. Save resulting model to IndexedDB
 * 4. Update artifact status
 * 5. Integrate with app store for global state
 */
export function useReconstruct3D(options: UseReconstruct3DOptions): UseReconstruct3DReturn {
  const { artifactId, onSuccess, onError, onProgress } = options;

  // State
  const [state, setState] = useState<ReconstructProgressState>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<ReconstructError | null>(null);

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
    (newState: ReconstructProgressState, newProgress: number, message: string) => {
      setState(newState);
      setProgress(newProgress);
      onProgress?.(newProgress, newState);

      // Map local state to ProcessingStep for app store
      const stepMap: Record<ReconstructProgressState, ProcessingStatus['step']> = {
        idle: 'idle',
        uploading: 'uploading',
        processing: 'reconstructing-3d',
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
    (errorType: ReconstructError['type'], message: string, originalError?: Error) => {
      const reconstructError: ReconstructError = {
        type: errorType,
        message,
        originalError,
      };

      setState('error');
      setError(reconstructError);
      setProcessingError(message);
      onError?.(reconstructError);

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
   * Cancel the in-flight reconstruction
   */
  const cancel = useCallback(() => {
    isCancelledRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    handleError('cancelled', 'Reconstruction was cancelled');
  }, [handleError]);

  /**
   * Start the reconstruction process
   */
  const startReconstruction = useCallback(
    async (images: Blob[], method: ReconstructMethod): Promise<Model3D | null> => {
      // Validate inputs
      if (!images || images.length === 0) {
        handleError('upload-failed', 'No images provided for reconstruction');
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
        message: 'Preparing images for upload...',
      });

      // Update artifact status
      await updateArtifact(artifactId, { status: 'processing-3d' });

      try {
        // Phase 1: Upload/Convert images (0-30%)
        updateState('uploading', 0, 'Converting images...');

        // For now, we use the first image for reconstruction
        // In a full implementation, multi-image would combine multiple views
        const primaryImage = images[0];

        if (isCancelledRef.current) {
          return null;
        }

        updateState('uploading', 15, 'Encoding image...');

        const imageBase64 = await blobToBase64(primaryImage);

        if (isCancelledRef.current) {
          return null;
        }

        updateState('uploading', 30, 'Uploading to server...');

        // Phase 2: Processing (30-90%)
        updateState('processing', 30, 'Starting 3D reconstruction...');

        // Call the API
        const response = await reconstruct3D({
          imageBase64,
          method: methodToApiMethod(method),
          removeBackground: true,
        });

        if (isCancelledRef.current) {
          return null;
        }

        updateState('processing', 70, 'Processing 3D model...');

        // Check for API errors
        if (!response.success || !response.modelBase64) {
          handleError(
            'processing-failed',
            response.error || 'Failed to generate 3D model'
          );
          return null;
        }

        updateState('processing', 85, 'Converting model data...');

        // Phase 3: Save to IndexedDB (90-100%)
        updateState('processing', 90, 'Saving model...');

        // Convert base64 to blob
        const modelBlob = base64ToBlob(response.modelBase64);

        // Create model object
        const model: Model3D = {
          id: generateId(),
          artifactId,
          blob: modelBlob,
          format: response.format || 'glb',
          createdAt: new Date(),
          source: methodToSource(method),
          metadata: {
            fileSize: modelBlob.size,
          },
        };

        if (isCancelledRef.current) {
          return null;
        }

        // Save to IndexedDB
        await saveModel(model);

        updateState('processing', 95, 'Updating artifact...');

        // Update artifact status to complete
        await updateArtifact(artifactId, {
          status: 'complete',
          model3DId: model.id,
        });

        // Phase 4: Complete
        updateState('complete', 100, 'Reconstruction complete!');

        // Call success callback
        onSuccess?.(model);

        // Clear processing status after a short delay
        setTimeout(() => {
          setProcessingStatus(null);
        }, 1500);

        return model;
      } catch (err) {
        if (isCancelledRef.current) {
          return null;
        }

        const caughtError = err as Error;

        // Determine error type
        let errorType: ReconstructError['type'] = 'unknown';
        let errorMessage = 'An unexpected error occurred during reconstruction';

        if (caughtError instanceof APIError) {
          if (caughtError.statusCode >= 500) {
            errorType = 'processing-failed';
            errorMessage = 'Server error during reconstruction. Please try again.';
          } else if (caughtError.statusCode === 0 || caughtError.message.includes('network')) {
            errorType = 'network';
            errorMessage = 'Network error. Please check your connection and try again.';
          } else {
            errorType = 'processing-failed';
            errorMessage = caughtError.message;
          }
        } else if (caughtError.name === 'AbortError') {
          errorType = 'cancelled';
          errorMessage = 'Reconstruction was cancelled';
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
    startReconstruction,
    cancel,
    state,
    progress,
    error,
    isProcessing: state === 'uploading' || state === 'processing',
    reset,
  };
}
