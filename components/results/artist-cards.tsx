import { Mic2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ArtistFit } from '@/lib/types';

export function ArtistCards({ artists }: { artists: ArtistFit[] }) {
  return (
    <section>
      <h2 className="mb-4 font-display text-3xl font-black">Similar artists and fit</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {artists.map((artist) => (
          <Card key={artist.name}>
            <CardHeader>
              <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-gold/15 text-gold">
                <Mic2 className="size-5" />
              </span>
              <CardTitle>{artist.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-muted-foreground">{artist.reason}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
