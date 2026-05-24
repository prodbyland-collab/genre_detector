import { notFound } from 'next/navigation';
import { ResultsOverview } from '@/components/results/results-overview';
import { getDemoAnalysis } from '@/lib/demo-data';

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = getDemoAnalysis(id);

  if (!analysis) {
    notFound();
  }

  return <ResultsOverview analysis={analysis} />;
}
