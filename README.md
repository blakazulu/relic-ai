# Archaeology Web App

A mobile-first web application for archaeological artifact documentation with AI-powered features.

## Features

### Save The Past
- **3D Reconstruction**: Generate 3D models from artifact photos using TRELLIS.2 or TripoSR
- **AI Info Cards**: Automatically generate artifact information cards with material identification, estimated age, cultural context, and preservation recommendations

### PastPalette
- **AI Colorization**: Generate multiple historically-accurate color reconstructions of artifacts
- **Cultural Presets**: Roman, Greek, Egyptian, Mesopotamian, and more color schemes

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Local Storage | IndexedDB (Dexie.js) |
| 3D Viewer | Three.js / @react-three/fiber |
| API Proxy | Netlify Functions |
| 3D APIs | TRELLIS.2 / TripoSR (HuggingFace) |
| LLM API | Groq (Llama 3.3 70B) |
| Colorization | DeOldify / SD+ControlNet |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Environment Variables

Create a `.env` file with the following (for Netlify Functions):

```
GROQ_API_KEY=your_groq_api_key
HF_API_TOKEN=your_huggingface_token (optional)
```

## Design Philosophy

- **Mobile-first**: Optimized for field use on mobile devices
- **Offline-first**: Core features work without internet, sync when available
- **No accounts required**: All data stored locally in IndexedDB
- **AI transparency**: All AI-generated content clearly marked as speculative

## License

MIT
