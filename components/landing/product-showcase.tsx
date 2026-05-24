import { BarChart3, Brain, FileAudio, Share2, ShieldCheck, WalletCards } from 'lucide-react';

const features = [
  { icon: FileAudio, title: 'Upload workflow', text: 'Drag, drop, preview, and track upload progress from the dashboard.' },
  { icon: BarChart3, title: 'Audio metrics', text: 'BPM, key, energy, mood tags, and genre confidence visualized for fast decisions.' },
  { icon: Brain, title: 'A&R reasoning', text: 'OpenAI turns extracted features into artist-fit explanations and vocal direction.' },
  { icon: Share2, title: 'Share reports', text: 'Create public links and export clean PDFs for collaborators and clients.' },
  { icon: WalletCards, title: 'Credits ready', text: 'Usage and subscription tables are already modeled for paywalls.' },
  { icon: ShieldCheck, title: 'Protected routes', text: 'Supabase auth, rate limiting, and server-side API boundaries are built in.' },
];

export function ProductShowcase() {
  return (
    <section id="features" className="border-y border-white/8 bg-white/[0.025] px-5 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="font-bold text-primary">Built like a SaaS product</p>
          <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">From upload to release direction.</h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="glass rounded-xl p-6">
              <feature.icon className="size-7 text-gold" />
              <h3 className="mt-5 font-display text-xl font-bold">{feature.title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
