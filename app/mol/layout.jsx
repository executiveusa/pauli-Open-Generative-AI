import { Geist } from 'next/font/google';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata = {
  title: 'More-of-Less — AI Creative Studio',
  description: 'AI audio/video studio for non-technical creators',
};

export default function MolLayout({ children }) {
  return (
    <div className={`${geist.variable} min-h-[100dvh] bg-zinc-950 text-zinc-100 font-[family-name:var(--font-geist)]`}>
      <MolNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function MolNav() {
  const links = [
    { href: '/mol/dashboard',        label: 'Dashboard'      },
    { href: '/mol/music-video',      label: 'Music Video'    },
    { href: '/mol/visualizer',       label: 'Visualizer'     },
    { href: '/mol/mix-master',       label: 'Mix & Master'   },
    { href: '/mol/character-lab',    label: 'Character Lab'  },
    { href: '/mol/workflow-monitor', label: 'Monitor'        },
  ];
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center gap-1 px-6 py-3 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
      <a href="/mol/dashboard" className="mr-4 font-semibold tracking-tight text-zinc-100">
        More<span className="text-violet-400">-of-</span>Less
      </a>
      <div className="flex gap-1">
        {links.map(l => (
          <a key={l.href} href={l.href}
            className="px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
