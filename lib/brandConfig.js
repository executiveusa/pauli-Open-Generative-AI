/**
 * White-label brand configuration.
 * Override via NEXT_PUBLIC_BRAND_* env vars for tenant builds.
 */
export const brand = {
  name:        process.env.NEXT_PUBLIC_BRAND_NAME        ?? 'More-of-Less',
  tagline:     process.env.NEXT_PUBLIC_BRAND_TAGLINE     ?? 'AI Creative Studio',
  description: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ?? 'AI audio/video studio for non-technical creators',
  accentColor: process.env.NEXT_PUBLIC_BRAND_ACCENT      ?? 'violet',
  logoText:    process.env.NEXT_PUBLIC_BRAND_LOGO_TEXT   ?? 'More<span>-of-</span>Less',
  rootRedirect: process.env.NEXT_PUBLIC_ROOT_REDIRECT    ?? '/mol/dashboard',
  apiBase:     process.env.NEXT_PUBLIC_API_BASE_URL      ?? 'http://localhost:8000',
};
