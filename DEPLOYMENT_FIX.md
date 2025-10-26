# Deployment Fix - Zod Module Resolution

## Problem
The deployment was failing with error:
```
TS2307: Cannot find module 'zod' or its corresponding type declarations.
```

This occurred in `/packages/shared/src/plan.ts` during the TypeScript compilation phase.

## Root Cause
The project had a monorepo-style structure with a `packages/shared` directory that:
- Did NOT have its own `package.json`
- Did NOT have its own `node_modules`
- Could not resolve the `zod` dependency during deployment builds

## Solution
Restructured the project to eliminate the incomplete monorepo setup:

### Changes Made:

1. **Moved Shared Types to API**
   - Copied `/packages/shared/src/plan.ts` → `/api/src/types/plan.ts`
   - The API has its own `package.json` with `zod` as a dependency

2. **Moved Shared Types to Frontend**
   - Copied `/packages/shared/src/plan.ts` → `/src/types/plan.ts`
   - The frontend root has `zod` in its `package.json`

3. **Updated All Import Paths**
   - Changed all imports from `../../../packages/shared/src/plan` to `../types/plan`
   - Updated files:
     - `api/src/lib/promptCompiler.ts`
     - `api/src/lib/overlayComposer.ts`
     - `api/src/lib/tts-service.ts`
     - `api/src/lib/preflight.ts`
     - `api/src/lib/ocrQa.ts`
     - `api/src/routes/webhooks.ts`
     - `api/src/routes/render.ts`
     - `api/src/routes/static.ts`
     - `api/src/routes/plan.ts`

4. **Removed Monorepo Structure**
   - Deleted `/packages/shared/` directory
   - Updated `api/tsconfig.json` to remove references to `../packages/shared/src/**/*`
   - Updated documentation references in `RELIABILITY_PIPELINE.md`

## Verification
All builds now succeed:
- ✅ API TypeScript compilation: `cd api && npm run typecheck`
- ✅ API build: `cd api && npm run build`
- ✅ Frontend build: `npm run build`

## Files Created/Modified

### New Files:
- `/api/src/types/plan.ts` - Shared plan types for API
- `/src/types/plan.ts` - Shared plan types for frontend (if needed)

### Modified Files:
- All API route and library files (updated imports)
- `api/tsconfig.json` (removed packages reference)
- `RELIABILITY_PIPELINE.md` (updated documentation paths)

### Deleted:
- `/packages/` directory (entire monorepo structure removed)

## Deployment Status
✅ Ready for deployment - all module resolution issues fixed
