import { redirect } from 'next/navigation';

export default function Home() {
  const dest = process.env.NEXT_PUBLIC_ROOT_REDIRECT ?? '/landing';
  redirect(dest.startsWith('/') ? dest : `/${dest}`);
}
