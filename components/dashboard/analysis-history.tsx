import Link from 'next/link';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Track = {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
};

export function AnalysisHistory({ tracks }: { tracks: Track[] }) {
  return (
    <Card className="min-h-[660px]">
      <CardHeader>
        <CardTitle>Analysis history</CardTitle>
        <p className="text-sm text-muted-foreground">Search/filter is ready for your Supabase data.</p>
      </CardHeader>
      <CardContent>
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search tracks" />
        </label>
        <div className="space-y-3">
          {tracks.map((track) => (
            <Link
              key={track.id}
              href={`/results/${track.id}`}
              className="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-primary/40 hover:bg-primary/8"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{track.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {track.bpm} BPM · {track.key}
                  </p>
                </div>
                <Badge>{track.genre}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
