# Genre Detector

A music analysis web app where users upload an audio file and get estimates for genre, tempo, key, energy, danceability, and artists who fit the same vibe.

## Current Version

- React + TypeScript + Vite frontend
- Browser-only audio decoding through the Web Audio API
- Essentia.js/WASM analysis for BPM and key detection
- Heuristic analysis for spectral brightness, bass weight, genre, and artist matching
- No uploaded audio leaves the user's browser

The analysis layer is intentionally isolated in `src/audioAnalysis.ts` so it can be upgraded with a trained genre model, server-side Python pipeline, or external music intelligence API later.

Essentia.js is licensed under AGPL-3.0. Review the license before commercial distribution.

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
