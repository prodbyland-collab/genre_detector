import { AnalysisHistory } from '@/components/dashboard/analysis-history';
import { AppShell } from '@/components/layout/app-shell';

export default function HistoryPage() {
  return (
    <AppShell>
      <AnalysisHistory
        tracks={[
          { id: 'demo-1', title: 'Midnight bounce.wav', genre: 'Trap', bpm: 142, key: 'F minor' },
          { id: 'demo-2', title: 'Neon drums.mp3', genre: 'Afrobeats', bpm: 104, key: 'A minor' },
          { id: 'demo-3', title: 'Late ride.aiff', genre: 'R&B', bpm: 82, key: 'D minor' },
        ]}
      />
    </AppShell>
  );
}
