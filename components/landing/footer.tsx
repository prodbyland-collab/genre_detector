import Link from 'next/link';

export function Footer() {
  return (
    <footer className="px-5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>Genredetect. AI analysis for modern music workflows.</p>
        <div className="flex gap-5">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/results/demo">Demo</Link>
          <Link href="/auth/login">Login</Link>
        </div>
      </div>
    </footer>
  );
}
