import Link from 'next/link';
import { BarChart3, CreditCard, Disc3, History, Settings, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const nav = [
  { href: '/dashboard', label: 'Upload', icon: Upload },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/results/demo', label: 'Results', icon: BarChart3 },
  { href: '#billing', label: 'Billing', icon: CreditCard },
  { href: '#settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-5 md:px-8">
      <div className="mx-auto flex max-w-7xl gap-5">
        <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-64 shrink-0 rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl lg:block">
          <Link href="/" className="mb-8 flex items-center gap-3 font-display text-lg font-bold">
            <span className="flex size-10 items-center justify-center rounded-full bg-gold text-black">
              <Disc3 className="size-5" />
            </span>
            Genredetect
          </Link>
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-white/8 hover:text-foreground"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-8">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
              <p className="text-sm font-bold">18 credits left</p>
              <p className="mt-1 text-xs text-muted-foreground">Upgrade when your catalog gets serious.</p>
              <Button className="mt-4 w-full" size="sm">
                Upgrade
              </Button>
            </div>
          </div>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2 font-display font-bold lg:hidden">
              <Disc3 className="size-5 text-gold" />
              Genredetect
            </Link>
            <div className="hidden lg:block">
              <p className="text-sm text-muted-foreground">Workspace</p>
              <h1 className="font-display text-2xl font-bold">Music analysis dashboard</h1>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/">View site</Link>
            </Button>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
