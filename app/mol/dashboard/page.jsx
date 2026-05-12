import Link from 'next/link';

export const metadata = { title: 'Dashboard — More-of-Less' };

const CARDS = [
  {
    href: '/mol/music-video',
    title: 'Music Video',
    desc: 'Upload a song and generate a full cinematic music video with consistent characters.',
    icon: '🎬',
    accent: 'from-violet-600/20 to-violet-500/5',
    border: 'border-violet-900/40',
  },
  {
    href: '/mol/visualizer',
    title: 'Visualizer',
    desc: 'Create animated waveform, spectrum, or lyrics visualizers for any song.',
    icon: '〰️',
    accent: 'from-blue-600/20 to-blue-500/5',
    border: 'border-blue-900/40',
  },
  {
    href: '/mol/mix-master',
    title: 'Mix & Master',
    desc: 'Upload stems or a track. Apply EQ, compression, and mastering presets.',
    icon: '🎚',
    accent: 'from-emerald-600/20 to-emerald-500/5',
    border: 'border-emerald-900/40',
  },
  {
    href: '/mol/character-lab',
    title: 'Character Lab',
    desc: 'Build and save consistent characters to use across all your videos.',
    icon: '👤',
    accent: 'from-amber-600/20 to-amber-500/5',
    border: 'border-amber-900/40',
  },
];

export default function Dashboard() {
  return (
    <div className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
      {/* Asymmetric hero — Taste-Skill: no centered hero */}
      <div className="mb-16 max-w-2xl">
        <p className="text-xs tracking-widest text-zinc-500 uppercase mb-4">AI Creative Studio</p>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter leading-none text-zinc-100 mb-6">
          More<span className="text-violet-400">-of-</span>Less
        </h1>
        <p className="text-lg text-zinc-400 max-w-lg leading-relaxed">
          Describe it. Generate it. Iterate it. Professional audio/video output — no nodes, no seeds, no code.
        </p>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className={[
              'group relative flex flex-col gap-4 p-6 rounded-2xl border overflow-hidden',
              'bg-gradient-to-br',
              card.accent,
              card.border,
              'hover:border-opacity-80 transition-all duration-300',
              'hover:scale-[1.01] hover:shadow-xl hover:shadow-black/30',
            ].join(' ')}
          >
            <span className="text-3xl">{card.icon}</span>
            <div>
              <h2 className="font-medium text-zinc-100 mb-1">{card.title}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{card.desc}</p>
            </div>
            <span className="absolute bottom-5 right-5 text-zinc-600 group-hover:text-zinc-400 transition-colors text-xl">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
