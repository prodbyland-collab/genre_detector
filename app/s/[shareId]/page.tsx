import { ResultsOverview } from '@/components/results/results-overview';
import { getDemoAnalysis } from '@/lib/demo-data';

export default async function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const analysis = getDemoAnalysis(shareId) ?? getDemoAnalysis('demo');

  return <ResultsOverview analysis={analysis} isPublic />;
}
