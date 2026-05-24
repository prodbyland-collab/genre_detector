import { AnalysisHistory } from '@/components/dashboard/analysis-history';
import { UploadDropzone } from '@/components/dashboard/upload-dropzone';
import { AppShell } from '@/components/layout/app-shell';

const demoHistory = [
  { id: 'demo-1', title: 'Midnight bounce.wav', genre: 'Trap', bpm: 142, key: 'F minor' },
  { id: 'demo-2', title: 'Neon drums.mp3', genre: 'Afrobeats', bpm: 104, key: 'A minor' },
  { id: 'demo-3', title: 'Late ride.aiff', genre: 'R&B', bpm: 82, key: 'D minor' },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <UploadDropzone />
        <AnalysisHistory tracks={demoHistory} />
      </section>
    </AppShell>
  );
}
