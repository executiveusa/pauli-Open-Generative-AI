import Link from 'next/link';

export const metadata = {
  title: 'Dashboard — More-of-Less',
  description: 'AI audio/video studio for non-technical creators',
};

const HERO_CARDS = [
  {
    href: '/mol/music-video',
    title: 'Music Video',
    desc: 'Upload a song, describe a vibe — get a cinematic music video with consistent characters.',
    icon: '🎬',
    span: 'md:col-span-2',
    accent: 'from-violet-600/30 via-violet-900/10 to-transparent',
    border: 'border-violet-800/30',
    tag: 'Most popular',
    tagColor: 'bg-violet-500/20 text-violet-300',
  },
  {
    href: '/mol/visualizer',
    title: 'Visualizer',
    desc: 'Animated waveform, spectrum, or lyrics overlays for any audio.',
    icon: '〰',
    span: 'md:col-span-1',
    accent: 'from-sky-600/20 to-transparent',
    border: 'border-sky-800/30',
    tag: null,
    tagColor: '',
  },
  {
    href: '/mol/mix-master',
    title: 'Mix & Master',
    desc: 'EQ, compression, loudness targeting, stem mixing — studio-grade presets.',
    icon: '🎚',
    span: 'md:col-span-1',
    accent: 'from-emerald-600/20 to-transparent',
    border: 'border-emerald-800/30',
    tag: null,
    tagColor: '',
  },
  {
    href: '/mol/character-lab',
    title: 'Character Lab',
    desc: 'Build Character Passports for consistent faces, wardrobes, and styles across every scene.',
    icon: '👤',
    span: 'md:col-span-2',
    accent: 'from-amber-600/20 via-amber-900/10 to-transparent',
    border: 'border-amber-800/30',
    tag: 'New',
    tagColor: 'bg-amber-500/20 text-amber-300',
  },
];

const STATS = [
  { label: 'Providers', value: '5+' },
  { label: 'Models', value: '200+' },
  { label: 'Formats', value: 'MP4 · GIF · SRT' },
];

export default function Dashboard() {
  return (
    <div className="pb-20 px-4 md:px-8 max-w-6xl mx-auto">

      {/* Hero — asymmetric, left-aligned (Taste-Skill: no centered heroes) */}
      <div className="pt-16 pb-12 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-800/50 bg-violet-950/40 text-violet-300 text-xs tracking-wide mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          AI Creative Studio
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[0.95] text-zinc-100 mb-6">
          More<span className="text-violet-400">-of-</span>Less
          <br />
          <span className="text-zinc-500 text-3xl md:text-5xl font-normal tracking-tight">studio</span>
        </h1>
        <p className="text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed">
          Describe it. Generate it. Iterate. Professional output — no nodes, no seeds, no code.
        </p>

        <div className="flex flex-wrap gap-6 mt-8">
          {STATS.map(s => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="text-xl font-semibold text-zinc-100 tracking-tight">{s.value}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bento 2.0 grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {HERO_CARDS.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className={[
              'group relative flex flex-col justify-between gap-6 p-6 md:p-8',
              'rounded-2xl border overflow-hidden',
              'bg-gradient-to-br', card.accent, card.border,
              'hover:border-opacity-60 transition-all duration-300 ease-out',
              'hover:scale-[1.015] hover:shadow-2xl hover:shadow-black/40',
              card.span,
            ].join(' ')}
          >
            {card.tag && (
              <span className={`absolute top-4 right-4 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full ${card.tagColor}`}>
                {card.tag}
              </span>
            )}
            <div className="flex flex-col gap-3">
              <span className="text-3xl">{card.icon}</span>
              <div>
                <h2 className="font-semibold text-zinc-100 text-lg mb-1 tracking-tight">{card.title}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">{card.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">Open →</span>
              <div className="h-px flex-1 mx-3 bg-zinc-800 group-hover:bg-zinc-700 transition-colors" />
            </div>
          </Link>
        ))}

        <Link
          href="/mol/workflow-monitor"
          className="group flex flex-col justify-between gap-4 p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700/60 transition-all duration-300 md:col-span-1"
        >
          <div>
            <span className="text-2xl mb-3 block">📡</span>
            <h2 className="font-medium text-zinc-200 mb-1">Job Monitor</h2>
            <p className="text-sm text-zinc-500">Track any job in real-time via SSE.</p>
          </div>
          <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">Open →</span>
        </Link>
      </div>
    </div>
  );
}
