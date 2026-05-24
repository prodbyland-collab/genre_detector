# Genre Detector

A music analysis web app where users upload an audio file and get estimates for genre, tempo, key, energy, danceability, and artists who fit the same vibe.

## Current Version

- React + TypeScript + Vite frontend
- Browser-only audio decoding through the Web Audio API
- Heuristic analysis for tempo, key, spectral brightness, bass weight, genre, and artist matching
- No uploaded audio leaves the user's browser

The analysis layer is intentionally isolated in `src/audioAnalysis.ts` so it can be replaced or upgraded with a trained model, server-side Python pipeline, or external music intelligence API later.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Next Upgrades

- Add authenticated upload history
- Add server-side stem/feature extraction
- Train or integrate a genre classifier
- Expand artist matching by region, language, vocal range, and lyrical lane
- Add shareable result pages for producers and collaborators
