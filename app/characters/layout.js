import Link from 'next/link';

export const metadata = {
  title: 'Character Passports — Cynthia Studio',
  description: 'Manage AI character identities for consistent LatAm production',
};

/**
 * Server component layout for /characters routes.
 */
export default function CharactersLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-40 flex items-center gap-3 px-4 md:px-6 h-14 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <Link
          href="/mol/dashboard"
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <span aria-hidden="true">←</span>
          <span>Dashboard</span>
        </Link>

        <span className="text-zinc-700 select-none">/</span>

        <Link
          href="/characters"
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-100 hover:text-violet-300 transition-colors"
        >
          <span>Character Passports</span>
        </Link>
      </header>

      {/* Page content */}
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
}
