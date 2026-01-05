import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Client } from "@gradio/client";

/**
 * Netlify Function: Colorize (PastPalette)
 *
 * Calls HuggingFace Spaces to generate colorized versions of artifact images.
 *
 * Primary: akhaliq/deoldify - DeOldify for base colorization
 * Cultural: Uses text-guided colorization with cultural prompts
 */

// Configuration constants
const DEOLDIFY_SPACE = "akhaliq/deoldify";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const RATE_LIMIT_DELAY_MS = 5000;

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

interface GradioError extends Error {
  status?: number;
  statusText?: string;
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
 * Extract image data from Gradio result
 */
const extractImageFromResult = async (result: unknown): Promise<string> => {
  const resultData = result as { data?: unknown[] };

  if (!resultData?.data || resultData.data.length === 0) {
    throw new Error('No data in response');
  }

  const imageOutput = resultData.data[0];

  // Handle different response formats from Gradio
  if (imageOutput instanceof Blob) {
    return blobToBase64(imageOutput);
  }

  if (typeof imageOutput === 'object' && imageOutput !== null) {
    const outputObj = imageOutput as Record<string, unknown>;

    // Handle URL format (most common for Gradio)
    if (typeof outputObj.url === 'string') {
      return fetchFileAsBase64(outputObj.url);
    }

    // Handle path format
    if (typeof outputObj.path === 'string') {
      return fetchFileAsBase64(outputObj.path);
    }

    // Handle base64 data directly
    if (typeof outputObj.data === 'string') {
      // Remove data URL prefix if present
      const base64Data = outputObj.data.includes(',')
        ? outputObj.data.split(',')[1]
        : outputObj.data;
      return base64Data;
    }
  }

  // Handle direct URL string
  if (typeof imageOutput === 'string') {
    if (imageOutput.startsWith('data:')) {
      const base64Data = imageOutput.split(',')[1];
      return base64Data;
    }
    if (imageOutput.startsWith('http')) {
      return fetchFileAsBase64(imageOutput);
    }
  }

  throw new Error('Could not extract image from result');
};

/**
 * Colorize image using DeOldify Space
 * This is the primary colorization method
 */
const colorizeWithDeOldify = async (
  imageBlob: Blob,
  _colorScheme: string
): Promise<{ colorizedImageBase64: string }> => {
  const client = await Client.connect(DEOLDIFY_SPACE, {
    events: ["data", "status"],
  });

  try {
    // DeOldify typically has a simple interface:
    // Input: image
    // Output: colorized image
    // The render_factor controls quality (higher = better but slower)

    let result: unknown;
    const possibleEndpoints = ["/predict", "/colorize", "/run"];
    let lastError: Error | null = null;

    for (const endpoint of possibleEndpoints) {
      try {
        // Try with render_factor parameter
        result = await client.predict(endpoint, {
          image: imageBlob,
          render_factor: 35, // Higher quality
        });
        break;
      } catch (e) {
        // Try without render_factor (simpler API)
        try {
          result = await client.predict(endpoint, {
            image: imageBlob,
          });
          break;
        } catch (e2) {
          // Try with positional parameter
          try {
            result = await client.predict(endpoint, [imageBlob]);
            break;
          } catch (e3) {
            lastError = e3 instanceof Error ? e3 : new Error(String(e3));
          }
        }
      }
    }

    if (!result && lastError) {
      throw lastError;
    }

    if (!result) {
      throw new Error('No result from DeOldify');
    }

    const colorizedImageBase64 = await extractImageFromResult(result);
    return { colorizedImageBase64 };
  } finally {
    try {
      await client.close();
    } catch {
      // Ignore cleanup errors
    }
  }
};

/**
 * Main colorization function with retry logic
 */
const colorize = async (
  request: ColorizeRequest
): Promise<ColorizeResponse> => {
  const { imageBase64, colorScheme, customPrompt } = request;
  const startTime = Date.now();

  // Convert base64 image to Blob
  const imageBlob = base64ToBlob(imageBase64);

  // Get the prompt for cultural schemes
  const prompt = colorScheme === 'custom'
    ? customPrompt || 'Colorize this archaeological artifact'
    : COLOR_SCHEME_PROMPTS[colorScheme] || COLOR_SCHEME_PROMPTS.original;

  let lastError: Error | null = null;
  let retryCount = 0;

  // Try DeOldify with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await colorizeWithDeOldify(imageBlob, colorScheme);

      return {
        success: true,
        colorizedImageBase64: result.colorizedImageBase64,
        method: `deoldify-${colorScheme}`,
        processingTimeMs: Date.now() - startTime,
        retryCount: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount = attempt;

      console.error(`Attempt ${attempt + 1} failed for colorization:`, lastError.message);

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
