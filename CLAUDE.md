# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Relic AI is an archaeology artifact documentation PWA with two main features:
- **Save the Past**: 3D reconstruction from artifact photos using TRELLIS.2 or TripoSR
- **Past Palette**: AI colorization of artifacts using Google Gemini with historically accurate cultural palettes

## Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

For Netlify Functions local development:
```bash
netlify dev      # Runs both Vite and Netlify Functions locally
```

## Architecture

### Frontend Stack
- React 19 + TypeScript + Vite
- TailwindCSS v4 (uses `@tailwindcss/postcss`)
- React Router v7 for routing
- Zustand for state management
- TanStack Query for async data fetching
- Dexie.js for IndexedDB (offline-first storage)
- Three.js + React Three Fiber for 3D model viewing
- i18next for internationalization (English/Hebrew)

### Path Alias
`@/` maps to `src/` (configured in `vite.config.ts`)

### State Management
- `src/stores/appStore.ts` contains three Zustand stores:
  - `useAppStore` - Current artifact, processing status, online status
  - `useSettingsStore` - Persisted user preferences (theme, language, defaults)
  - `useCaptureStore` - Camera capture session state

### Database Schema (IndexedDB via Dexie)
Located in `src/lib/db/index.ts`:
- `artifacts` - Main artifact records with metadata
- `images` - Artifact photos with angle info
- `models` - 3D GLB models
- `infoCards` - AI-generated artifact analysis
- `colorVariants` - Colorized image versions

### Backend Functions (Netlify Functions)
Located in `netlify/functions/`:
- `reconstruct-3d.ts` - 3D reconstruction via HuggingFace Spaces (TRELLIS.2/TripoSR)
- `colorize.ts` - Image colorization via Google Gemini 2.5 Flash Image
- `generate-info-card.ts` - Artifact analysis via Google Gemini 2.0 Flash

API client wrapper in `src/lib/api/client.ts` handles all function calls.

### Route Structure
- `/` - Home page with section selection
- `/save/*` - Save the Past (3D reconstruction flow)
- `/palette/*` - Past Palette (colorization flow)
- `/settings` - App settings

### Key Types
Core types in `src/types/artifact.ts`:
- `Artifact` - Main entity with status, metadata, related IDs
- `ArtifactImage` - Photo with angle (front, back, left, right, etc.)
- `Model3D` - 3D model blob with format and source
- `InfoCard` - AI analysis with material, age, cultural context
- `ColorVariant` - Colorized version with scheme (roman, greek, egyptian, etc.)

## Environment Variables

Required for Netlify Functions:
- `GOOGLE_AI_API_KEY` - Google Gemini API key for colorization and info card generation

## Conventions

- Components use barrel exports via `index.ts` files
- Hooks are in `src/hooks/` with `use*` naming
- Feature components grouped by domain (camera, gallery, colorization, etc.)
- i18n translations in `src/i18n/locales/{en,he}.json`
