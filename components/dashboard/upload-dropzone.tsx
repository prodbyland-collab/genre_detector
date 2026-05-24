'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { FileAudio, Loader2, UploadCloud, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatFileSize } from '@/lib/utils';

type Stage = 'idle' | 'uploading' | 'extracting' | 'reasoning' | 'saving' | 'done';

const stageCopy: Record<Stage, string> = {
  idle: 'Ready for audio',
  uploading: 'Uploading track',
  extracting: 'Extracting BPM, key, and energy',
  reasoning: 'Generating artist-fit and vocal direction',
  saving: 'Saving report',
  done: 'Analysis complete',
};

export function UploadDropzone() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setFile(accepted[0] ?? null);
    setError(null);
    setProgress(0);
    setStage('idle');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'audio/*': ['.mp3', '.wav', '.aiff', '.aif', '.m4a', '.flac', '.ogg'],
    },
    maxSize: 200 * 1024 * 1024,
  });

  const isBusy = stage !== 'idle' && stage !== 'done';

  const status = useMemo(() => {
    if (!isBusy) return stageCopy[stage];
    return `${stageCopy[stage]}...`;
  }, [isBusy, stage]);

  async function analyze() {
    if (!file || isBusy) return;

    setError(null);

    try {
      setStage('uploading');
      setProgress(20);
      const form = new FormData();
      form.append('audio', file, file.name);
      form.append('fileName', file.name);

      setStage('extracting');
      setProgress(48);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: form,
      });

      setStage('reasoning');
      setProgress(78);

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Analysis failed.');
      }

      setStage('saving');
      setProgress(94);
      sessionStorage.setItem(`analysis:${payload.id}`, JSON.stringify(payload));
      setStage('done');
      setProgress(100);
      router.push(`/results/${payload.id}`);
    } catch (caught) {
      setStage('idle');
      setProgress(0);
      setError(caught instanceof Error ? caught.message : 'Could not analyze this file.');
    }
  }

  return (
    <Card className="min-h-[660px]">
      <CardHeader>
        <CardTitle>Analyze a track</CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload MP3, WAV, AIFF, M4A, FLAC, or OGG files up to 200 MB.
        </p>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-white/14 bg-white/5 hover:bg-white/8'
          }`}
        >
          <input {...getInputProps()} />
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UploadCloud className="size-7" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold">
            {isDragActive ? 'Drop it here' : 'Drag audio here'}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            The app stores the file in Supabase Storage in production, then sends it to the audio worker for feature extraction.
          </p>
        </div>

        {file ? (
          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-lg bg-gold text-black">
                <FileAudio className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold">{file.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <audio className="mt-4 w-full" controls src={URL.createObjectURL(file)} />
          </div>
        ) : null}

        {isBusy ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between text-sm font-bold">
              <span>{status}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
            <p className="mt-3 text-sm text-muted-foreground">
              Larger files can take longer when the Python audio worker is cold starting.
            </p>
          </div>
        ) : null}

        {error ? <p className="text-sm font-semibold text-red-300">{error}</p> : null}

        <Button disabled={!file || isBusy} onClick={analyze} size="lg">
          {isBusy ? <Loader2 className="size-5 animate-spin" /> : <WandSparkles className="size-5" />}
          Analyze track
        </Button>
      </CardContent>
    </Card>
  );
}
