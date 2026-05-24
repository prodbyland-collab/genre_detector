# Genre Detector

A music analysis web app where users upload an audio file and get prototype estimates for genre, tempo, key, energy, danceability, and artist direction.

## Current Version

- React + TypeScript + Vite frontend
- Browser-only audio decoding through the Web Audio API
- Beatlyze API analysis for BPM, key, loudness, energy, danceability, mood, and genre
- Server-side Hugging Face API genre/vibe classification
- Directional artist matching from provider metadata

Beatlyze is the primary analysis provider. The app sends uploads to your server, your server calls Beatlyze with `BEATLYZE_API_KEY`, and users never see the API key.

The analysis layer is intentionally isolated in `src/audioAnalysis.ts` so it can be upgraded with a trained genre model, server-side Python pipeline, or external music intelligence API later.

## Hugging Face Genre API

Set `BEATLYZE_API_KEY` in the server environment to use real provider analysis. The token never ships to the browser.

Optional: `HF_TOKEN` and `HF_MODEL` are still available for fallback experiments, but Beatlyze is the real analysis path.

## Run Locally

```bash
npm install
BEATLYZE_API_KEY=bz_your_key_here npm run dev
```

On Windows PowerShell:

```powershell
$env:BEATLYZE_API_KEY="bz_your_key_here"; npm run dev
```

The Beatlyze key must be set as a server environment variable. Do not paste it into source code or commit it to GitHub.

The local API server listens on `API_PORT`, defaulting to `5174` for Bolt/Vite development. Vite proxies `/api/*` to that port during development.

## Build And Run

```bash
npm run build
BEATLYZE_API_KEY=bz_your_key_here npm start
```

## Next Upgrades

- Add Cyanite or another similarity provider for real artist/track similarity
- Add authenticated upload history
- Add server-side stem/feature extraction
- Expand artist matching by region, language, vocal range, and lyrical lane
- Add shareable result pages for producers and collaborators
