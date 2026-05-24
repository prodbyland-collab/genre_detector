import { Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function EnergyMeter({ energy }: { energy: number }) {
  const value = Math.round(energy * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy level</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Gauge className="size-7" />
          </span>
          <div>
            <p className="font-display text-5xl font-black">{value}%</p>
            <p className="text-sm text-muted-foreground">
              {value > 75 ? 'High-energy' : value > 45 ? 'Balanced' : 'Low-key'}
            </p>
          </div>
        </div>
        <Progress value={value} className="mt-6" />
      </CardContent>
    </Card>
  );
}
