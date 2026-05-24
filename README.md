# Genre Detector

A music analysis web app where users upload an audio file and get prototype estimates for genre, tempo, key, energy, danceability, and artist direction.

## Current Version

- React + TypeScript + Vite frontend
- Browser-only audio decoding through the Web Audio API
- Fast browser-local DSP analysis for BPM and key detection
- Server-side Hugging Face API genre/vibe classification
- Heuristic analysis for spectral brightness, bass weight, and artist matching
- BPM/key analysis stays in the user's browser; genre/vibe audio is sent to your server endpoint and then Hugging Face

Tempo, key, and artist direction are not release-grade music intelligence yet. They are prototype estimates. For production accuracy, replace those parts with a dedicated MIR backend or commercial music analysis API.

The analysis layer is intentionally isolated in `src/audioAnalysis.ts` so it can be upgraded with a trained genre model, server-side Python pipeline, or external music intelligence API later.

## Hugging Face Genre API

Set `HF_TOKEN` in the server environment to use the Hugging Face API for genre/vibe only. The token never ships to the browser. Tempo and key still run locally in the browser.

Optional: set `HF_MODEL` to use a different audio classification model. The default is `gastonduault/music-classifier`.

## Run Locally

```bash
npm install
HF_TOKEN=hf_your_token_here npm run dev
```

On Windows PowerShell:

```powershell
$env:HF_TOKEN="hf_your_token_here"; npm run dev
```

The Hugging Face token must be set as a server environment variable. Do not paste it into source code or commit it to GitHub.

## Build And Run

```bash
npm run build
HF_TOKEN=hf_your_token_here npm start
```

## Next Upgrades

- Replace prototype BPM/key with a real music information retrieval backend
- Replace artist direction with embedding-based similarity or a curated labeled catalog
- Add authenticated upload history
- Add server-side stem/feature extraction
- Train or integrate a genre classifier
- Expand artist matching by region, language, vocal range, and lyrical lane
- Add shareable result pages for producers and collaborators
