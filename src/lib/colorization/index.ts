/**
 * Client-side image colorization using ONNX Runtime Web
 *
 * Uses a quantized DeOldify model (~61MB) for browser-based colorization.
 * No server required - all processing happens locally.
 */

import * as ort from 'onnxruntime-web';

// Model configuration
const MODEL_URL = 'https://cdn.glitch.me/54ac5a99-01c1-4fd0-a7c4-a020ed26b88c/deoldify-quant.onnx';
const MODEL_INPUT_SIZE = 256;

// Singleton session for reuse
let ortSession: ort.InferenceSession | null = null;
let isLoading = false;
let loadError: Error | null = null;

export interface ColorizeResult {
  success: boolean;
  colorizedImageBase64?: string;
  error?: string;
  processingTimeMs?: number;
}

export type ColorizeProgressCallback = (progress: number, message: string) => void;

/**
 * Load the ONNX model (lazy loading, singleton)
 */
async function loadModel(onProgress?: ColorizeProgressCallback): Promise<ort.InferenceSession> {
  if (ortSession) {
    return ortSession;
  }

  if (loadError) {
    throw loadError;
  }

  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (ortSession) return ortSession;
    if (loadError) throw loadError;
  }

  isLoading = true;
  onProgress?.(5, 'Loading AI model...');

  try {
    // Configure ONNX Runtime for browser
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/';

    onProgress?.(10, 'Downloading model (~61MB)...');

    // Create inference session
    ortSession = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });

    onProgress?.(25, 'Model loaded successfully');
    return ortSession;
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    throw loadError;
  } finally {
    isLoading = false;
  }
}

/**
 * Preprocess image for the model
 * - Resize to 256x256
 * - Convert to channel-first format (RGB)
 * - Normalize to Float32Array
 */
async function preprocessImage(
  imageBlob: Blob,
  onProgress?: ColorizeProgressCallback
): Promise<{ tensor: Float32Array; originalWidth: number; originalHeight: number }> {
  onProgress?.(30, 'Preprocessing image...');

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = MODEL_INPUT_SIZE;
        canvas.height = MODEL_INPUT_SIZE;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw resized image
        ctx.drawImage(img, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
        const pixels = imageData.data;

        // Convert to channel-first format (all R, then all G, then all B)
        const tensor = new Float32Array(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
        const pixelCount = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;

        for (let i = 0; i < pixelCount; i++) {
          const pixelIndex = i * 4;
          tensor[i] = pixels[pixelIndex] / 255.0;                    // R channel
          tensor[pixelCount + i] = pixels[pixelIndex + 1] / 255.0;   // G channel
          tensor[2 * pixelCount + i] = pixels[pixelIndex + 2] / 255.0; // B channel
        }

        onProgress?.(40, 'Image preprocessed');
        resolve({ tensor, originalWidth, originalHeight });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageBlob);
  });
}

/**
 * Postprocess model output to image
 * - Convert tensor back to RGBA
 * - Scale to original dimensions
 */
function postprocessOutput(
  outputTensor: ort.Tensor,
  originalWidth: number,
  originalHeight: number,
  onProgress?: ColorizeProgressCallback
): string {
  onProgress?.(70, 'Processing colorized output...');

  const outputData = outputTensor.data as Float32Array;
  const [, , height, width] = outputTensor.dims;

  // Create canvas for output
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Create ImageData
  const imageData = ctx.createImageData(width, height);
  const pixels = imageData.data;

  // Convert channel-first tensor to RGBA
  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      const pixelIndex = (h * width + w) * 4;

      // Get RGB values from tensor (channel-first format)
      const r = outputData[(0 * height + h) * width + w];
      const g = outputData[(1 * height + h) * width + w];
      const b = outputData[(2 * height + h) * width + w];

      // Clamp and scale to 0-255
      pixels[pixelIndex] = Math.max(0, Math.min(255, Math.round(r * 255)));
      pixels[pixelIndex + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
      pixels[pixelIndex + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
      pixels[pixelIndex + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imageData, 0, 0);

  onProgress?.(80, 'Scaling to original size...');

  // Scale to original dimensions
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = originalWidth;
  finalCanvas.height = originalHeight;
  const finalCtx = finalCanvas.getContext('2d');

  if (!finalCtx) {
    throw new Error('Failed to get final canvas context');
  }

  finalCtx.drawImage(canvas, 0, 0, originalWidth, originalHeight);

  onProgress?.(90, 'Encoding result...');

  // Convert to base64
  const dataUrl = finalCanvas.toDataURL('image/png');
  return dataUrl.split(',')[1]; // Remove data URL prefix
}

/**
 * Colorize an image using the local ONNX model
 */
export async function colorizeImage(
  imageBlob: Blob,
  onProgress?: ColorizeProgressCallback
): Promise<ColorizeResult> {
  const startTime = Date.now();

  try {
    // Load model (lazy, singleton)
    const session = await loadModel(onProgress);

    // Preprocess
    const { tensor, originalWidth, originalHeight } = await preprocessImage(imageBlob, onProgress);

    onProgress?.(50, 'Running AI colorization...');

    // Create input tensor
    const inputTensor = new ort.Tensor('float32', tensor, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);

    // Run inference
    const feeds: Record<string, ort.Tensor> = { input: inputTensor };
    const results = await session.run(feeds);

    onProgress?.(65, 'AI processing complete');

    // Get output tensor (first output)
    const outputTensor = Object.values(results)[0];

    // Postprocess
    const colorizedImageBase64 = postprocessOutput(
      outputTensor,
      originalWidth,
      originalHeight,
      onProgress
    );

    onProgress?.(95, 'Colorization complete!');

    return {
      success: true,
      colorizedImageBase64,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Colorization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during colorization',
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Preload the model for faster first colorization
 */
export async function preloadModel(): Promise<boolean> {
  try {
    await loadModel();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the model is loaded
 */
export function isModelLoaded(): boolean {
  return ortSession !== null;
}

/**
 * Get model loading status
 */
export function getModelStatus(): 'not-loaded' | 'loading' | 'loaded' | 'error' {
  if (loadError) return 'error';
  if (ortSession) return 'loaded';
  if (isLoading) return 'loading';
  return 'not-loaded';
}
