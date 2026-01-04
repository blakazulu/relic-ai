import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

/**
 * Netlify Function: Generate Info Card
 *
 * Calls Groq API with Llama 3.2 90B Vision to generate
 * an archaeological artifact information card.
 *
 * Note: Uses llama-3.2-90b-vision-preview for vision capabilities.
 * Llama 3.3 70B is text-only and doesn't support images.
 */

interface InfoCardRequest {
  imageBase64: string;
  metadata?: {
    discoveryLocation?: string;
    excavationLayer?: string;
    siteName?: string;
    notes?: string;
  };
}

interface InfoCardResponse {
  success: boolean;
  infoCard?: {
    material: string;
    estimatedAge: {
      range: string;
      confidence: 'high' | 'medium' | 'low';
      reasoning?: string;
    };
    possibleUse: string;
    culturalContext: string;
    similarArtifacts: string[];
    preservationNotes: string;
    aiConfidence: number;
    disclaimer: string;
  };
  error?: string;
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

const SYSTEM_PROMPT = `You are an expert archaeological artifact analyst. Given an image of an artifact and optional context, generate a detailed information card.

IMPORTANT: Be factual and note uncertainties. All conclusions are speculative based on visual analysis alone.

Respond in JSON format with these exact fields:
{
  "material": "Identified or likely material (e.g., 'Terracotta', 'Bronze', 'Stone')",
  "estimatedAge": {
    "range": "Time period range (e.g., '500-300 BCE', '2nd century CE')",
    "confidence": "high|medium|low",
    "reasoning": "Brief explanation of dating estimate"
  },
  "possibleUse": "Likely function or purpose of the artifact",
  "culturalContext": "Cultural/historical context and significance",
  "similarArtifacts": ["List of similar known artifacts or types"],
  "preservationNotes": "Recommendations for preservation and handling",
  "aiConfidence": 0.75
}

Always include uncertainties in your analysis. This is AI-generated speculation, not expert verification.`;

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
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
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers,
    };
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'GROQ_API_KEY not configured' }),
        headers,
      };
    }

    const body: InfoCardRequest = JSON.parse(event.body || '{}');
    const { imageBase64, metadata } = body;

    if (!imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing imageBase64' }),
        headers,
      };
    }

    // Build user message with context
    let userMessage = 'Analyze this archaeological artifact image and generate an information card.';
    if (metadata) {
      if (metadata.discoveryLocation) {
        userMessage += `\n\nDiscovery Location: ${metadata.discoveryLocation}`;
      }
      if (metadata.excavationLayer) {
        userMessage += `\nExcavation Layer: ${metadata.excavationLayer}`;
      }
      if (metadata.siteName) {
        userMessage += `\nSite Name: ${metadata.siteName}`;
      }
      if (metadata.notes) {
        userMessage += `\nAdditional Notes: ${metadata.notes}`;
      }
    }

    // Call Groq API with retry logic
    let groqResponse: Response | null = null;
    let lastError = '';

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.2-90b-vision-preview',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: [
                  { type: 'text', text: userMessage },
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                  },
                ],
              },
            ],
            temperature: 0.3,
            max_tokens: 1024,
            response_format: { type: 'json_object' },
          }),
        });

        if (groqResponse.ok) {
          break; // Success, exit retry loop
        }

        if (!isRetryableError(groqResponse.status)) {
          // Non-retryable error, exit loop
          lastError = await groqResponse.text();
          console.error('Groq API non-retryable error:', lastError);
          break;
        }

        // Retryable error, wait and try again
        lastError = await groqResponse.text();
        console.log(`Groq API error (attempt ${attempt + 1}/${MAX_RETRIES}):`, groqResponse.status);

        if (attempt < MAX_RETRIES - 1) {
          const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          await delay(retryDelay);
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : 'Network error';
        console.error(`Fetch error (attempt ${attempt + 1}/${MAX_RETRIES}):`, lastError);

        if (attempt < MAX_RETRIES - 1) {
          const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          await delay(retryDelay);
        }
      }
    }

    if (!groqResponse || !groqResponse.ok) {
      return {
        statusCode: groqResponse?.status || 500,
        body: JSON.stringify({
          success: false,
          error: lastError || 'Groq API error after retries'
        }),
        headers,
      };
    }

    const groqData = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content;

    if (!content) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: 'Empty response from Groq' }),
        headers,
      };
    }

    // Parse the JSON response
    let infoCardData;
    try {
      infoCardData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'AI returned invalid JSON response',
        }),
        headers,
      };
    }

    const response: InfoCardResponse = {
      success: true,
      infoCard: {
        ...infoCardData,
        disclaimer: 'This analysis was generated by AI and should be verified by qualified archaeologists. All estimates are speculative based on visual analysis.',
      },
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers,
    };
  } catch (error) {
    console.error('Info card generation error:', error);
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
