import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

/**
 * Netlify Function: Colorize (PastPalette)
 *
 * Calls HuggingFace Spaces via direct HTTP to generate colorized versions of artifact images.
 * Uses REST API instead of WebSocket-based Gradio client for serverless compatibility.
 *
 * Primary: akhaliq/deoldify - DeOldify for base colorization
 */

// Configuration constants
const DEOLDIFY_SPACE_URL = "https://akhaliq-deoldify.hf.space";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const RATE_LIMIT_DELAY_MS = 5000;
const REQUEST_TIMEOUT_MS = 55000; // Netlify function timeout is 60s

interface ColorizeRequest {
  imageBase64: string;
  colorScheme: 'roman' | 'greek' | 'egyptian' | 'mesopotamian' | 'weathered' | 'original' | 'custom';
  customPrompt?: string;
}

interface ColorizeResponse {
  success: boolean;
  colorizedImageBase64?: string;
  method?: string;
  error?: string;
  retryCount?: number;
  processingTimeMs?: number;
}

interface GradioApiResponse {
  data?: unknown[];
  error?: string;
  detail?: string;
}

interface GradioFileResponse {
  url?: string;
  path?: string;
  name?: string;
}

// Cultural color scheme prompts - historically accurate pigment descriptions
// NOTE: NO PURPLE per design guidelines - using alternative historical Roman colors
const COLOR_SCHEME_PROMPTS: Record<string, string> = {
  roman: 'Rich Roman colors with deep crimson reds, burnt sienna, gold leaf accents, marble white, terracotta, ochre',
  greek: 'Classical Greek palette with terracotta orange, black-figure pottery black, red ochre, Mediterranean cerulean blue, white marble',
  egyptian: 'Ancient Egyptian colors with lapis lazuli blue, gold, turquoise, rich emerald green, burnt sienna, white alabaster',
  mesopotamian: 'Mesopotamian palette with deep ultramarine blue, burnished gold, brick red, earth tones, ivory',
  weathered: 'Subtle weathered appearance with muted earth tones showing centuries of age, faded pigments',
  original: 'Reconstruct vibrant original colors as the artifact would have appeared when new',
};

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

    // Rate limiting
    if (message.includes('429')) return true;
    if (message.includes('rate limit')) return true;
    if (message.includes('too many requests')) return true;

    // Timeouts and connection issues
    if (message.includes('timeout')) return true;
    if (message.includes('econnreset')) return true;
    if (message.includes('econnrefused')) return true;
    if (message.includes('network')) return true;
    if (message.includes('fetch failed')) return true;

    // Space loading/sleeping
    if (message.includes('loading')) return true;
    if (message.includes('starting')) return true;
    if (message.includes('sleeping')) return true;
    if (message.includes('building')) return true;
    if (message.includes('queue')) return true;

    // Server errors (5xx)
    if (message.includes('500') || message.includes('502') ||
        message.includes('503') || message.includes('504')) {
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
 * Fetch with timeout support
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Convert base64 to data URL format for Gradio
 */
const toDataUrl = (base64: string, mimeType: string = 'image/png'): string => {
  // If already a data URL, return as-is
  if (base64.startsWith('data:')) {
    return base64;
  }
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Fetch file from URL and convert to base64
 */
const fetchFileAsBase64 = async (url: string): Promise<string> => {
  const response = await fetchWithTimeout(url, {}, 30000);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Upload file to Gradio space and get file reference
 */
const uploadToGradio = async (
  spaceUrl: string,
  base64Data: string
): Promise<string> => {
  // Remove data URL prefix if present
  const pureBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  // Convert base64 to binary
  const binaryString = atob(pureBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'image/png' });

  // Create form data
  const formData = new FormData();
  formData.append('files', blob, 'image.png');

  // Upload to Gradio
  const uploadResponse = await fetchWithTimeout(
    `${spaceUrl}/upload`,
    {
      method: 'POST',
      body: formData,
    },
    30000
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  const uploadResult = await uploadResponse.json() as string[];
  if (!uploadResult || uploadResult.length === 0) {
    throw new Error('No file path returned from upload');
  }

  return uploadResult[0]; // Return the file path
};

/**
 * Extract image data from Gradio API response
 */
const extractImageFromResult = async (
  spaceUrl: string,
  data: unknown[]
): Promise<string> => {
  if (!data || data.length === 0) {
    throw new Error('No data in response');
  }

  const imageOutput = data[0];

  // Handle file response object
  if (typeof imageOutput === 'object' && imageOutput !== null) {
    const fileResponse = imageOutput as GradioFileResponse;

    // Handle URL format (most common)
    if (fileResponse.url) {
      // URL might be relative or absolute
      const fullUrl = fileResponse.url.startsWith('http')
        ? fileResponse.url
        : `${spaceUrl}${fileResponse.url.startsWith('/') ? '' : '/'}${fileResponse.url}`;
      return fetchFileAsBase64(fullUrl);
    }

    // Handle path format
    if (fileResponse.path) {
      const fullUrl = `${spaceUrl}/file=${fileResponse.path}`;
      return fetchFileAsBase64(fullUrl);
    }

    // Handle name format (older Gradio versions)
    if (fileResponse.name) {
      const fullUrl = `${spaceUrl}/file=${fileResponse.name}`;
      return fetchFileAsBase64(fullUrl);
    }
  }

  // Handle direct URL string
  if (typeof imageOutput === 'string') {
    if (imageOutput.startsWith('data:')) {
      const base64Data = imageOutput.split(',')[1];
      return base64Data;
    }
    if (imageOutput.startsWith('http') || imageOutput.startsWith('/')) {
      const fullUrl = imageOutput.startsWith('http')
        ? imageOutput
        : `${spaceUrl}${imageOutput}`;
      return fetchFileAsBase64(fullUrl);
    }
  }

  throw new Error(`Could not extract image from result: ${JSON.stringify(imageOutput).substring(0, 200)}`);
};

/**
 * Call Gradio API endpoint directly via HTTP
 */
const callGradioApi = async (
  spaceUrl: string,
  endpoint: string,
  data: unknown[]
): Promise<GradioApiResponse> => {
  const response = await fetchWithTimeout(
    `${spaceUrl}/api/${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} - ${errorText}`);
  }

  return await response.json() as GradioApiResponse;
};

/**
 * Colorize image using DeOldify Space via HTTP API
 */
const colorizeWithDeOldify = async (
  imageBase64: string,
  _colorScheme: string
): Promise<{ colorizedImageBase64: string }> => {
  // First, try to upload the file
  let filePath: string;
  try {
    filePath = await uploadToGradio(DEOLDIFY_SPACE_URL, imageBase64);
    console.log('File uploaded successfully:', filePath);
  } catch (uploadError) {
    console.log('Upload method failed, trying direct data URL:', uploadError);
    // Fall back to data URL method
    filePath = toDataUrl(imageBase64);
  }

  // Try different API endpoints that DeOldify might expose
  const endpoints = ['predict', 'run/predict'];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      // DeOldify expects: image input, render_factor (optional)
      // Try with file path/data URL
      const result = await callGradioApi(DEOLDIFY_SPACE_URL, endpoint, [filePath]);

      if (result.error || result.detail) {
        throw new Error(result.error || result.detail);
      }

      if (result.data) {
        const colorizedImageBase64 = await extractImageFromResult(
          DEOLDIFY_SPACE_URL,
          result.data
        );
        return { colorizedImageBase64 };
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Endpoint ${endpoint} failed:`, lastError.message);
    }
  }

  throw lastError || new Error('All API endpoints failed');
};

/**
 * Main colorization function with retry logic
 */
const colorize = async (
  request: ColorizeRequest
): Promise<ColorizeResponse> => {
  const { imageBase64, colorScheme } = request;
  const startTime = Date.now();

  let lastError: Error | null = null;
  let retryCount = 0;

  // Try DeOldify with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await colorizeWithDeOldify(imageBase64, colorScheme);

      return {
        success: true,
        colorizedImageBase64: result.colorizedImageBase64,
        method: `deoldify-http-${colorScheme}`,
        processingTimeMs: Date.now() - startTime,
        retryCount: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount = attempt;

      console.error(`Attempt ${attempt + 1} failed for colorization:`, lastError.message);

      // Check if we should retry
      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        const isRateLimit = lastError.message.toLowerCase().includes('rate') ||
                          lastError.message.includes('429');
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

  // All attempts failed
  return {
    success: false,
    error: lastError?.message || 'Unknown error during colorization',
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
    const body: ColorizeRequest = JSON.parse(event.body || '{}');
    const { imageBase64, colorScheme, customPrompt } = body;

    // Validate required fields
    if (!imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing imageBase64' }),
        headers,
      };
    }

    if (!colorScheme) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing colorScheme' }),
        headers,
      };
    }

    // Validate colorScheme
    const validSchemes = ['roman', 'greek', 'egyptian', 'mesopotamian', 'weathered', 'original', 'custom'];
    if (!validSchemes.includes(colorScheme)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: `Invalid colorScheme. Must be one of: ${validSchemes.join(', ')}`,
        }),
        headers,
      };
    }

    // Validate custom prompt if using custom scheme
    if (colorScheme === 'custom' && !customPrompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'customPrompt is required when colorScheme is "custom"',
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

    // Perform colorization
    const response = await colorize(body);

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
    console.error('Colorization error:', error);

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
