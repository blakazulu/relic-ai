# API Documentation

This document describes the Netlify Functions API endpoints available in the Archaeology Web App.

## Base URL

- **Development**: `http://localhost:8888/.netlify/functions/`
- **Production**: `https://<your-site>.netlify.app/.netlify/functions/`

All endpoints accept `POST` requests with JSON bodies and return JSON responses.

---

## Endpoints

### POST /api/reconstruct-3d

Generates a 3D model from a single artifact image using TRELLIS.2 or TripoSR via HuggingFace Spaces.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "imageBase64": "string (required)",
  "method": "trellis | triposr (required)",
  "removeBackground": "boolean (optional, default: true)",
  "trellisParams": {
    "seed": "number (optional, default: 42)",
    "ssGuidanceRescale": "number (optional, default: 0.7)",
    "ssSamplingSteps": "number (optional, default: 12)",
    "ssRescaleT": "number (optional, default: 5.0)",
    "shapeGuidanceRescale": "number (optional, default: 0.5)",
    "shapeSamplingSteps": "number (optional, default: 12)",
    "shapeRescaleT": "number (optional, default: 3.0)",
    "texGuidanceRescale": "number (optional, default: 0.0)",
    "texSamplingSteps": "number (optional, default: 12)",
    "texRescaleT": "number (optional, default: 3.0)",
    "decimationTarget": "number (optional, default: 500000)",
    "textureSize": "number (optional, default: 2048)"
  },
  "triposrParams": {
    "foregroundRatio": "number (optional, default: 0.85)",
    "mcResolution": "number (optional, default: 256)"
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageBase64` | string | Yes | Base64-encoded image (with or without data URL prefix) |
| `method` | string | Yes | Reconstruction method: `trellis` for high quality, `triposr` for fast results |
| `removeBackground` | boolean | No | Whether to remove background before processing (default: true) |
| `trellisParams` | object | No | Advanced parameters for TRELLIS.2 model |
| `triposrParams` | object | No | Advanced parameters for TripoSR model |

#### Response

**Success (200):**
```json
{
  "success": true,
  "modelBase64": "string (base64-encoded GLB file)",
  "format": "glb",
  "method": "trellis | triposr",
  "processingTimeMs": 45000,
  "retryCount": 0
}
```

**Error (400/500):**
```json
{
  "success": false,
  "error": "Error message describing the failure",
  "processingTimeMs": 5000,
  "retryCount": 3
}
```

#### Example Request

```javascript
const response = await fetch('/.netlify/functions/reconstruct-3d', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageBase64: 'data:image/jpeg;base64,/9j/4AAQ...',
    method: 'trellis',
    removeBackground: true
  })
});

const data = await response.json();
if (data.success) {
  // Convert base64 to blob for 3D viewer
  const modelBlob = base64ToBlob(data.modelBase64, 'model/gltf-binary');
}
```

#### Notes

- Processing time varies: TRELLIS.2 typically takes 30-60 seconds, TripoSR takes 10-30 seconds
- If TRELLIS.2 fails, the function automatically falls back to TripoSR
- The function implements exponential backoff with up to 3 retries for transient errors
- Rate limiting may occur on HuggingFace Spaces; the function handles this with appropriate delays

---

### POST /api/generate-info-card

Generates an AI-powered artifact information card using Groq's Llama 3.2 90B Vision model.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "imageBase64": "string (required)",
  "metadata": {
    "discoveryLocation": "string (optional)",
    "excavationLayer": "string (optional)",
    "siteName": "string (optional)",
    "notes": "string (optional)"
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageBase64` | string | Yes | Base64-encoded image of the artifact (without data URL prefix) |
| `metadata` | object | No | Optional context to improve analysis accuracy |
| `metadata.discoveryLocation` | string | No | GPS coordinates or description of where artifact was found |
| `metadata.excavationLayer` | string | No | Stratigraphic layer information |
| `metadata.siteName` | string | No | Name of the archaeological site |
| `metadata.notes` | string | No | Additional observations or context |

#### Response

**Success (200):**
```json
{
  "success": true,
  "infoCard": {
    "material": "Terracotta with traces of red ochre pigment",
    "estimatedAge": {
      "range": "300-100 BCE",
      "confidence": "medium",
      "reasoning": "Based on the manufacturing technique and stylistic elements typical of Hellenistic period pottery"
    },
    "possibleUse": "Likely a votive figurine used in household religious practices",
    "culturalContext": "This type of figurine is characteristic of Greek domestic worship, often placed in household shrines (lararia) as offerings to protective deities",
    "similarArtifacts": [
      "Tanagra figurines from Boeotia",
      "Myrina terracottas from Asia Minor",
      "Hellenistic coroplastic works from South Italy"
    ],
    "preservationNotes": "Store in stable humidity (45-55% RH). Handle with gloves to prevent oil transfer. The surface pigment is fragile - avoid direct contact. Consider consolidation treatment for flaking areas.",
    "aiConfidence": 0.75,
    "disclaimer": "This analysis was generated by AI and should be verified by qualified archaeologists. All estimates are speculative based on visual analysis."
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Missing imageBase64"
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "GROQ_API_KEY not configured"
}
```

#### Example Request

```javascript
const response = await fetch('/.netlify/functions/generate-info-card', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageBase64: '/9j/4AAQ...',  // Note: no data URL prefix
    metadata: {
      discoveryLocation: '37.9715, 23.7267 (Athens, Greece)',
      excavationLayer: 'Layer III, depth 1.2m',
      siteName: 'Agora Excavation',
      notes: 'Found near pottery workshop remains'
    }
  })
});

const data = await response.json();
if (data.success) {
  console.log('Material:', data.infoCard.material);
  console.log('Age:', data.infoCard.estimatedAge.range);
}
```

#### Info Card Fields

| Field | Type | Description |
|-------|------|-------------|
| `material` | string | Identified or likely material composition |
| `estimatedAge.range` | string | Time period estimate (e.g., "500-300 BCE") |
| `estimatedAge.confidence` | string | Confidence level: `high`, `medium`, or `low` |
| `estimatedAge.reasoning` | string | Explanation for the age estimate |
| `possibleUse` | string | Likely function or purpose |
| `culturalContext` | string | Historical and cultural significance |
| `similarArtifacts` | string[] | List of comparable known artifacts |
| `preservationNotes` | string | Recommendations for conservation |
| `aiConfidence` | number | Overall confidence score (0-1) |
| `disclaimer` | string | Standard AI-generated content disclaimer |

#### Notes

- The function uses Llama 3.2 90B Vision (llama-3.2-90b-vision-preview) for image analysis
- Providing metadata improves analysis accuracy significantly
- All responses include a disclaimer indicating AI-generated content
- The function implements retry logic with exponential backoff for rate limiting

---

### POST /api/colorize

Generates historically-accurate colorized versions of artifact images using DeOldify via HuggingFace Spaces.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "imageBase64": "string (required)",
  "colorScheme": "roman | greek | egyptian | mesopotamian | weathered | original | custom (required)",
  "customPrompt": "string (required if colorScheme is 'custom')"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageBase64` | string | Yes | Base64-encoded image (with or without data URL prefix) |
| `colorScheme` | string | Yes | Cultural color scheme preset or "custom" |
| `customPrompt` | string | Conditional | Required when colorScheme is "custom" |

**Color Schemes:**

| Scheme | Description | Colors |
|--------|-------------|--------|
| `roman` | Classical Roman palette | Deep crimson, Tyrian purple, gold, terracotta |
| `greek` | Ancient Greek palette | Terracotta, black-figure, red ochre, cerulean blue |
| `egyptian` | Ancient Egyptian palette | Lapis lazuli blue, gold, turquoise, emerald green |
| `mesopotamian` | Mesopotamian palette | Ultramarine blue, gold, brick red, earth tones |
| `weathered` | Aged appearance | Muted earth tones, faded pigments |
| `original` | Vibrant reconstruction | Original colors as artifact would have appeared when new |
| `custom` | User-defined | Based on customPrompt |

#### Response

**Success (200):**
```json
{
  "success": true,
  "colorizedImageBase64": "string (base64-encoded PNG)",
  "method": "deoldify-roman",
  "processingTimeMs": 15000,
  "retryCount": 0
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Missing colorScheme"
}
```

```json
{
  "success": false,
  "error": "customPrompt is required when colorScheme is \"custom\""
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "Unknown error during colorization",
  "processingTimeMs": 30000,
  "retryCount": 3
}
```

#### Example Request

```javascript
// Using a preset color scheme
const response = await fetch('/.netlify/functions/colorize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageBase64: 'data:image/jpeg;base64,/9j/4AAQ...',
    colorScheme: 'egyptian'
  })
});

// Using a custom color prompt
const response = await fetch('/.netlify/functions/colorize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageBase64: 'data:image/jpeg;base64,/9j/4AAQ...',
    colorScheme: 'custom',
    customPrompt: 'Medieval European colors with rich burgundy, deep forest green, and gold accents'
  })
});

const data = await response.json();
if (data.success) {
  // Display colorized image
  const imgSrc = `data:image/png;base64,${data.colorizedImageBase64}`;
}
```

#### Notes

- Uses DeOldify (akhaliq/deoldify on HuggingFace Spaces) for colorization
- Processing time is typically 10-30 seconds
- The function implements retry logic with exponential backoff
- Cultural presets use historically-researched color palettes

---

## Error Handling

All endpoints follow consistent error handling patterns:

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters or missing required fields |
| 405 | Method Not Allowed - Only POST is supported |
| 500 | Internal Server Error - Processing failed or external API error |

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing imageBase64` | Required image parameter not provided | Include imageBase64 in request body |
| `Invalid base64 image data` | Image data is corrupted or not valid base64 | Verify image encoding |
| `GROQ_API_KEY not configured` | Server environment variable missing | Configure GROQ_API_KEY in Netlify |
| `Rate limit exceeded` | Too many requests to external API | Wait and retry; function handles this automatically |
| `Method not allowed` | Using GET instead of POST | Use POST method |

---

## CORS Configuration

All endpoints include CORS headers for browser access:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: POST, OPTIONS
```

Preflight OPTIONS requests are handled automatically and return status 200.

---

## Rate Limiting

External APIs (HuggingFace Spaces, Groq) may impose rate limits:

- **HuggingFace Spaces**: Varies by space; may have queue times when spaces are busy
- **Groq**: Free tier has request limits; see [Groq documentation](https://console.groq.com/docs/rate-limits)

The Netlify Functions implement:
- Exponential backoff with jitter
- Up to 3 automatic retries for transient errors
- Automatic fallback between services where applicable

---

## Environment Variables

Required for the functions to work:

| Variable | Required | Used By |
|----------|----------|---------|
| `GROQ_API_KEY` | Yes | `/api/generate-info-card` |
| `HF_API_TOKEN` | No | All HuggingFace endpoints (higher rate limits) |

Configure these in Netlify's Environment Variables section under Site Settings.
