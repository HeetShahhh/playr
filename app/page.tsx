'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Zap, Share2, Trophy } from 'lucide-react';
import { useState } from 'react';

// ─── Sport data ───────────────────────────────────────────────────────────────
const SPORTS = [
  { slug: 'badminton',  name: 'Badminton',   icon: '🏸', accent: '#00A86B', status: 'live' },
  { slug: 'pickleball', name: 'Pickleball',  icon: '🥒', accent: '#FF6B35', status: 'live' },
  { slug: 'tennis',     name: 'Tennis',      icon: '🎾', accent: '#E8A020', status: 'live' },
  { slug: 'cricket',    name: 'Cricket',     icon: '🏏', accent: '#1A5CFF', status: 'coming_soon' },
  { slug: 'basketball', name: 'Basketball',  icon: '🏀', accent: '#E83038', status: 'coming_soon' },
  { slug: 'squash',     name: 'Squash',      icon: '🎱', accent: '#8B5CF6', status: 'coming_soon' },
];

const HOW_IT_WORKS = [
  { num: '01', icon: <Trophy size={22} className="text-orange" />, title: 'Create a match', desc: 'Pick your sport, add players. Done in 30 seconds.' },
  { num: '02', icon: <Zap size={22} className="text-orange" />,    title: 'Score live',     desc: 'Tap to score. Undo anytime. Works offline.' },
  { num: '03', icon: <Share2 size={22} className="text-orange" />, title: 'Share the link', desc: 'Anyone can watch — no app install needed.' },
];

function Logomark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-lg flex items-center justify-center text-white font-bold select-none"
      style={{ width: size, height: size, backgroundColor: '#0D1B2A', fontSize: size * 0.44, fontFamily: 'var(--font-display)' }}
    >
      P▶
    </div>
  );
}

function SportCard({ sport }: { sport: typeof SPORTS[0] }) {
  const [email, setEmail] = useState('');
  const [notified, setNotified] = useState(false);
  const isLive = sport.status === 'live';

  return (
    <div
      className={`bg-white rounded-card border border-border overflow-hidden transition-all duration-150 ${isLive ? 'match-card-hover cursor-pointer' : 'opacity-50'}`}
      style={{ borderLeft: `4px solid ${sport.accent}` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{sport.icon}</span>
          {isLive ? (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wide" style={{ backgroundColor: 'rgba(182,240,0,0.15)', color: '#5A7A00', fontFamily: 'var(--font-display)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block pulse-dot" />
              Live
            </span>
          ) : (
            <span className="text-[10px] font-medium text-muted bg-surface px-2 py-0.5 rounded-pill" style={{ fontFamily: 'var(--font-display)' }}>Coming soon</span>
          )}
        </div>
        <p className="font-semibold text-navy text-sm mb-2" style={{ fontFamily: 'var(--font-display)' }}>{sport.name}</p>
        {isLive ? (
          <Link href="/auth?mode=signup" className="flex items-center gap-1 text-xs font-semibold" style={{ color: sport.accent, fontFamily: 'var(--font-display)', minHeight: '32px' }}>
            Score now <ArrowRight size={12} />
          </Link>
        ) : notified ? (
          <p className="text-xs font-medium" style={{ color: '#00A86B', fontFamily: 'var(--font-display)' }}>✓ We'll notify you!</p>
        ) : (
          <form onSubmit={e => { e.preventDefault(); if (email) setNotified(true); }} className="flex gap-1.5">
            <input
              type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-surface focus:outline-none focus:border-navy min-w-0"
              style={{ minHeight: '32px' }}
            />
            <button type="submit" className="px-2.5 py-1.5 bg-navy text-chalk text-xs rounded-lg font-medium shrink-0" style={{ minHeight: '32px' }}>Notify</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-chalk" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Logomark size={32} />
          <span className="text-lg font-semibold text-navy" style={{ fontFamily: 'var(--font-display)' }}>Playr</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auth" className="text-sm font-medium text-muted hover:text-navy transition-colors px-3 py-2 min-h-[44px] flex items-center" style={{ fontFamily: 'var(--font-display)' }}>Sign in</Link>
          <Link href="/auth?mode=signup" className="flex items-center gap-1.5 px-4 py-2.5 bg-orange text-white text-sm font-bold rounded-lg hover:bg-orange/90 min-h-[44px]" style={{ fontFamily: 'var(--font-display)' }}>
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pt-12 pb-16 max-w-screen-xl mx-auto">
        <div className="max-w-2xl">
          <div className="flex flex-wrap gap-2 mb-6">
            {['🏸 Badminton', '🥒 Pickleball', '🎾 Tennis'].map(s => (
              <span key={s} className="px-3 py-1.5 bg-white border border-border rounded-pill text-sm text-navy font-medium" style={{ fontFamily: 'var(--font-display)' }}>{s}</span>
            ))}
            <span className="px-3 py-1.5 bg-navy rounded-pill text-sm text-lime font-medium" style={{ fontFamily: 'var(--font-display)' }}>+ more coming</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[72px] font-bold text-navy leading-[1.05] mb-5" style={{ fontFamily: 'var(--font-display)' }}>
            Every match.<br className="hidden sm:block" />
            Every point.<br className="hidden sm:block" />
            <span className="text-orange">Every player.</span>
          </h1>

          <p className="text-lg text-muted mb-8 max-w-lg leading-relaxed">
            Score any sport live. Build your identity. Find your game.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/auth?mode=signup"
              className="flex items-center justify-center gap-2 px-7 py-4 bg-orange text-white text-base font-bold rounded-lg hover:bg-orange/90 active:scale-95 transition-all min-h-[52px]"
              style={{ fontFamily: 'var(--font-display)' }}>
              Start Playing Free →
            </Link>
            <Link href="/watch/demo"
              className="flex items-center justify-center gap-2 px-7 py-4 bg-white border border-border text-navy text-base font-semibold rounded-lg hover:bg-surface transition-colors min-h-[52px]"
              style={{ fontFamily: 'var(--font-display)' }}>
              Watch a live demo
            </Link>
          </div>

          <div className="flex items-center gap-2 mt-5">
            <CheckCircle size={15} className="text-[#00A86B]" />
            <span className="text-sm text-muted">Free forever. No app install for spectators.</span>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-navy py-8 px-4">
        <div className="max-w-screen-xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[{ v: '3', l: 'Sports live' }, { v: '100%', l: 'Free to use' }, { v: '< 3s', l: 'Score update latency' }, { v: '∞', l: 'Matches supported' }].map(s => (
            <div key={s.l} className="text-center">
              <p className="text-2xl font-bold text-lime" style={{ fontFamily: 'var(--font-mono)' }}>{s.v}</p>
              <p className="text-sm text-chalk/60 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sport grid */}
      <section className="px-4 py-16 max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-display)' }}>Pick your sport</h2>
          <span className="text-sm text-muted">6 sports total</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SPORTS.map(s => <SportCard key={s.slug} sport={s} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>How it works</h2>
            <p className="text-muted text-sm">From first tap to final scoreline</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(step => (
              <div key={step.num} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="w-12 h-12 rounded-card bg-surface flex items-center justify-center mb-4">{step.icon}</div>
                <span className="text-xs text-muted mb-1" style={{ fontFamily: 'var(--font-mono)' }}>{step.num}</span>
                <h3 className="text-base font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-4 py-16 max-w-screen-xl mx-auto">
        <div className="bg-navy rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-chalk mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to run your club on Playr?
          </h2>
          <p className="text-chalk/60 mb-8 max-w-md mx-auto text-sm">Free for clubs of any size. Real scores, real stats, real community.</p>
          <Link href="/auth?mode=signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-orange text-white text-base font-bold rounded-lg hover:bg-orange/90 active:scale-95 min-h-[52px]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Start Playing Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logomark size={24} />
            <span className="text-sm font-semibold text-navy" style={{ fontFamily: 'var(--font-display)' }}>Playr</span>
          </div>
          <p className="text-xs text-muted">Your game, recorded.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-muted hover:text-navy">Privacy</Link>
            <Link href="/terms"   className="text-xs text-muted hover:text-navy">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
