'use client';

import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { Download, Share2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ArtistCards } from '@/components/results/artist-cards';
import { EnergyMeter } from '@/components/results/energy-meter';
import { GenreChart } from '@/components/results/genre-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisResult } from '@/lib/types';

export function ResultsOverview({ analysis, isPublic = false }: { analysis: AnalysisResult; isPublic?: boolean }) {
  const [hydratedResult, setHydratedResult] = useState<AnalysisResult | null>(null);
  const result = hydratedResult ?? analysis;
  const primaryGenre = result.genres[0]?.name ?? 'Unknown';

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const stored = sessionStorage.getItem(`analysis:${analysis.id}`);
      if (stored) {
        setHydratedResult(JSON.parse(stored) as AnalysisResult);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [analysis.id]);

  const genreSummary = useMemo(
    () => result.genres.map((genre) => `${genre.name} ${Math.round(genre.confidence * 100)}%`).join(', '),
    [result.genres],
  );

  function downloadPdf() {
    const pdf = new jsPDF();
    pdf.setFontSize(22);
    pdf.text('Genredetect Report', 18, 22);
    pdf.setFontSize(12);
    pdf.text(`Track: ${result.title}`, 18, 36);
    pdf.text(`Genre: ${genreSummary}`, 18, 46);
    pdf.text(`BPM: ${result.bpm}`, 18, 56);
    pdf.text(`Key: ${result.key}`, 18, 66);
    pdf.text(`Energy: ${Math.round(result.energy * 100)}%`, 18, 76);
    pdf.text(`Mood: ${result.mood.join(', ')}`, 18, 86);
    pdf.text('Analysis:', 18, 102);
    pdf.text(pdf.splitTextToSize(result.explanation, 170), 18, 112);
    pdf.text('Artist fit:', 18, 148);
    result.artists.slice(0, 6).forEach((artist, index) => {
      pdf.text(`${index + 1}. ${artist.name}: ${artist.reason}`, 18, 158 + index * 10, { maxWidth: 170 });
    });
    pdf.save(`${result.title.replace(/\.[^/.]+$/, '')}-genredetect-report.pdf`);
  }

  async function share() {
    await navigator.clipboard.writeText(`${window.location.origin}/s/${result.id}`);
  }

  const body = (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold text-primary">Analysis report</p>
          <h1 className="mt-2 font-display text-4xl font-black md:text-6xl">{result.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{primaryGenre}</Badge>
            <Badge>{result.bpm} BPM</Badge>
            <Badge>{result.key}</Badge>
            {result.mood.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={share} variant="outline">
            <Share2 className="size-4" />
            Share
          </Button>
          <Button onClick={downloadPdf}>
            <Download className="size-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <GenreChart genres={result.genres} />
          <EnergyMeter energy={result.energy} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>AI vibe explanation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-8 text-muted-foreground">{result.explanation}</p>
            <div className="pt-2">
              <h3 className="font-display text-xl font-bold">Suggested vocal styles</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.vocalStyles.map((style) => (
                  <Badge key={style}>{style}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ArtistCards artists={result.artists} />
    </section>
  );

  if (isPublic) {
    return <main className="min-h-screen px-4 py-8 md:px-8">{body}</main>;
  }

  return <AppShell>{body}</AppShell>;
}
