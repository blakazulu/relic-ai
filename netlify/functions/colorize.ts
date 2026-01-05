import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

/**
 * Netlify Function: Colorize (PastPalette)
 *
 * Uses Google's Gemini API (Nano Banana) for intelligent artifact colorization.
 * Supports both colorization and restoration with historically accurate results.
 */

// Gemini 2.5 Flash Image (Nano Banana) for image generation/editing
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

interface ColorizeRequest {
  imageBase64: string;
  colorScheme: 'roman' | 'greek' | 'egyptian' | 'mesopotamian' | 'weathered' | 'original' | 'custom';
  customPrompt?: string;
  includeRestoration?: boolean;
}

interface ColorizeResponse {
  success: boolean;
  colorizedImageBase64?: string;
  method?: string;
  error?: string;
  processingTimeMs?: number;
}

// Historically accurate color prompts for each culture
const COLOR_SCHEME_PROMPTS: Record<string, string> = {
  roman: `Colorize this ancient Roman artifact with historically accurate pigments as it would have appeared when new:
- Rich vermillion and crimson reds (from cinnabar and red ochre)
- Deep blues (Egyptian blue pigment)
- Warm gold and yellow ochre
- Marble white and cream tones
- Terracotta and burnt sienna
- Bronze and copper metallic tones where appropriate
Maintain the artifact's texture and form while applying vibrant, authentic Roman colors.`,

  greek: `Colorize this ancient Greek artifact with historically accurate pigments as it would have appeared when new:
- Terracotta orange and red (from iron oxides)
- Black from carbon/manganese (for black-figure pottery style)
- Mediterranean blue (from azurite)
- White from kaolin clay
- Yellow ochre and gold tones
- Warm flesh tones for figures
Apply colors in the classical Greek style, maintaining the artifact's original form and details.`,

  egyptian: `Colorize this ancient Egyptian artifact with historically accurate pigments as it would have appeared when new:
- Deep lapis lazuli blue (sacred color of the sky and gods)
- Brilliant gold (from gold leaf, representing the sun and divinity)
- Turquoise and faience blue-green
- Rich emerald green (from malachite)
- Warm red ochre and orange
- Black from carbon
- White from limestone or gypsum
Apply colors in the bold, flat Egyptian artistic style with strong contrasts.`,

  mesopotamian: `Colorize this ancient Mesopotamian artifact with historically accurate pigments as it would have appeared when new:
- Deep ultramarine and lapis lazuli blue
- Burnished gold and bronze tones
- Brick red and terracotta (from the clay of the region)
- Ivory and cream whites
- Earth tones: ochre, sienna, umber
- Black from bitumen
Apply rich, jewel-like colors typical of Babylonian and Assyrian art.`,

  weathered: `Colorize this artifact showing its aged, weathered appearance:
- Muted, faded versions of original pigments
- Showing centuries of wear and patina
- Subtle earth tones with traces of original color
- Natural stone and material colors showing through
- Gentle, desaturated palette suggesting great age
Preserve the sense of antiquity while hinting at original colors.`,

  original: `Colorize this artifact with vibrant colors as it would have appeared when newly created:
- Analyze the artifact type, style, and cultural origin
- Apply historically appropriate pigments for that culture and time period
- Use rich, saturated colors that would have been used originally
- Maintain accurate material textures (stone, metal, ceramic, etc.)
Make it look as it did when an ancient craftsman just completed it.`,
};

/**
 * Colorize using Gemini API
 */
async function colorizeWithGemini(
  imageBase64: string,
  colorScheme: string,
  customPrompt?: string,
  includeRestoration?: boolean,
  apiKey?: string
): Promise<{ colorizedImageBase64: string }> {
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }

  // Build the prompt
  let prompt = customPrompt || COLOR_SCHEME_PROMPTS[colorScheme] || COLOR_SCHEME_PROMPTS.original;

  // Add restoration instructions if requested
  if (includeRestoration) {
    prompt = `First, restore this image by:
- Repairing any cracks, scratches, or damage
- Fixing faded or missing areas
- Enhancing clarity while preserving authentic details
- Removing dirt or discoloration artifacts

Then, ${prompt}`;
  }

  // Ensure we're asking for an image output
  prompt += "\n\nIMPORTANT: Generate the colorized image as output.";

  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: "image/png",
            data: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
          }
        }
      ]
    }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"]
    }
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const result = await response.json();

  // Extract the image from the response
  if (result.candidates && result.candidates[0]?.content?.parts) {
    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return { colorizedImageBase64: part.inlineData.data };
      }
    }
  }

  console.error('Gemini response:', JSON.stringify(result).substring(0, 500));
  throw new Error('No image returned from Gemini API');
}

/**
 * Netlify Function Handler
 */
const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
): Promise<{ statusCode: number; body: string; headers: Record<string, string> }> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, body: '', headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      headers,
    };
  }

  const startTime = Date.now();

  try {
    const body: ColorizeRequest = JSON.parse(event.body || '{}');
    const { imageBase64, colorScheme, customPrompt, includeRestoration } = body;

    // Validation
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

    // Get API key from environment
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 503,
        body: JSON.stringify({
          success: false,
          error: 'Colorization service is not configured. Please add GOOGLE_AI_API_KEY.',
        }),
        headers,
      };
    }

    // Perform colorization
    const result = await colorizeWithGemini(
      imageBase64,
      colorScheme,
      customPrompt,
      includeRestoration,
      apiKey
    );

    const response: ColorizeResponse = {
      success: true,
      colorizedImageBase64: result.colorizedImageBase64,
      method: `gemini-nano-banana-${colorScheme}`,
      processingTimeMs: Date.now() - startTime,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers,
    };
  } catch (error) {
    console.error('Colorization error:', error);

    const response: ColorizeResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during colorization',
      processingTimeMs: Date.now() - startTime,
    };

    return {
      statusCode: 500,
      body: JSON.stringify(response),
      headers,
    };
  }
};

export { handler };
