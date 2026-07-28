# T3 Labs Content OS

Private editorial operating system for managing content across QuoteCore+, T3 Labs, T3 Play, and future projects.

## Quick Start

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env.local

# Run dev server
npm run dev
```

## Required Environment Variables

See `.env.example` for all required variables. You need a dedicated Supabase project (do not use QuoteCore+'s Supabase).

## Database Setup

Run the migration in `supabase/migrations/00001_initial_schema.sql` against your Supabase project using the Supabase SQL Editor or `supabase db push`.

## Architecture

- **Next.js 16** with App Router (server components by default)
- **Supabase** for auth, database, and RLS
- **Agent API** at `/api/v1/*` with scoped bearer token authentication
- **No direct Supabase access for agents** - they use the HTTP API only

## Phases

- **Phase 0-1** (current): App scaffold, database schema, RLS, auth, app shell, API contracts
- Phase 2: Core editorial workflow (ideas, content editor, review queue)
- Phase 3: Markdown import/export, agent token management UI
- Phase 4: Existing content ingestion
- Phase 5: Backlink intelligence
- Phase 6: Export and live verification
- Phase 7: Hardening and launch

See `BUILD_PLAN.md` in the prototype directory for the full plan.
