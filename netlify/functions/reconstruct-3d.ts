import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Client } from "@gradio/client";

/**
 * Netlify Function: 3D Reconstruction
 *
 * Calls HuggingFace Spaces (TRELLIS.2 or TripoSR) to generate
 * a 3D model from a single image.
 *
 * TRELLIS.2: microsoft/TRELLIS.2 - High-quality 4B parameter model
 * TripoSR: stabilityai/TripoSR - Fast backup option
 */

// Configuration constants
const TRELLIS_SPACE = "microsoft/TRELLIS.2";
const TRIPOSR_SPACE = "stabilityai/TripoSR";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const RATE_LIMIT_DELAY_MS = 5000;

interface ReconstructRequest {
  imageBase64: string;
  method: 'trellis' | 'triposr';
  removeBackground?: boolean;
  // Optional TRELLIS parameters
  trellisParams?: {
    seed?: number;
    ssGuidanceRescale?: number;
    ssSamplingSteps?: number;
    ssRescaleT?: number;
    shapeGuidanceRescale?: number;
    shapeSamplingSteps?: number;
    shapeRescaleT?: number;
    texGuidanceRescale?: number;
    texSamplingSteps?: number;
    texRescaleT?: number;
    decimationTarget?: number;
    textureSize?: number;
  };
  // Optional TripoSR parameters
  triposrParams?: {
    foregroundRatio?: number;
    mcResolution?: number;
  };
}

interface ReconstructResponse {
  success: boolean;
  modelBase64?: string;
  format?: 'glb';
  method?: 'trellis' | 'triposr';
  processingTimeMs?: number;
  error?: string;
  retryCount?: number;
}

interface GradioError extends Error {
  status?: number;
  statusText?: string;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Determines if an error is retryable (rate limit, timeout, etc.)
 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const gradioError = error as GradioError;

    // Rate limiting
    if (gradioError.status === 429) return true;
    if (message.includes('rate limit')) return true;
    if (message.includes('too many requests')) return true;

    // Timeouts and connection issues
    if (message.includes('timeout')) return true;
    if (message.includes('econnreset')) return true;
    if (message.includes('econnrefused')) return true;
    if (message.includes('network')) return true;

    // Space loading/sleeping
    if (message.includes('loading')) return true;
    if (message.includes('starting')) return true;
    if (message.includes('sleeping')) return true;
    if (message.includes('building')) return true;

    // Server errors (5xx)
    if (gradioError.status && gradioError.status >= 500 && gradioError.status < 600) {
      return true;
    }
  }
  return false;
};

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (retryCount: number, isRateLimit: boolean): number => {
  const baseDelay = isRateLimit ? RATE_LIMIT_DELAY_MS : RETRY_DELAY_MS;
  return baseDelay * Math.pow(2, retryCount);
};

/**
 * Convert base64 image to Blob for Gradio
 */
const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};

/**
 * Convert Blob/ArrayBuffer to base64
 */
const blobToBase64 = async (data: Blob | ArrayBuffer | Response): Promise<string> => {
  let arrayBuffer: ArrayBuffer;

  if (data instanceof Response) {
    arrayBuffer = await data.arrayBuffer();
  } else if (data instanceof Blob) {
    arrayBuffer = await data.arrayBuffer();
  } else {
    arrayBuffer = data;
  }

  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Fetch file from URL and convert to base64
 */
const fetchFileAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }
  return blobToBase64(response);
};

/**
 * Generate 3D model using TRELLIS.2
 */
const generateWithTrellis = async (
  imageBlob: Blob,
  params: ReconstructRequest['trellisParams'] = {}
): Promise<{ modelBase64: string; format: 'glb' }> => {
  const client = await Client.connect(TRELLIS_SPACE, {
    events: ["data", "status"],
  });

  // Default TRELLIS parameters based on research
  const {
    seed = 42,
    ssGuidanceRescale = 0.7,
    ssSamplingSteps = 12,
    ssRescaleT = 5.0,
    shapeGuidanceRescale = 0.5,
    shapeSamplingSteps = 12,
    shapeRescaleT = 3.0,
    texGuidanceRescale = 0.0,
    texSamplingSteps = 12,
    texRescaleT = 3.0,
    decimationTarget = 500000,
    textureSize = 2048,
  } = params;

  try {
    // TRELLIS.2 uses a multi-step pipeline:
    // 1. Upload/preprocess image
    // 2. Generate 3D structure
    // 3. Extract GLB

    // First, try to call the main generation endpoint
    // The exact API endpoint name may vary, common patterns are:
    // "/generate", "/run", "/predict", "/image_to_3d"

    // Attempt the generation - try different possible endpoint names
    let result: unknown;
    const possibleEndpoints = ["/generate", "/image_to_3d", "/run", "/predict"];
    let lastError: Error | null = null;

    for (const endpoint of possibleEndpoints) {
      try {
        result = await client.predict(endpoint, {
          image_prompt: imageBlob,
          seed: seed,
          ss_guidance_rescale: ssGuidanceRescale,
          ss_sampling_steps: ssSamplingSteps,
          ss_rescale_t: ssRescaleT,
          shape_slat_guidance_rescale: shapeGuidanceRescale,
          shape_slat_sampling_steps: shapeSamplingSteps,
          shape_slat_rescale_t: shapeRescaleT,
          tex_slat_guidance_rescale: texGuidanceRescale,
          tex_slat_sampling_steps: texSamplingSteps,
          tex_slat_rescale_t: texRescaleT,
        });
        break; // Success, exit loop
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        // Continue to next endpoint
      }
    }

    if (!result && lastError) {
      throw lastError;
    }

    // Extract GLB from result
    // The result structure depends on the Gradio interface
    // Common patterns: result.data[0], result.data.glb, result[0]
    const resultData = result as { data: unknown[] };

    let glbData: string | Blob | { url: string } | undefined;

    if (resultData?.data) {
      // Look for GLB in result data
      for (const item of resultData.data) {
        if (item && typeof item === 'object') {
          const itemObj = item as Record<string, unknown>;
          // Check for URL pattern (Gradio often returns file URLs)
          if (typeof itemObj.url === 'string' && itemObj.url.includes('.glb')) {
            glbData = itemObj as { url: string };
            break;
          }
          // Check for path pattern
          if (typeof itemObj.path === 'string' && itemObj.path.includes('.glb')) {
            glbData = itemObj as { url: string };
            break;
          }
        }
        if (item instanceof Blob) {
          glbData = item;
          break;
        }
      }
    }

    // If we got a URL, fetch the actual GLB file
    if (glbData && typeof glbData === 'object' && 'url' in glbData) {
      const modelBase64 = await fetchFileAsBase64(glbData.url);
      return { modelBase64, format: 'glb' };
    }

    // If we got a Blob directly
    if (glbData instanceof Blob) {
      const modelBase64 = await blobToBase64(glbData);
      return { modelBase64, format: 'glb' };
    }

    // Try to extract GLB using the extract_glb endpoint if available
    try {
      const extractResult = await client.predict("/extract_glb", {
        decimation_target: decimationTarget,
        texture_size: textureSize,
      });

      const extractData = extractResult as { data: unknown[] };
      if (extractData?.data?.[0]) {
        const glbItem = extractData.data[0] as { url?: string } | Blob;
        if (glbItem instanceof Blob) {
          const modelBase64 = await blobToBase64(glbItem);
          return { modelBase64, format: 'glb' };
        }
        if (typeof glbItem === 'object' && glbItem.url) {
          const modelBase64 = await fetchFileAsBase64(glbItem.url);
          return { modelBase64, format: 'glb' };
        }
      }
    } catch {
      // extract_glb endpoint not available or failed
    }

    throw new Error('Could not extract GLB from TRELLIS.2 result');
  } finally {
    // Cleanup client connection if possible
    try {
      await client.close();
    } catch {
      // Ignore cleanup errors
    }
  }
};

/**
 * Generate 3D model using TripoSR
 */
const generateWithTripoSR = async (
  imageBlob: Blob,
  removeBackground: boolean,
  params: ReconstructRequest['triposrParams'] = {}
): Promise<{ modelBase64: string; format: 'glb' }> => {
  const client = await Client.connect(TRIPOSR_SPACE, {
    events: ["data", "status"],
  });

  const { foregroundRatio = 0.85, mcResolution = 256 } = params;

  try {
    // TripoSR uses a 3-step workflow:
    // 1. check_input_image - validate image
    // 2. preprocess - remove background, resize
    // 3. generate - create 3D model

    // Step 1: Validate image (optional, skip if it fails)
    try {
      await client.predict("/check_input_image", {
        input_image: imageBlob,
      });
    } catch {
      // Validation step is optional
    }

    // Step 2: Preprocess the image
    let processedImage: Blob | { url: string } = imageBlob;
    try {
      const preprocessResult = await client.predict("/preprocess", {
        input_image: imageBlob,
        do_remove_background: removeBackground,
        foreground_ratio: foregroundRatio,
      });

      const preprocessData = preprocessResult as { data: unknown[] };
      if (preprocessData?.data?.[0]) {
        const processed = preprocessData.data[0] as Blob | { url: string };
        processedImage = processed;
      }
    } catch {
      // Preprocessing failed, use original image
      console.warn('TripoSR preprocessing failed, using original image');
    }

    // If preprocessed image is a URL, fetch it as a blob
    let imageForGeneration: Blob;
    if (processedImage instanceof Blob) {
      imageForGeneration = processedImage;
    } else if (typeof processedImage === 'object' && 'url' in processedImage) {
      const response = await fetch(processedImage.url);
      imageForGeneration = await response.blob();
    } else {
      imageForGeneration = imageBlob;
    }

    // Step 3: Generate 3D model
    const result = await client.predict("/generate", {
      image: imageForGeneration,
      mc_resolution: mcResolution,
    });

    const resultData = result as { data: unknown[] };

    // TripoSR returns [obj_path, glb_path]
    // We want the GLB (index 1)
    let glbData: string | Blob | { url: string } | undefined;

    if (resultData?.data) {
      // GLB is typically the second output (index 1)
      const glbOutput = resultData.data[1] || resultData.data[0];

      if (glbOutput instanceof Blob) {
        glbData = glbOutput;
      } else if (typeof glbOutput === 'object' && glbOutput !== null) {
        const outputObj = glbOutput as Record<string, unknown>;
        if (typeof outputObj.url === 'string') {
          glbData = outputObj as { url: string };
        } else if (typeof outputObj.path === 'string') {
          // Some Gradio versions use 'path' instead of 'url'
          glbData = { url: outputObj.path as string };
        }
      } else if (typeof glbOutput === 'string' && glbOutput.includes('.glb')) {
        glbData = { url: glbOutput };
      }
    }

    // Fetch and convert to base64
    if (glbData && typeof glbData === 'object' && 'url' in glbData) {
      const modelBase64 = await fetchFileAsBase64(glbData.url);
      return { modelBase64, format: 'glb' };
    }

    if (glbData instanceof Blob) {
      const modelBase64 = await blobToBase64(glbData);
      return { modelBase64, format: 'glb' };
    }

    throw new Error('Could not extract GLB from TripoSR result');
  } finally {
    try {
      await client.close();
    } catch {
      // Ignore cleanup errors
    }
  }
};

/**
 * Main 3D reconstruction function with retry logic
 */
const reconstruct3D = async (
  request: ReconstructRequest
): Promise<ReconstructResponse> => {
  const { imageBase64, method, removeBackground = true, trellisParams, triposrParams } = request;
  const startTime = Date.now();

  // Convert base64 image to Blob
  const imageBlob = base64ToBlob(imageBase64);

  let lastError: Error | null = null;
  let retryCount = 0;

  // Try the primary method with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let result: { modelBase64: string; format: 'glb' };

      if (method === 'trellis') {
        result = await generateWithTrellis(imageBlob, trellisParams);
      } else {
        result = await generateWithTripoSR(imageBlob, removeBackground, triposrParams);
      }

      return {
        success: true,
        modelBase64: result.modelBase64,
        format: result.format,
        method: method,
        processingTimeMs: Date.now() - startTime,
        retryCount: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount = attempt;

      console.error(`Attempt ${attempt + 1} failed for ${method}:`, lastError.message);

      // Check if we should retry
      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        const isRateLimit = lastError.message.toLowerCase().includes('rate');
        const delay = getRetryDelay(attempt, isRateLimit);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      } else if (attempt >= MAX_RETRIES) {
        break;
      } else {
        // Non-retryable error, break out
        break;
      }
    }
  }

  // If primary method failed, try fallback (if applicable)
  if (method === 'trellis') {
    console.log('TRELLIS.2 failed, attempting TripoSR fallback...');

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await generateWithTripoSR(imageBlob, removeBackground, triposrParams);

        return {
          success: true,
          modelBase64: result.modelBase64,
          format: result.format,
          method: 'triposr', // Indicate fallback was used
          processingTimeMs: Date.now() - startTime,
          retryCount: retryCount + attempt + 1,
        };
      } catch (error) {
        const fallbackError = error instanceof Error ? error : new Error(String(error));
        console.error(`TripoSR fallback attempt ${attempt + 1} failed:`, fallbackError.message);

        if (attempt < MAX_RETRIES && isRetryableError(error)) {
          const isRateLimit = fallbackError.message.toLowerCase().includes('rate');
          const delay = getRetryDelay(attempt, isRateLimit);
          await sleep(delay);
        } else if (attempt >= MAX_RETRIES) {
          break;
        } else {
          break;
        }
      }
    }
  }

  // All attempts failed
  return {
    success: false,
    error: lastError?.message || 'Unknown error during 3D reconstruction',
    processingTimeMs: Date.now() - startTime,
    retryCount: retryCount,
  };
};

/**
 * Netlify Function Handler
 */
const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
): Promise<{ statusCode: number; body: string; headers: Record<string, string> }> => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, body: '', headers };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      headers,
    };
  }

  try {
    // Parse and validate request body
    const body: ReconstructRequest = JSON.parse(event.body || '{}');
    const { imageBase64, method = 'trellis' } = body;

    // Validate required fields
    if (!imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing imageBase64' }),
        headers,
      };
    }

    // Validate method
    if (method !== 'trellis' && method !== 'triposr') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Invalid method. Must be "trellis" or "triposr"',
        }),
        headers,
      };
    }

    // Validate base64 format (basic check)
    try {
      const testBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      atob(testBase64.substring(0, 100)); // Test first 100 chars
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid base64 image data' }),
        headers,
      };
    }

    // Perform 3D reconstruction
    const response = await reconstruct3D(body);

    if (response.success) {
      return {
        statusCode: 200,
        body: JSON.stringify(response),
        headers,
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify(response),
        headers,
      };
    }
  } catch (error) {
    console.error('3D reconstruction error:', error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
        }),
        headers,
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      headers,
    };
  }
};

export { handler };
