'use client';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

const NAV_LINKS = [
  { href: '/mol/dashboard',          label: 'Dashboard'       },
  { href: '/characters',             label: 'Characters'      },
  { href: '/mol/cine-studio',        label: 'Cine Studio'     },
  { href: '/mol/hero-frame',         label: 'Hero Frame'      },
  { href: '/storyboards',            label: 'Storyboards'     },
  { href: '/mol/talking-character',  label: 'Talking'         },
  { href: '/mol/jobs',               label: 'Jobs'            },
  { href: '/mol/music-video',        label: 'Music Video'     },
  { href: '/mol/mix-master',         label: 'Mix & Master'    },
  { href: '/settings/providers',     label: 'Providers'       },
];

export default function MolLayout({ children }) {
  return (
    <div className={`${geist.variable} min-h-[100dvh] bg-zinc-950 text-zinc-100 font-[family-name:var(--font-geist)]`}>
      <MolNav />
      <main className="pt-14 flex-1">{children}</main>
    </div>
  );
}

function MolNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center gap-1 px-4 md:px-6 h-14 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
      <Link href="/mol/dashboard" className="mr-5 flex items-center gap-1.5 font-semibold tracking-tight text-zinc-100 shrink-0">
        <span className="h-5 w-5 rounded bg-violet-500 inline-block" />
        More<span className="text-violet-400">-of-</span>Less
      </Link>
      <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
        {NAV_LINKS.map(l => {
          const active = pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href}
              className={[
                'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
                active
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
              ].join(' ')}>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
