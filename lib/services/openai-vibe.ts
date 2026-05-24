import OpenAI from 'openai';
import { z } from 'zod';
import { env } from '@/lib/env';
import type { AudioFeatures } from '@/lib/types';

const vibeSchema = z.object({
  artists: z.array(z.object({ name: z.string(), reason: z.string() })).min(5).max(10),
  vocalStyles: z.array(z.string()).min(3).max(8),
  explanation: z.string(),
});

export async function generateVibeAnalysis({
  fileName,
  features,
}: {
  fileName: string;
  features: AudioFeatures;
}) {
  if (!env.OPENAI_API_KEY) {
    return fallbackVibe(features);
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a senior A&R and music producer. Return precise JSON with artists, vocalStyles, and explanation. Be honest that matches are vibe suggestions, not audio fingerprint matches.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          fileName,
          bpm: features.bpm,
          key: features.key,
          energy: features.energy,
          mood: features.mood,
          genres: features.genres,
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message.content ?? '{}';
  const parsed = vibeSchema.safeParse(JSON.parse(content));

  if (!parsed.success) {
    return fallbackVibe(features);
  }

  return parsed.data;
}

function fallbackVibe(features: AudioFeatures) {
  const primaryGenre = features.genres[0]?.name ?? 'Hip-Hop';

  if (primaryGenre.includes('Afro')) {
    return {
      artists: [
        { name: 'Burna Boy', reason: 'The warm pocket and syncopated rhythm fit relaxed melodic phrasing.' },
        { name: 'Wizkid', reason: 'Smooth toplines would sit naturally over the danceable bounce.' },
        { name: 'Rema', reason: 'The tempo supports catchy, airy hooks and rhythmic vocal doubles.' },
        { name: 'Ayra Starr', reason: 'Bright melodic runs would balance the groove and lift the chorus.' },
        { name: 'Omah Lay', reason: 'Melancholic melodies would match the warm, floating mood.' },
      ],
      vocalStyles: ['melodic afropop hooks', 'call-and-response stacks', 'soft verse delivery', 'rhythmic ad-libs'],
      explanation:
        'This track leans danceable and warm, so it fits melodic Afrobeats vocals with a clean hook, pocketed verses, and smooth stacked harmonies.',
    };
  }

  if (primaryGenre.includes('R&B')) {
    return {
      artists: [
        { name: 'SZA', reason: 'The intimate mood supports conversational melodies and emotional phrasing.' },
        { name: 'Bryson Tiller', reason: 'The slower tempo fits half-sung rap flows and late-night hooks.' },
        { name: 'PARTYNEXTDOOR', reason: 'Sparse space and minor-key color leave room for moody vocal layers.' },
        { name: 'Summer Walker', reason: 'Soft, close vocals would work well over the understated energy.' },
        { name: '6LACK', reason: 'Minimal melodic rap would complement the darker emotional tone.' },
      ],
      vocalStyles: ['breathy leads', 'melodic rap', 'stacked harmonies', 'intimate low-register verses'],
      explanation:
        'The track feels smooth and intimate, so it favors R&B writing with emotional restraint, close vocal tone, and sparse hooks.',
    };
  }

  return {
    artists: [
      { name: 'Travis Scott', reason: 'Dark synth space, heavy low-end, and a wide bounce suit melodic ad-libs.' },
      { name: 'Don Toliver', reason: 'The tempo and minor-key atmosphere fit glossy hooks and stretched melodies.' },
      { name: 'Future', reason: 'The drum pocket supports hypnotic flows with confident, nocturnal energy.' },
      { name: 'Playboi Carti', reason: 'High-energy pockets leave space for repetitive, character-driven hooks.' },
      { name: 'Gunna', reason: 'Smooth triplet flows would glide over the fast bounce without overcrowding it.' },
    ],
    vocalStyles: ['melodic rap', 'airy ad-libs', 'low-register verses', 'hook repetition', 'reverb-heavy stacks'],
    explanation:
      'This track points toward a dark melodic trap lane. The fast tempo, minor key, and strong energy would suit spacious hooks, ad-libs, and confident rhythmic verses.',
  };
}
