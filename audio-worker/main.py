import os
import tempfile
from typing import Annotated

import librosa
import numpy as np
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Genredetect Audio Worker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

KEYS = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
]


def authorize(authorization: Annotated[str | None, Header()] = None):
    expected = os.getenv("AUDIO_ANALYSIS_TOKEN")
    if expected and authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Invalid analysis token")


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/analyze", dependencies=[Depends(authorize)])
async def analyze(audio: UploadFile = File(...)):
    suffix = os.path.splitext(audio.filename or "track.wav")[1] or ".wav"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        path = tmp.name

    try:
        y, sr = librosa.load(path, sr=22050, mono=True, duration=180)
        if y.size == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty")

        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)
        key_index = int(np.argmax(chroma_mean))
        mode = "minor" if float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))) < 2300 else "major"

        rms = librosa.feature.rms(y=y)
        energy = float(np.clip(np.mean(rms) * 12, 0, 1))
        centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
        zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))

        genres = infer_genres(float(np.atleast_1d(tempo)[0]), energy, centroid, zcr)
        mood = infer_mood(energy, mode, centroid)

        return {
            "bpm": round(float(np.atleast_1d(tempo)[0])),
            "key": f"{KEYS[key_index]} {mode}",
            "energy": round(energy, 2),
            "mood": mood,
            "genres": genres,
            "rawFeatures": {
                "spectralCentroid": centroid,
                "zeroCrossingRate": zcr,
                "rms": float(np.mean(rms)),
            },
        }
    finally:
        os.unlink(path)


def infer_genres(tempo: float, energy: float, centroid: float, zcr: float):
    if 95 <= tempo <= 115 and energy > 0.45:
        return [
            {"name": "Afrobeats", "confidence": 0.58},
            {"name": "Dancehall", "confidence": 0.24},
            {"name": "Pop", "confidence": 0.18},
        ]

    if tempo < 95 and energy < 0.65:
        return [
            {"name": "Alternative R&B", "confidence": 0.61},
            {"name": "Soul", "confidence": 0.21},
            {"name": "Hip-Hop", "confidence": 0.18},
        ]

    if tempo >= 125 and zcr > 0.045:
        return [
            {"name": "Trap", "confidence": 0.64},
            {"name": "Hip-Hop", "confidence": 0.24},
            {"name": "Alternative R&B", "confidence": 0.12},
        ]

    if centroid > 2800:
        return [
            {"name": "Pop", "confidence": 0.52},
            {"name": "Electronic", "confidence": 0.31},
            {"name": "Dance", "confidence": 0.17},
        ]

    return [
        {"name": "Hip-Hop", "confidence": 0.45},
        {"name": "R&B", "confidence": 0.32},
        {"name": "Pop", "confidence": 0.23},
    ]


def infer_mood(energy: float, mode: str, centroid: float):
    tags = []
    tags.append("high-energy" if energy > 0.7 else "balanced" if energy > 0.45 else "low-key")
    tags.append("dark" if mode == "minor" else "bright")
    tags.append("crisp" if centroid > 2600 else "warm")
    tags.append("club-ready" if energy > 0.75 else "late-night")
    return tags
