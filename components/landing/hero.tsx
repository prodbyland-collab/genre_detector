'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Music2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const bars = Array.from({ length: 64 }, (_, index) => index);

export function Hero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden px-5 pt-32 md:pt-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(37,244,180,0.22),transparent_25%),radial-gradient(circle_at_80%_15%,rgba(255,209,102,0.16),transparent_25%),linear-gradient(180deg,rgba(7,10,15,0),#070a0f_88%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-80 opacity-50">
        <div className="wave-grid h-full" />
      </div>
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm font-bold">
            <Sparkles className="size-4 text-primary" />
            AI music analysis for serious creators
          </div>
          <h1 className="font-display text-6xl font-black leading-[0.95] tracking-normal text-balance md:text-8xl">
            Genredetect
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
            Upload a beat or song and get genre, tempo, key, mood, energy, artist fit, and vocal direction in one polished report.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Analyze a track <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/results/demo">View demo report</Link>
            </Button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="glass rounded-xl p-5"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Live analysis</p>
              <h2 className="font-display text-2xl font-bold">Dark trap bounce</h2>
            </div>
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Music2 className="size-5" />
            </span>
          </div>
          <div className="flex h-44 items-end gap-1.5 rounded-lg border border-white/10 bg-black/35 p-4">
            {bars.map((bar) => (
              <motion.span
                key={bar}
                className="w-full rounded-full bg-gradient-to-t from-coral via-gold to-primary"
                animate={{ height: [`${18 + (bar % 5) * 8}%`, `${38 + (bar % 9) * 7}%`, `${18 + (bar % 5) * 8}%`] }}
                transition={{ duration: 1.1 + (bar % 6) * 0.12, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ['Genre', 'Trap', '72%'],
              ['BPM', '142', 'fast'],
              ['Key', 'F minor', 'moody'],
            ].map(([label, value, meta]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase text-muted-foreground">{label}</p>
                <p className="mt-2 font-display text-2xl font-bold">{value}</p>
                <p className="text-xs text-primary">{meta}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
