# Shopify Ad Video Engine

Generate 3 trend-smart story ads from a product URL - one click from concept to platform-ready videos.

## Features

- **One-Click Generation**: Paste a product URL and get 3 distinct video concepts
- **Trend-Aware Hooks**: AI-generated hooks using proven storytelling frameworks (POV, Question, Before-After)
- **Deterministic Seeds**: Iterate on hooks without re-rendering entire videos
- **Mock Mode**: Full frontend functionality with realistic job polling simulation
- **Credit-Based System**: Preview for free, generate finals with credits

## Tech Stack

- React 18 + TypeScript
- Vite
- React Router for navigation
- Zustand for state management
- Tailwind CSS for styling
- Lucide React for icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will run on http://localhost:5173

### Environment Variables

The `.env` file includes:

- `VITE_API_URL` - Backend API URL (default: http://localhost:8787)
- `VITE_APP_URL` - Frontend URL (default: http://localhost:5173)
- `VITE_USE_MOCK=1` - Enable mock mode for development

### Mock Mode

When `VITE_USE_MOCK=1` is set, the application:

- Simulates product ingestion with realistic data
- Generates 3 concept variants (A, B, C)
- Simulates job progression: queued → running → succeeded
- Returns mock video URLs for playback

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── TopNav.tsx      # Navigation bar with credits
│   ├── UrlForm.tsx     # Product URL input form
│   ├── ConceptTile.tsx # Video concept card
│   └── VideoPlayer.tsx # Full-screen video player
├── pages/              # Page components
│   ├── CreatePage.tsx  # Main creation workflow
│   ├── LibraryPage.tsx # Video library
│   ├── BillingPage.tsx # Pricing and credits
│   └── DocsPage.tsx    # Documentation
├── lib/
│   └── api.ts          # API client with mock support
├── store/
│   └── useStore.ts     # Zustand state management
├── types/
│   └── api.ts          # TypeScript type definitions
└── App.tsx             # Root component with routing
```

## How It Works

1. **Ingest**: Paste a product URL → extracts title, bullets, images, reviews
2. **Plan**: AI generates 3 distinct concepts with hooks, seeds, and 4-beat structures
3. **Preview**: Free 8-10s preview renders for all 3 concepts
4. **Finals**: Generate 20-24s vertical videos (9:16) with VO, captions, and branding

## Pages

- **/** - Create 3 Videos (main workflow)
- **/library** - Video library (coming soon)
- **/billing** - Pricing and credit packages
- **/docs** - How it works documentation

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript checks
- `npm run lint` - Lint code

## Design

The UI follows a dark, modern aesthetic inspired by the reference designs:

- Dark slate background (#0f172a)
- Blue accent color for CTAs
- Gradient concept cards (cyan, orange, green)
- 9:16 video aspect ratio
- Smooth transitions and hover states

## Credits System

- **0 credits**: Free preview generation
- **3 credits**: Generate 3 final HD videos
- Credits never expire

## Next Steps

To connect to a real backend:

1. Set `VITE_USE_MOCK=0` in `.env`
2. Configure `VITE_API_URL` to point to your backend
3. Ensure backend implements the API contracts defined in `src/types/api.ts`
