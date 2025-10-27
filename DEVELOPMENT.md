# Development Guide

## Local Development Setup

This project consists of two servers that need to run simultaneously:

1. **Frontend (Vite)** - Runs on `http://localhost:5173`
2. **Backend API (Express)** - Runs on `http://localhost:8787`

### Quick Start

#### Option 1: Run Both Servers (Recommended)

```bash
npm run dev:full
```

This command starts both the frontend and backend API servers concurrently. This is the recommended way to develop locally as it provides full functionality.

#### Option 2: Run Servers Separately

**Terminal 1 - Backend API:**
```bash
npm run dev:api
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

#### Option 3: Frontend Only

```bash
npm run dev
```

**Note:** This only starts the frontend Vite server. API-dependent features (like product fetching) will not work. You'll see a warning banner at the top of the page.

## Environment Configuration

### Frontend Environment Variables

Located in the root `.env` file:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Backend API Environment Variables

Located in `api/.env` (already configured):

- `PORT` - API server port (default: 8787)
- `NODE_ENV` - Environment (development/production)
- `APP_URL` - Frontend URL for CORS
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GOOGLE_AI_API_KEY` - Google Gemini/VEO3 API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key

## Available Scripts

### Development

- `npm run dev` - Start frontend only (Vite dev server)
- `npm run dev:api` - Start backend API only
- `npm run dev:full` - Start both frontend and backend (**recommended**)

### Building

- `npm run build` - Build frontend for production
- `npm run build:api` - Build backend API for production
- `npm run build:all` - Build both frontend and backend

### Other

- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run preview` - Preview production build locally

## API Server Health Check

The application automatically checks if the API server is running when it starts. If the API server is not reachable:

1. A yellow warning banner appears at the top of the page
2. Console shows helpful instructions
3. Product fetching and other API features will show error messages

## Troubleshooting

### "API server is not running" error

**Solution:** Start both servers with `npm run dev:full`

### Port 8787 already in use

**Solution:** Kill the existing process or change the PORT in `api/.env`

```bash
# Find and kill process on port 8787
lsof -ti:8787 | xargs kill -9
```

### API changes not reflecting

**Solution:** The API uses `tsx watch` which auto-reloads on file changes. If changes aren't reflecting, restart the API server.

## Project Structure

```
.
├── src/                 # Frontend React application
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── lib/            # Utilities and API clients
│   └── ...
├── api/                # Backend API server
│   ├── src/
│   │   ├── routes/     # API route handlers
│   │   ├── lib/        # Services and utilities
│   │   └── index.ts    # API entry point
│   └── .env           # API environment variables
└── ...
```

## Production Deployment

The backend API is configured for deployment on Render.com (see `api/render.yaml`). Environment variables are managed through the Render.com dashboard.

Frontend can be deployed to Vercel, Netlify, or any static hosting service.
