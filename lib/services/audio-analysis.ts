import { env } from '@/lib/env';
import type { AudioFeatures } from '@/lib/types';

export async function analyzeAudioWithWorker(file: File): Promise<AudioFeatures> {
  if (!env.AUDIO_ANALYSIS_URL) {
    return fallbackAudioFeatures(file.name);
  }

  const form = new FormData();
  form.append('audio', file, file.name);

  const response = await fetch(`${env.AUDIO_ANALYSIS_URL.replace(/\/$/, '')}/analyze`, {
    method: 'POST',
    headers: env.AUDIO_ANALYSIS_TOKEN
      ? {
          Authorization: `Bearer ${env.AUDIO_ANALYSIS_TOKEN}`,
        }
      : undefined,
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Audio worker failed with ${response.status}.`);
  }

  return response.json();
}

function fallbackAudioFeatures(fileName: string): AudioFeatures {
  const lower = fileName.toLowerCase();
  const isAfro = lower.includes('afro') || lower.includes('dance');
  const isRnB = lower.includes('rnb') || lower.includes('r&b') || lower.includes('slow');

  if (isAfro) {
    return {
      bpm: 104,
      key: 'A minor',
      energy: 0.74,
      mood: ['warm', 'rhythmic', 'sunset', 'danceable'],
      genres: [
        { name: 'Afrobeats', confidence: 0.64 },
        { name: 'Dancehall', confidence: 0.22 },
        { name: 'Pop', confidence: 0.14 },
      ],
    };
  }

  if (isRnB) {
    return {
      bpm: 82,
      key: 'D minor',
      energy: 0.51,
      mood: ['smooth', 'intimate', 'late-night', 'melancholic'],
      genres: [
        { name: 'Alternative R&B', confidence: 0.69 },
        { name: 'Soul', confidence: 0.18 },
        { name: 'Pop', confidence: 0.13 },
      ],
    };
  }

  return {
    bpm: 142,
    key: 'F minor',
    energy: 0.82,
    mood: ['dark', 'atmospheric', 'confident', 'late-night'],
    genres: [
      { name: 'Trap', confidence: 0.72 },
      { name: 'Hip-Hop', confidence: 0.19 },
      { name: 'Alternative R&B', confidence: 0.09 },
    ],
  };
}
