# HOBA API

Backend API for HOBA video generation platform.

## Features

- **URL Ingest** - Extract product data from any e-commerce URL
- **Auto Brand Kit** - Generate SVG logos and color palettes
- **3 Concepts** - POV, Question, Before/After with fixed seeds
- **Trend Hooks** - Pattern-based hook templates

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Required:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (not anon key)
- `APP_URL` - Frontend URL for CORS (e.g., https://your-app.vercel.app)
- `PORT` - Server port (default: 8787)

## Deploy to Render.com

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml`
5. Add environment variables in Render dashboard
6. Deploy!

## API Endpoints

### Health Check
```
GET /healthz
```

### Ingest Product URL
```
POST /api/ingest/url
{
  "url": "https://shop.com/products/widget",
  "userId": "user-uuid"
}
```

Returns:
- Product data (title, images, bullets, etc.)
- Brand kit (logo SVG, palette, style)
- 3 concepts (A/B/C with scripts and seeds)

### List Products
```
GET /api/ingest/products?userId=user-uuid
```

Returns list of ingested products for user.

## Project Structure

```
api/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          - DB client
│   │   ├── logger.ts            - Structured logging
│   │   ├── ingest.ts            - URL scraping
│   │   ├── brand-kit.ts         - Logo generation
│   │   └── concept-factory.ts   - 3-concept planner
│   ├── routes/
│   │   ├── health.ts            - Health checks
│   │   └── ingest.ts            - Ingest endpoints
│   └── index.ts                 - Express server
├── package.json
├── tsconfig.json
└── render.yaml                  - Render.com config
```

## Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Render.com

## Notes

- CORS is locked to `APP_URL` environment variable
- All logs are structured JSON for production monitoring
- Error rate monitoring (>10% in 15min triggers warning)
- Health checks available at `/healthz`
