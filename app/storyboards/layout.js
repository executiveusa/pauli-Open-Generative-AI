/**
 * Storyboard routes layout — server component.
 */
export const metadata = {
  title: 'Storyboards — Cynthia Studio',
  description: 'Plan and manage cinematic shot sequences for LatAm productions.',
};

export default function StoryboardLayout({ children }) {
  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100">
      {children}
    </div>
  );
}
