import Link from 'next/link';
import { Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-background/70 backdrop-blur-2xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3 font-display text-lg font-bold">
          <span className="flex size-9 items-center justify-center rounded-full bg-gold text-black">
            <Disc3 className="size-5" />
          </span>
          Genredetect
        </Link>
        <div className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#proof">Proof</a>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">Upload</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
