# Genredetect Audio Worker

FastAPI service for audio feature extraction with Librosa.

## Local run

```bash
cd audio-worker
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then set:

```bash
AUDIO_ANALYSIS_URL=http://localhost:8000
AUDIO_ANALYSIS_TOKEN=optional-shared-secret
```

Deploy this worker separately on Render, Fly.io, Railway, or any Python-friendly host. Vercel serverless is not ideal for Librosa because cold starts and native audio dependencies can be heavy.
