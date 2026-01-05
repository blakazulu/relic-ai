import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

/**
 * Netlify Function: Generate Info Card
 *
 * Uses Google's Gemini API for archaeological artifact analysis.
 * Generates detailed information cards with material, age, cultural context, etc.
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

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

Always include uncertainties in your analysis. This is AI-generated speculation, not expert verification.
Return ONLY valid JSON, no markdown code blocks or other formatting.`;

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
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers,
    };
  }

  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }),
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

    // Call Gemini API
    const requestBody = {
      contents: [{
        parts: [
          { text: SYSTEM_PROMPT + "\n\n" + userMessage },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
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
      return {
        statusCode: response.status,
        body: JSON.stringify({
          success: false,
          error: `Gemini API error: ${response.status}`
        }),
        headers,
      };
    }

    const geminiData = await response.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: 'Empty response from Gemini' }),
        headers,
      };
    }

    // Parse the JSON response - handle potential markdown code blocks
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7);
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.slice(0, -3);
    }
    jsonContent = jsonContent.trim();

    let infoCardData;
    try {
      infoCardData = JSON.parse(jsonContent);
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

    const infoCardResponse: InfoCardResponse = {
      success: true,
      infoCard: {
        ...infoCardData,
        disclaimer: 'This analysis was generated by AI and should be verified by qualified archaeologists. All estimates are speculative based on visual analysis.',
      },
    };

    return {
      statusCode: 200,
      body: JSON.stringify(infoCardResponse),
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
