# Genredetect

Genredetect is a production-oriented AI SaaS starter for music analysis. Users upload audio and receive genre confidence, BPM, musical key, mood, energy, artist-fit suggestions, vocal style ideas, share links, and PDF reports.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS 4, Framer Motion, shadcn-style UI primitives
- Supabase auth, database, and storage
- Prisma ORM
- OpenAI for A&R/vibe reasoning
- FastAPI + Librosa audio worker for BPM/key/feature extraction
- Vercel-ready frontend deployment

## Included

- Landing page with animated waveform hero, pricing, testimonials, and SaaS navigation
- Dashboard with drag-and-drop upload, progress UI, audio preview, and history layout
- Analysis API route with rate limiting, audio-worker integration, and OpenAI vibe generation
- Results page with genre chart, BPM/key, mood tags, energy meter, artist cards, share action, and PDF export
- Public share route
- Supabase migration and Prisma schema for users, uploads, analyses, subscriptions, API usage, credits, and share links
- Python audio worker ready for Render, Railway, Fly.io, or a dedicated VM

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The UI runs without keys using preview fallbacks. Real analysis needs Supabase, OpenAI, and the audio worker.

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
OPENAI_API_KEY=
AUDIO_ANALYSIS_URL=http://localhost:8000
AUDIO_ANALYSIS_TOKEN=dev-secret
RATE_LIMIT_PER_HOUR=25
NEXT_PUBLIC_REQUIRE_AUTH=false
```

Set `NEXT_PUBLIC_REQUIRE_AUTH=true` after Supabase auth is configured.

## Supabase Setup

1. Create a Supabase project.
2. Copy project URL and anon key into `.env.local`.
3. Copy the Postgres connection string into `DATABASE_URL`.
4. Run `supabase/migrations/0001_init.sql`.
5. Create OAuth providers in Supabase Auth if you want Google/GitHub login.
6. Use the private `audio-uploads` bucket for uploaded files.

## Prisma

```bash
npm run db:generate
npm run db:push
```

For production, prefer migrations:

```bash
npm run db:migrate
```

## Audio Worker

```bash
cd audio-worker
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then set `AUDIO_ANALYSIS_URL=http://localhost:8000`.

The worker uses Librosa heuristics for tempo, key, energy, mood, and coarse genre classification. For commercial-grade music intelligence, augment it with a specialized provider such as Cyanite, Musiio, ACRCloud, or a trained internal model.

## OpenAI Flow

The app uses OpenAI for the subjective A&R layer: artist fit, vocal style recommendations, and explanation text. It does not ask OpenAI to directly hear the audio.

1. Audio worker extracts features.
2. API route sends structured features to OpenAI.
3. OpenAI returns artist-fit reasoning as JSON.
4. Results are ready to store in Supabase.

## Deployment

### Vercel Frontend

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add environment variables.
4. Set build command to `npm run build`.
5. Deploy.

### Audio Worker

Deploy `audio-worker` separately on a Python-friendly host. Set `AUDIO_ANALYSIS_TOKEN` on the worker and the same value in Vercel.

## Bolt.new

Bolt reads the GitHub repo. After commits are pushed, refresh Bolt or reconnect the GitHub project if it is still showing the older Vite app. This project now runs as:

```bash
npm install
npm run dev
```

## Production Notes

- Wire dashboard upload to Supabase Storage signed uploads for large files.
- Persist API results with Prisma after auth is enabled.
- Add Stripe checkout/webhooks against the subscription and credit tables.
- Replace the in-memory rate limiter with Upstash Redis or Supabase-backed limits for multi-instance deployments.
- Add a job queue for long audio files so requests do not time out.
- Add Sentry and analytics before launch.
