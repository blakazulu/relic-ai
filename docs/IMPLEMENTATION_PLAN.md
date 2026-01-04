# Archaeology Web App - Implementation Plan

## Project Overview

A mobile-first web application for archaeological artifact documentation with two main features:
1. **Save The Past** - 3D reconstruction + AI-generated artifact info cards
2. **PastPalette** - Multiple color reconstructions of artifacts

---

## IMPORTANT: Development Workflow

### Bug Hunting After Each Step

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MANDATORY: After completing each task/step:                           │
│                                                                         │
│  1. Complete the task (create/modify code)                             │
│  2. Run bug hunter agent on changed/created files                      │
│  3. Fix any bugs found before moving to next task                      │
│  4. Mark task as complete only after bug-free                          │
│                                                                         │
│  Bug Hunter Checklist:                                                  │
│  ✓ TypeScript errors                                                   │
│  ✓ Logic errors                                                        │
│  ✓ Security vulnerabilities                                            │
│  ✓ Edge cases not handled                                              │
│  ✓ Missing error handling                                              │
│  ✓ Performance issues                                                  │
│  ✓ Accessibility issues                                                │
│  ✓ Mobile responsiveness issues                                        │
│  ✓ Design guideline violations (NO PURPLE!)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Workflow Per Task

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Implement  │───▶│  Run Bug     │───▶│  Fix Bugs    │───▶│   Mark       │
│   Task       │    │  Hunter      │    │  Found       │    │   Complete   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    Review for:
                    - Type safety
                    - Error handling
                    - Security
                    - Performance
                    - Design compliance
```

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 18+ | With TypeScript |
| **UI Library** | Tailwind CSS + shadcn/ui | Mobile-first, accessible |
| **3D Viewer** | Three.js + @react-three/fiber | Or `<model-viewer>` for simplicity |
| **State Management** | Zustand | Lightweight, simple |
| **Storage** | IndexedDB (via Dexie.js) | Local-first, offline support |
| **API Proxy** | Netlify Functions | Secure API key handling |
| **Hosting** | Netlify | Your account |
| **3D APIs** | TRELLIS.2 / TripoSR | Via HuggingFace Gradio client |
| **LLM API** | Groq (Llama 3.3 70B) | Free tier |
| **Colorization** | DeOldify + SD ControlNet | Via HuggingFace Spaces |

---

## Design Guidelines

### IMPORTANT: Design Restrictions

- **NEVER use purple or purple gradients** - This is strictly forbidden
- **NEVER use generic tech/AI aesthetics** - No neon colors, no futuristic looks
- **Design must be archaeology-appropriate** - Earthy, professional, historical feel

### Color Palette

```
PRIMARY COLORS (Earth Tones):
┌─────────────────────────────────────────────────────────────┐
│  Terracotta      #C65D3B   - Primary actions, buttons      │
│  Sienna Brown    #8B4513   - Headers, emphasis             │
│  Desert Sand     #D4A574   - Secondary elements            │
│  Clay            #B7723A   - Hover states                  │
└─────────────────────────────────────────────────────────────┘

NEUTRAL COLORS:
┌─────────────────────────────────────────────────────────────┐
│  Parchment       #FDF5E6   - Light background              │
│  Aged Paper      #F5E6D3   - Cards, surfaces               │
│  Stone Gray      #6B6B6B   - Secondary text                │
│  Charcoal        #2D2D2D   - Primary text                  │
│  Bone White      #FFFEF9   - Pure backgrounds              │
└─────────────────────────────────────────────────────────────┘

ACCENT COLORS:
┌─────────────────────────────────────────────────────────────┐
│  Oxidized Bronze #4A7C59   - Success states                │
│  Desert Teal     #3D8B8B   - Links, interactive            │
│  Rust Red        #A63D2F   - Errors, warnings              │
│  Gold Ochre      #C9A227   - Highlights, badges            │
└─────────────────────────────────────────────────────────────┘

FORBIDDEN COLORS:
┌─────────────────────────────────────────────────────────────┐
│  ❌ Purple (any shade)     - #800080, #9B59B6, etc.        │
│  ❌ Violet                 - #EE82EE, #8B00FF, etc.        │
│  ❌ Magenta                - #FF00FF, #C71585, etc.        │
│  ❌ Purple gradients       - Any gradient containing above │
│  ❌ Neon colors            - #00FF00, #FF00FF, #00FFFF     │
└─────────────────────────────────────────────────────────────┘
```

### Typography

```
FONTS:
┌─────────────────────────────────────────────────────────────┐
│  Headings:    "Playfair Display" or "Libre Baskerville"    │
│               - Serif, classical, scholarly feel            │
│                                                             │
│  Body Text:   "Source Sans 3" or "Inter"                   │
│               - Clean, readable sans-serif                  │
│                                                             │
│  Monospace:   "JetBrains Mono" or "Fira Code"              │
│               - For data, coordinates, IDs                  │
└─────────────────────────────────────────────────────────────┘

FONT WEIGHTS:
- Headings: 600-700 (semibold to bold)
- Body: 400-500 (regular to medium)
- Captions: 400 (regular)
```

### Visual Style

```
BACKGROUNDS:
┌─────────────────────────────────────────────────────────────┐
│  ✓ Subtle paper textures                                   │
│  ✓ Soft earthy gradients (sand to cream)                   │
│  ✓ Clean solid colors from palette                         │
│  ✗ NO purple gradients                                     │
│  ✗ NO dark futuristic backgrounds                          │
│  ✗ NO neon glow effects                                    │
└─────────────────────────────────────────────────────────────┘

BORDERS & SHADOWS:
┌─────────────────────────────────────────────────────────────┐
│  Border radius: 8-12px (soft, not too rounded)             │
│  Shadows: Warm-toned, subtle (rgba(139,69,19,0.1))         │
│  Borders: 1px solid with muted earth tones                 │
└─────────────────────────────────────────────────────────────┘

ICONS:
┌─────────────────────────────────────────────────────────────┐
│  Style: Outlined or subtle filled                          │
│  Source: Lucide icons (already included)                   │
│  Color: Match text color or accent palette                 │
└─────────────────────────────────────────────────────────────┘
```

### Component Styling Examples

```css
/* Primary Button */
.btn-primary {
  background: #C65D3B;        /* Terracotta */
  color: #FFFEF9;             /* Bone White */
  border-radius: 8px;
  font-weight: 500;
}
.btn-primary:hover {
  background: #B7723A;        /* Clay */
}

/* Card */
.card {
  background: #F5E6D3;        /* Aged Paper */
  border: 1px solid #D4A574;  /* Desert Sand */
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(139,69,19,0.08);
}

/* Navigation */
.nav {
  background: #8B4513;        /* Sienna Brown */
  color: #FDF5E6;             /* Parchment */
}
```

### Dark Mode (Optional)

```
If implementing dark mode:
┌─────────────────────────────────────────────────────────────┐
│  Background:   #1A1612     (warm dark brown, not gray)     │
│  Surface:      #2D2520     (elevated surfaces)             │
│  Text:         #F5E6D3     (aged paper color)              │
│  Accents:      Same as light mode, slightly desaturated    │
│  ❌ Still NO purple                                        │
└─────────────────────────────────────────────────────────────┘
```

### Design Mood

The app should feel like:
- A **field archaeologist's digital notebook**
- **Professional but approachable** - used by experts and students
- **Warm and grounded** - connected to earth and history
- **Clean and functional** - not cluttered or decorative
- **Timeless** - not trendy or dated

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MOBILE BROWSER                                  │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     REACT APP (PWA)                                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │ │
│  │  │ Camera      │  │ 3D Viewer   │  │ Artifact Gallery        │   │ │
│  │  │ Capture     │  │ (Three.js)  │  │ (Cards + Info)          │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │ │
│  │                           │                                       │ │
│  │  ┌────────────────────────┴────────────────────────────────────┐ │ │
│  │  │                    ZUSTAND STORE                             │ │ │
│  │  │  - artifacts[]  - processingStatus  - settings              │ │ │
│  │  └────────────────────────┬────────────────────────────────────┘ │ │
│  │                           │                                       │ │
│  │  ┌────────────────────────┴────────────────────────────────────┐ │ │
│  │  │                  DEXIE.JS (IndexedDB)                        │ │ │
│  │  │  - images  - 3d_models  - artifact_metadata                 │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       NETLIFY FUNCTIONS                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ /api/3d-recon   │  │ /api/generate   │  │ /api/colorize           │ │
│  │                 │  │ -info-card      │  │                         │ │
│  │ Calls TRELLIS.2 │  │ Calls Groq API  │  │ Calls DeOldify Space    │ │
│  │ or TripoSR      │  │                 │  │ or SD+ControlNet        │ │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬────────────┘ │
└───────────┼─────────────────────┼───────────────────────┼──────────────┘
            │                     │                       │
            ▼                     ▼                       ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────────┐
│ HuggingFace Space │  │ Groq API          │  │ HuggingFace Spaces        │
│ TRELLIS.2/TripoSR │  │ Llama 3.3 70B     │  │ DeOldify / SD+ControlNet  │
└───────────────────┘  └───────────────────┘  └───────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Project Setup & Core Infrastructure
### Phase 2: Save The Past - Camera & Image Capture
### Phase 3: Save The Past - 3D Reconstruction
### Phase 4: Save The Past - Info Card Generation
### Phase 5: Save The Past - Gallery & Storage
### Phase 6: PastPalette - Colorization Feature
### Phase 7: Polish, PWA & Deployment

---

# PHASE 1: Project Setup & Core Infrastructure

**Estimated Duration**: 2-3 days

## 1.1 Initialize React Project

- [x] **1.1.1** Create new Vite + React + TypeScript project
  ```bash
  npm create vite@latest archaeology-app -- --template react-ts
  cd archaeology-app
  npm install
  ```

- [x] **1.1.2** Install core dependencies
  ```bash
  # UI & Styling
  npm install tailwindcss postcss autoprefixer
  npm install class-variance-authority clsx tailwind-merge
  npm install lucide-react

  # State & Storage
  npm install zustand
  npm install dexie dexie-react-hooks

  # 3D Viewer
  npm install three @react-three/fiber @react-three/drei
  # OR simpler: npm install @google/model-viewer

  # Utilities
  npm install @tanstack/react-query
  npm install react-router-dom
  ```

- [x] **1.1.3** Configure Tailwind CSS (using Tailwind v4 with CSS-based config)
  - Created `index.css` with `@theme` directive for mobile-first breakpoints
  - Added custom colors for archaeology theme
  - Configured dark mode support

- [x] **1.1.4** Install shadcn/ui components (skipped - using custom components with Tailwind v4)
  - Created custom UI components: ErrorBoundary, LoadingSpinner
  - Using Lucide icons for consistent iconography

- [x] **1.1.5** Configure design tokens in Tailwind
  ```javascript
  // tailwind.config.js - Archaeology theme colors
  colors: {
    // PRIMARY (Earth Tones)
    terracotta: '#C65D3B',
    sienna: '#8B4513',
    'desert-sand': '#D4A574',
    clay: '#B7723A',
    // NEUTRALS
    parchment: '#FDF5E6',
    'aged-paper': '#F5E6D3',
    'stone-gray': '#6B6B6B',
    charcoal: '#2D2D2D',
    'bone-white': '#FFFEF9',
    // ACCENTS
    'oxidized-bronze': '#4A7C59',
    'desert-teal': '#3D8B8B',
    'rust-red': '#A63D2F',
    'gold-ochre': '#C9A227',
  }
  ```

- [x] **1.1.6** Set up Google Fonts
  - Added Playfair Display (headings)
  - Added Source Sans 3 (body)
  - Configured in CSS with --font-heading and --font-sans

- [x] **1.1.7** Override shadcn/ui theme colors
  - Updated CSS variables to use archaeology palette
  - Removed all purple from theme - NO PURPLE anywhere
  - Tested build with new colors

## 1.2 Project Structure

- [x] **1.2.1** Create folder structure
  ```
  src/
  ├── components/
  │   ├── ui/              # shadcn/ui components
  │   ├── camera/          # Camera capture components
  │   ├── viewer/          # 3D model viewer
  │   ├── gallery/         # Artifact gallery
  │   ├── info-card/       # Artifact info cards
  │   └── layout/          # App shell, navigation
  ├── hooks/               # Custom React hooks
  ├── lib/
  │   ├── api/             # API client functions
  │   ├── db/              # Dexie database setup
  │   └── utils/           # Utility functions
  ├── stores/              # Zustand stores
  ├── types/               # TypeScript types
  └── pages/               # Route pages
  ```

- [x] **1.2.2** Create TypeScript types
  ```typescript
  // src/types/artifact.ts
  interface Artifact {
    id: string;
    createdAt: Date;
    images: ArtifactImage[];
    model3D?: Model3D;
    infoCard?: InfoCard;
    colorVariants?: ColorVariant[];
    metadata: ArtifactMetadata;
  }
  ```

## 1.3 Database Setup (Dexie.js)

- [x] **1.3.1** Create database schema
  ```typescript
  // src/lib/db/index.ts
  import Dexie from 'dexie';

  class ArchaeologyDB extends Dexie {
    artifacts!: Table<Artifact>;
    images!: Table<StoredImage>;
    models!: Table<StoredModel>;
  }
  ```

- [x] **1.3.2** Implement CRUD operations for artifacts
- [x] **1.3.3** Add image blob storage helpers
- [x] **1.3.4** Add 3D model storage helpers

## 1.4 State Management (Zustand)

- [x] **1.4.1** Create main app store
  ```typescript
  // src/stores/appStore.ts
  interface AppState {
    currentArtifact: Artifact | null;
    processingStatus: ProcessingStatus;
    setCurrentArtifact: (artifact: Artifact) => void;
    // ...
  }
  ```

- [x] **1.4.2** Create processing status store (for async operations)
- [x] **1.4.3** Create settings store (preferences, API configs)

## 1.5 Netlify Functions Setup

- [x] **1.5.1** Create `netlify/functions/` directory
- [x] **1.5.2** Create base function template with error handling
- [x] **1.5.3** Set up environment variables in Netlify dashboard
  - `GROQ_API_KEY`
  - `HF_API_TOKEN` (optional, for higher rate limits)

- [x] **1.5.4** Create API client for frontend
  ```typescript
  // src/lib/api/client.ts
  export async function callNetlifyFunction(
    functionName: string,
    payload: unknown
  ): Promise<unknown>
  ```

## 1.6 App Shell & Navigation

- [x] **1.6.1** Create mobile-first layout component
  - Bottom navigation bar (mobile)
  - Header with page titles

- [x] **1.6.2** Create pages structure
  - Home/Dashboard
  - Capture (camera)
  - Gallery
  - Artifact Detail
  - Settings

- [x] **1.6.3** Set up React Router
- [x] **1.6.4** Create loading states and error boundaries

---

# PHASE 2: Save The Past - Camera & Image Capture ✅ COMPLETED

**Estimated Duration**: 3-4 days

## 2.1 Camera Access

- [x] **2.1.1** Create `useCamera` hook
  ```typescript
  // src/hooks/useCamera.ts
  export function useCamera() {
    // Request camera permissions
    // Get video stream
    // Handle multiple cameras (front/back)
    // Return stream, status, error
  }
  ```

- [x] **2.1.2** Handle camera permissions gracefully
  - Show permission request UI
  - Handle denied permissions
  - Fallback to file upload

- [x] **2.1.3** Implement camera switching (front/back)

## 2.2 Camera Capture Component

- [x] **2.2.1** Create `CameraView` component
  - Full-screen camera preview
  - Capture button
  - Flash toggle (if supported)
  - Camera switch button

- [x] **2.2.2** Create capture overlay with guides
  - Grid overlay for artifact centering
  - Tips for good capture angles
  - Progress indicator for multi-shot

- [x] **2.2.3** Implement image capture
  - Capture frame from video stream
  - Convert to blob/base64
  - Store in temporary state

## 2.3 Multi-Image Capture Flow

- [x] **2.3.1** Create multi-capture mode
  - Prompt user for multiple angles
  - Show which angles captured (front, back, sides, top)
  - Visual guide for each angle

- [x] **2.3.2** Create capture preview carousel
  - Show captured images
  - Allow delete/retake
  - Confirm when done

- [x] **2.3.3** Implement capture session management
  - Track capture progress
  - Save partial captures
  - Resume interrupted captures

## 2.4 File Upload Fallback

- [x] **2.4.1** Create file upload component
  - Drag & drop zone
  - File picker button
  - Support multiple files

- [x] **2.4.2** Validate uploaded images
  - Check file type (JPEG, PNG, WebP)
  - Check minimum resolution
  - Show error messages

- [x] **2.4.3** Preview uploaded images before processing

## 2.5 Image Processing

- [x] **2.5.1** Create image compression utility
  - Resize large images for API upload
  - Maintain aspect ratio
  - Target size: ~1-2MB max

- [x] **2.5.2** Create image rotation/crop tool (optional)
  - Basic rotate controls
  - Simple crop to artifact

---

# PHASE 3: Save The Past - 3D Reconstruction ✅ COMPLETED

**Estimated Duration**: 4-5 days

## 3.1 Netlify Function: 3D Reconstruction

- [x] **3.1.1** Create `/api/reconstruct-3d` function
  - Created `netlify/functions/reconstruct-3d.ts`
  - Uses @gradio/client for HuggingFace Spaces integration
  - Accepts base64 image, method (trellis/triposr), and removeBackground option

- [x] **3.1.2** Implement TRELLIS.2 integration
  - Primary method for both single and multi-image reconstruction
  - Connected to `microsoft/TRELLIS.2` HuggingFace Space
  - Handles image preprocessing and GLB extraction

- [x] **3.1.3** Implement TripoSR integration (backup)
  - Fallback when TRELLIS.2 is unavailable
  - Connected to `stabilityai/TripoSR` HuggingFace Space
  - Automatic fallback with exponential backoff

- [x] **3.1.4** Handle API errors and retries
  - Exponential backoff with jitter (3 retries)
  - Rate limiting detection and handling
  - Automatic fallback between TRELLIS.2 and TripoSR
  - Comprehensive error types and messages

- [x] **3.1.5** Return 3D model in GLB format
  - Base64 encoded GLB in response
  - Includes format and mesh count metadata
  - Proper CORS headers for browser compatibility

## 3.2 Multi-Image 3D (OpenScanCloud)

> **Note**: OpenScanCloud integration was skipped. TRELLIS.2 is used for both single and multi-image reconstruction as it provides better results and simpler integration.

- [~] **3.2.1** Research OpenScanCloud API - Skipped (using TRELLIS.2 instead)
- [~] **3.2.2** Implement multi-image upload - Skipped (using TRELLIS.2 instead)
- [~] **3.2.3** Handle long-running jobs - Skipped (using TRELLIS.2 instead)

## 3.3 Frontend: 3D Reconstruction Flow

- [x] **3.3.1** Create `useReconstruct3D` hook
  - Created `src/hooks/useReconstruct3D.ts`
  - Full state management: idle, uploading, processing, complete, error
  - Progress tracking with percentage and messages
  - Cancel support with AbortController
  - IndexedDB integration for model storage
  - Zustand store integration for global processing status

- [x] **3.3.2** Create reconstruction progress UI
  - Created `src/components/reconstruction/ReconstructionProgress.tsx`
  - Animated progress bar with archaeology theme
  - Status messages for each phase
  - Cancel button for in-progress reconstructions
  - Error display with retry option

- [x] **3.3.3** Create method selection UI
  - Created `src/components/reconstruction/MethodSelector.tsx`
  - Single image (TripoSR - fast) vs Multi-image (TRELLIS.2 - detailed)
  - Visual cards with icons and descriptions
  - Trade-offs clearly explained

## 3.4 3D Model Viewer

- [x] **3.4.1** Create `ModelViewer` component
  - Created `src/components/viewer/ModelViewer.tsx`
  - Uses Three.js with @react-three/fiber and @react-three/drei
  - GLB/GLTF model loading with useGLTF
  - Center and Environment components for proper display

- [x] **3.4.2** Implement viewer controls
  - OrbitControls for rotate/zoom/pan
  - Touch and mouse support
  - Reset view button with camera position restore
  - Configurable min/max zoom distance

- [x] **3.4.3** Add viewer features
  - Fullscreen mode with ESC hint
  - Screenshot capture with auto-download
  - Lighting presets: Ambient, Museum, Outdoor
  - Lighting preset selector popup

- [x] **3.4.4** Create model loading states
  - LoadingOverlay with spinner during model load
  - ErrorDisplay with retry button
  - Graceful error handling with useGLTF error callback

## 3.5 3D Model Storage

- [x] **3.5.1** Store 3D model in IndexedDB
  - Model stored as Blob via Dexie.js
  - Linked to artifact via artifactId
  - Includes metadata: format, source, fileSize, createdAt
  - Handles large files via IndexedDB blob storage

- [x] **3.5.2** Implement model caching
  - Check for existing model via artifact.model3DId
  - Load from IndexedDB instead of regenerating
  - useGLTF.clear() for cache invalidation on retry

---

# PHASE 4: Save The Past - Info Card Generation ✅ COMPLETED

**Estimated Duration**: 3-4 days

## 4.1 Netlify Function: Info Card Generation

- [x] **4.1.1** Create `/api/generate-info-card` function
  ```javascript
  import Groq from 'groq-sdk';

  export async function handler(event) {
    const { imageBase64, userMetadata } = JSON.parse(event.body);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: ARCHAEOLOGY_PROMPT
        },
        {
          role: "user",
          content: [
            { type: "text", text: formatUserInput(userMetadata) },
            { type: "image_url", url: `data:image/jpeg;base64,${imageBase64}` }
          ]
        }
      ]
    });

    return parseInfoCard(response);
  }
  ```

- [x] **4.1.2** Create archaeology-specific system prompt
  ```
  You are an archaeological artifact analyst. Given an image and context,
  generate a structured information card with:
  - Material identification
  - Estimated age/period
  - Possible function/use
  - Cultural significance
  - Similar known artifacts
  - Preservation recommendations

  Be factual, note uncertainties, cite reasoning.
  ```

- [x] **4.1.3** Parse LLM response into structured format
  ```typescript
  interface InfoCard {
    material: string;
    estimatedAge: { range: string; confidence: string };
    possibleUse: string;
    culturalContext: string;
    similarArtifacts: string[];
    preservationNotes: string;
    aiConfidence: number;
    disclaimer: string;
  }
  ```

- [x] **4.1.4** Handle API errors and rate limits

## 4.2 User Metadata Input

- [x] **4.2.1** Create metadata input form
  - Discovery location (text or GPS)
  - Excavation layer/depth
  - Site name
  - Date found
  - Initial observations
  - Photos of context (optional)

- [x] **4.2.2** Implement GPS capture
  - Request location permission
  - Capture coordinates
  - Show on mini-map

- [x] **4.2.3** Create field templates
  - Quick presets for common scenarios
  - Recently used values

## 4.3 Info Card Display

- [x] **4.3.1** Create `InfoCard` component
  - Structured display of all fields
  - AI confidence indicator
  - "Speculative" badges
  - Collapsible sections

- [x] **4.3.2** Add AI disclaimer
  ```
  "This analysis was generated by AI and should be verified
  by qualified archaeologists. All estimates are speculative."
  ```

- [x] **4.3.3** Create info card editing
  - Allow manual corrections
  - Track human edits vs AI content
  - Regenerate option

## 4.4 Info Card Export

- [x] **4.4.1** Export as PDF
  - Formatted artifact report
  - Include images and 3D screenshot
  - Include metadata

- [x] **4.4.2** Export as JSON
  - Structured data for databases
  - Include all fields

- [x] **4.4.3** Share functionality
  - Copy link (future)
  - Email report

---

# PHASE 5: Save The Past - Gallery & Storage

**Estimated Duration**: 2-3 days

## 5.1 Artifact Gallery

- [ ] **5.1.1** Create gallery grid view
  - Responsive grid (1 col mobile, 2-3 cols tablet+)
  - Thumbnail images
  - Quick info overlay

- [ ] **5.1.2** Create gallery list view
  - Compact list format
  - More details visible
  - Toggle between views

- [ ] **5.1.3** Implement sorting & filtering
  - Sort by date, name
  - Filter by status (complete, processing, incomplete)
  - Search by metadata

## 5.2 Artifact Detail Page

- [ ] **5.2.1** Create artifact detail layout
  - 3D viewer (main)
  - Image gallery
  - Info card
  - Actions menu

- [ ] **5.2.2** Create tabbed interface
  - Tab 1: 3D Model
  - Tab 2: Photos
  - Tab 3: Info Card
  - Tab 4: Color Variants (Phase 6)

- [ ] **5.2.3** Implement edit mode
  - Edit metadata
  - Add/remove photos
  - Regenerate 3D/info

## 5.3 Data Management

- [ ] **5.3.1** Implement artifact deletion
  - Confirm dialog
  - Delete all related data (images, models)
  - Undo option (soft delete)

- [ ] **5.3.2** Implement data export
  - Export all artifacts as JSON
  - Export specific artifact
  - Include all media

- [ ] **5.3.3** Implement data import
  - Import from JSON backup
  - Validate data format
  - Handle duplicates

## 5.4 Offline Support

- [ ] **5.4.1** Implement offline detection
  - Show offline indicator
  - Queue operations for sync

- [ ] **5.4.2** Queue failed API calls
  - Store pending operations
  - Retry when online
  - Show sync status

---

# PHASE 6: PastPalette - Colorization Feature

**Estimated Duration**: 4-5 days

## 6.1 Netlify Function: Colorization

- [ ] **6.1.1** Create `/api/colorize` function
  ```javascript
  import { Client } from "@gradio/client";

  export async function handler(event) {
    const { imageBase64, colorScheme } = JSON.parse(event.body);

    // DeOldify for base colorization
    // or SD+ControlNet for cultural variants
  }
  ```

- [ ] **6.1.2** Implement DeOldify integration
  - Find working HuggingFace Space
  - Test API parameters
  - Handle response format

- [ ] **6.1.3** Implement SD+ControlNet for variants
  - Use cultural period prompts
  - Preserve artifact structure (ControlNet Canny)
  - Generate multiple options

- [ ] **6.1.4** Create color scheme presets
  ```typescript
  const COLOR_PRESETS = {
    roman: "Ancient Roman pigments, red ochre, Egyptian blue, gold leaf",
    greek: "Greek classical, white marble, bronze patina, terracotta",
    egyptian: "Egyptian blue, turquoise, gold, black kohl",
    mesopotamian: "Lapis lazuli blue, gold, carnelian red",
    weathered: "Natural earth tones, aged patina, faded colors",
    original: "Vibrant original colors, fresh paint, bright pigments"
  };
  ```

## 6.2 Colorization UI

- [ ] **6.2.1** Create colorization trigger
  - Button on artifact detail page
  - "Generate Color Variants" action

- [ ] **6.2.2** Create preset selection
  - Show available color schemes
  - Preview examples
  - Custom prompt option

- [ ] **6.2.3** Create generation progress UI
  - Show each variant generating
  - Cancel option
  - Error handling

## 6.3 Color Variant Display

- [ ] **6.3.1** Create variant gallery
  - Grid of colorized versions
  - Label with scheme name
  - Full-screen view

- [ ] **6.3.2** Create comparison slider
  - Before/after slider
  - Compare two variants
  - Original vs colorized

- [ ] **6.3.3** Create variant details
  - Show prompt used
  - AI confidence
  - Historical context

## 6.4 Variant Storage

- [ ] **6.4.1** Store color variants in IndexedDB
  - Link to parent artifact
  - Store preset used
  - Store generated image

- [ ] **6.4.2** Implement variant management
  - Delete variants
  - Regenerate specific variant
  - Set "favorite" variant

## 6.5 Export & Share

- [ ] **6.5.1** Export colorized images
  - Download individual variants
  - Download all as ZIP

- [ ] **6.5.2** Create comparison export
  - Side-by-side image
  - PDF report with all variants

---

# PHASE 7: Polish, PWA & Deployment

**Estimated Duration**: 3-4 days

## 7.1 PWA Setup

- [ ] **7.1.1** Create manifest.json
  ```json
  {
    "name": "Save The Past",
    "short_name": "SavePast",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#8B4513",
    "background_color": "#FDF5E6"
  }
  ```

- [ ] **7.1.2** Create service worker
  - Cache static assets
  - Cache API responses
  - Offline fallback page

- [ ] **7.1.3** Add install prompt
  - Detect installability
  - Show install button
  - Track installs

## 7.2 Performance Optimization

- [ ] **7.2.1** Implement lazy loading
  - Lazy load routes
  - Lazy load images
  - Lazy load 3D viewer

- [ ] **7.2.2** Optimize bundle size
  - Analyze with bundlephobia
  - Tree-shake unused code
  - Split chunks

- [ ] **7.2.3** Optimize images
  - Use WebP format
  - Responsive images
  - Lazy load below fold

## 7.3 Mobile UX Polish

- [ ] **7.3.1** Test on real devices
  - iOS Safari
  - Android Chrome
  - Various screen sizes

- [ ] **7.3.2** Add haptic feedback
  - Capture button
  - Success/error states

- [ ] **7.3.3** Improve touch targets
  - Minimum 44x44px
  - Adequate spacing
  - Swipe gestures

## 7.4 Error Handling & Edge Cases

- [ ] **7.4.1** Create global error boundary
- [ ] **7.4.2** Handle API failures gracefully
- [ ] **7.4.3** Handle low storage
- [ ] **7.4.4** Handle slow connections

## 7.5 Analytics & Monitoring (Optional)

- [ ] **7.5.1** Add privacy-friendly analytics
  - Plausible or Umami
  - Track key flows

- [ ] **7.5.2** Add error tracking
  - Sentry or similar
  - Track API failures

## 7.6 Deployment

- [ ] **7.6.1** Configure Netlify
  - Build settings
  - Environment variables
  - Deploy hooks

- [ ] **7.6.2** Set up custom domain (optional)
- [ ] **7.6.3** Configure caching headers
- [ ] **7.6.4** Test production build

## 7.7 Documentation

- [ ] **7.7.1** Create README.md
  - Project overview
  - Setup instructions
  - Environment variables

- [ ] **7.7.2** Document API functions
- [ ] **7.7.3** Create user guide (optional)

---

# Task Checklist Summary

## Phase 1: Setup (2-3 days) ✅ COMPLETED
- [x] 1.1.1 - 1.1.7: Initialize project + design setup (7 tasks)
- [x] 1.2.1 - 1.2.2: Project structure (2 tasks)
- [x] 1.3.1 - 1.3.4: Database setup (4 tasks)
- [x] 1.4.1 - 1.4.3: State management (3 tasks)
- [x] 1.5.1 - 1.5.4: Netlify Functions (4 tasks)
- [x] 1.6.1 - 1.6.4: App shell (4 tasks)
**Total: 24 tasks** ✅

## Phase 2: Camera (3-4 days) ✅ COMPLETED
- [x] 2.1.1 - 2.1.3: Camera access (3 tasks)
- [x] 2.2.1 - 2.2.3: Camera component (3 tasks)
- [x] 2.3.1 - 2.3.3: Multi-capture (3 tasks)
- [x] 2.4.1 - 2.4.3: File upload (3 tasks)
- [x] 2.5.1 - 2.5.2: Image processing (2 tasks)
**Total: 14 tasks** ✅

## Phase 3: 3D Reconstruction (4-5 days) ✅ COMPLETED
- [x] 3.1.1 - 3.1.5: Netlify function (5 tasks) ✅
- [~] 3.2.1 - 3.2.3: Multi-image OpenScanCloud (3 tasks) - Skipped, using TRELLIS.2 instead
- [x] 3.3.1 - 3.3.3: Frontend flow (3 tasks) ✅
- [x] 3.4.1 - 3.4.4: 3D viewer (4 tasks) ✅
- [x] 3.5.1 - 3.5.2: Model storage (2 tasks) ✅
**Total: 14 tasks completed**

## Phase 4: Info Cards (3-4 days) ✅ COMPLETED
- [x] 4.1.1 - 4.1.4: Netlify function (4 tasks) ✅
- [x] 4.2.1 - 4.2.3: Metadata input (3 tasks) ✅
- [x] 4.3.1 - 4.3.3: Info card display (3 tasks) ✅
- [x] 4.4.1 - 4.4.3: Export (3 tasks) ✅
**Total: 13 tasks completed**

## Phase 5: Gallery (2-3 days)
- [ ] 5.1.1 - 5.1.3: Gallery views (3 tasks)
- [ ] 5.2.1 - 5.2.3: Detail page (3 tasks)
- [ ] 5.3.1 - 5.3.3: Data management (3 tasks)
- [ ] 5.4.1 - 5.4.2: Offline support (2 tasks)
**Total: 11 tasks**

## Phase 6: PastPalette (4-5 days)
- [ ] 6.1.1 - 6.1.4: Netlify function (4 tasks)
- [ ] 6.2.1 - 6.2.3: Colorization UI (3 tasks)
- [ ] 6.3.1 - 6.3.3: Variant display (3 tasks)
- [ ] 6.4.1 - 6.4.2: Variant storage (2 tasks)
- [ ] 6.5.1 - 6.5.2: Export (2 tasks)
**Total: 14 tasks**

## Phase 7: Polish (3-4 days)
- [ ] 7.1.1 - 7.1.3: PWA setup (3 tasks)
- [ ] 7.2.1 - 7.2.3: Performance (3 tasks)
- [ ] 7.3.1 - 7.3.3: Mobile polish (3 tasks)
- [ ] 7.4.1 - 7.4.4: Error handling (4 tasks)
- [ ] 7.5.1 - 7.5.2: Analytics (2 tasks)
- [ ] 7.6.1 - 7.6.4: Deployment (4 tasks)
- [ ] 7.7.1 - 7.7.3: Documentation (3 tasks)
**Total: 22 tasks**

---

# Grand Total: 116 Tasks

**Estimated Timeline:**
- Phase 1-5 (Save The Past MVP): ~14-19 days
- Phase 6 (PastPalette): ~4-5 days
- Phase 7 (Polish): ~3-4 days
- **Total: ~21-28 days**

---

# API Keys Required

| Service | Where to Get | Environment Variable |
|---------|--------------|---------------------|
| Groq | https://console.groq.com | `GROQ_API_KEY` |
| HuggingFace (optional) | https://huggingface.co/settings/tokens | `HF_API_TOKEN` |

---

# Notes

1. **Bug Hunt After Every Step**: Run bug hunter agent after each task, fix issues before proceeding
2. **Mobile-first**: All designs start from 320px width and scale up
3. **Offline-first**: Core features work without internet, sync when available
4. **AI Disclaimers**: All AI-generated content clearly marked as speculative
5. **No accounts**: All data stored locally in IndexedDB
6. **Progressive Enhancement**: Basic features work everywhere, advanced features enhance
7. **No Purple**: Design must use archaeology color palette only - NO purple/violet/magenta

---

*Plan created: January 2026*
*Stack: React + Tailwind + Three.js + Netlify + HuggingFace + Groq*
