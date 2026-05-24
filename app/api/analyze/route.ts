import { NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeAudioWithWorker } from '@/lib/services/audio-analysis';
import { generateVibeAnalysis } from '@/lib/services/openai-vibe';
import { checkRateLimit } from '@/lib/services/rate-limit';

export const runtime = 'nodejs';

const requestSchema = z.object({
  fileName: z.string().min(1),
});

export async function POST(request: Request) {
  const limit = checkRateLimit(request.headers.get('x-forwarded-for') ?? 'local-preview');

  if (!limit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const formData = await request.formData();
  const audio = formData.get('audio');
  const parsed = requestSchema.safeParse({ fileName: formData.get('fileName') });

  if (!(audio instanceof File) || !parsed.success) {
    return NextResponse.json({ error: 'Upload an audio file to analyze.' }, { status: 400 });
  }

  try {
    const features = await analyzeAudioWithWorker(audio);
    const vibe = await generateVibeAnalysis({
      fileName: parsed.data.fileName,
      features,
    });

    return NextResponse.json({
      id: crypto.randomUUID(),
      title: parsed.data.fileName,
      createdAt: new Date().toISOString(),
      ...features,
      ...vibe,
      creditsRemaining: Math.max(0, 25 - limit.count),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
