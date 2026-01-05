import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

/**
 * Netlify Function: Colorize (PastPalette)
 *
 * This function is deprecated in favor of client-side colorization.
 * The app now uses ONNX Runtime Web to run DeOldify directly in the browser.
 *
 * This endpoint remains for backwards compatibility and returns an appropriate message.
 */

interface ColorizeResponse {
  success: boolean;
  error?: string;
  message?: string;
  useClientSide?: boolean;
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

  // Return message directing to client-side processing
  const response: ColorizeResponse = {
    success: false,
    error: 'Server-side colorization is not available. Please use the client-side colorization feature.',
    message: 'Colorization now runs locally in your browser using AI for better privacy and reliability.',
    useClientSide: true,
  };

  return {
    statusCode: 501, // Not Implemented
    body: JSON.stringify(response),
    headers,
  };
};

export { handler };
