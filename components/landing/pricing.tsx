import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tiers = [
  { name: 'Starter', price: '$0', points: ['5 analyses/month', 'Preview reports', 'Basic genre and tempo'] },
  { name: 'Producer', price: '$19', points: ['150 analyses/month', 'PDF exports', 'Artist-fit and vocal ideas'] },
  { name: 'Studio', price: '$79', points: ['1,000 analyses/month', 'Team workspace', 'Priority audio worker queue'] },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-5 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="font-bold text-primary">Pricing</p>
          <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">Start free, scale with credits.</h2>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.name} className="glass rounded-xl p-6">
              <h3 className="font-display text-2xl font-bold">{tier.name}</h3>
              <p className="mt-4 font-display text-5xl font-black">{tier.price}</p>
              <p className="text-sm text-muted-foreground">per month</p>
              <ul className="mt-6 space-y-3">
                {tier.points.map((point) => (
                  <li key={point} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="size-4 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-7 w-full" variant={tier.name === 'Producer' ? 'default' : 'outline'}>
                <Link href="/dashboard">Choose {tier.name}</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
