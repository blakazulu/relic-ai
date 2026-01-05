/**
 * API Client for Netlify Functions
 *
 * Handles all calls to the backend functions with proper error handling.
 */

const API_BASE = '/.netlify/functions';

export class APIError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function callFunction<T>(
  functionName: string,
  payload: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Handle error response - may not be valid JSON
    let errorData: { error?: string };
    try {
      errorData = await response.json();
    } catch {
      const errorText = await response.text();
      errorData = { error: errorText || 'API request failed' };
    }
    throw new APIError(
      errorData.error || 'API request failed',
      response.status,
      errorData
    );
  }

  return await response.json() as T;
}

/**
 * 3D Reconstruction API
 */
export interface Reconstruct3DRequest {
  imageBase64: string;
  method?: 'trellis' | 'triposr';
  removeBackground?: boolean;
}

export interface Reconstruct3DResponse {
  success: boolean;
  modelBase64?: string;
  format?: 'glb';
  error?: string;
}

export async function reconstruct3D(
  request: Reconstruct3DRequest
): Promise<Reconstruct3DResponse> {
  return callFunction<Reconstruct3DResponse>('reconstruct-3d', request);
}

/**
 * Info Card Generation API
 */
export interface GenerateInfoCardRequest {
  imageBase64: string;
  metadata?: {
    discoveryLocation?: string;
    excavationLayer?: string;
    siteName?: string;
    notes?: string;
  };
}

export interface InfoCardData {
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
}

export interface GenerateInfoCardResponse {
  success: boolean;
  infoCard?: InfoCardData;
  error?: string;
}

export async function generateInfoCard(
  request: GenerateInfoCardRequest
): Promise<GenerateInfoCardResponse> {
  return callFunction<GenerateInfoCardResponse>('generate-info-card', request);
}

/**
 * Colorization API (PastPalette)
 */
export interface ColorizeRequest {
  imageBase64: string;
  colorScheme: 'roman' | 'greek' | 'egyptian' | 'mesopotamian' | 'weathered' | 'original' | 'custom';
  customPrompt?: string;
}

export interface ColorizeResponse {
  success: boolean;
  colorizedImageBase64?: string;
  method?: string;
  error?: string;
  retryCount?: number;
  processingTimeMs?: number;
}

export async function colorize(
  request: ColorizeRequest
): Promise<ColorizeResponse> {
  return callFunction<ColorizeResponse>('colorize', request);
}
