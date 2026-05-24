'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GenreConfidence } from '@/lib/types';

export function GenreChart({ genres }: { genres: GenreConfidence[] }) {
  const data = genres.map((genre) => ({
    name: genre.name,
    confidence: Math.round(genre.confidence * 100),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Genre confidence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="rgba(244,241,232,0.55)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(244,241,232,0.55)" tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                contentStyle={{
                  background: '#10151c',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="confidence" radius={[8, 8, 0, 0]} fill="#25f4b4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
