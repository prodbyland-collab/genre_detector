import type { AnalysisResult } from '@/lib/types';

export const demoAnalysis: AnalysisResult = {
  id: 'demo',
  title: 'Midnight bounce.wav',
  createdAt: new Date().toISOString(),
  bpm: 142,
  key: 'F minor',
  energy: 0.82,
  mood: ['dark', 'atmospheric', 'confident', 'late-night'],
  genres: [
    { name: 'Trap', confidence: 0.72 },
    { name: 'Alternative R&B', confidence: 0.18 },
    { name: 'Hip-Hop', confidence: 0.1 },
  ],
  artists: [
    {
      name: 'Travis Scott',
      reason: 'Dark synth space, heavy low-end, and a wide bounce leave room for melodic ad-libs.',
    },
    {
      name: 'Don Toliver',
      reason: 'The tempo and minor-key atmosphere fit glossy hooks and stretched vocal melodies.',
    },
    {
      name: 'Future',
      reason: 'The drum pocket supports hypnotic flows with confident, nocturnal energy.',
    },
    {
      name: 'Metro Boomin',
      reason: 'Cinematic tension and spacious drums match modern trap production language.',
    },
  ],
  vocalStyles: ['melodic rap', 'airy stacked hooks', 'low-register verses', 'reverb-heavy ad-libs'],
  explanation:
    'This track feels built for a moody trap vocal. The minor key, fast bounce, and strong low-end point toward dark melodic rap with space for ad-libs, pauses, and a hook that floats above the drums.',
};

export function getDemoAnalysis(id: string) {
  if (id === 'demo' || id.startsWith('demo')) {
    return demoAnalysis;
  }

  return demoAnalysis;
}
