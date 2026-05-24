/**
 * Auth.js / NextAuth options for Cynthia Studio.
 * Supports email/password (credentials) + optional Google OAuth.
 * Session carries user id, default org, and memberships.
 *
 * Uses lazy imports to avoid top-level await — compatible with
 * both CJS and ESM module contexts.
 */

import CredentialsProvider from 'next-auth/providers/credentials';

const providers = [
  // Email/password credentials
  CredentialsProvider({
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      // LOCAL_DEV_AUTH: accept any credentials in dev
      if (process.env.LOCAL_DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
        return {
          id: process.env.DEV_USER_ID ?? 'dev-user-seed',
          email: credentials.email,
          name: 'Dev User',
          defaultOrganizationId: process.env.DEV_ORG_ID ?? 'dev-org-seed',
          memberships: [
            {
              organizationId: process.env.DEV_ORG_ID ?? 'dev-org-seed',
              role: 'admin',
              defaultWorkspaceId: process.env.DEV_WORKSPACE_ID ?? null,
            },
          ],
        };
      }

      // Production: look up user in DB
      try {
        const { prisma } = await import('@/lib/db/client.js');
        const { verifyPassword } = await import('@/lib/auth/password.js');

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            memberships: {
              where: { acceptedAt: { not: null } },
              select: { organizationId: true, workspaceId: true, role: true },
            },
          },
        });

        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          defaultOrganizationId: user.memberships[0]?.organizationId ?? null,
          memberships: user.memberships,
        };
      } catch (err) {
        console.error('[auth] authorize error:', err.message);
        return null;
      }
    },
  }),
];

// Conditionally add Google provider at runtime if env vars are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Dynamic require to keep this file CJS-compatible
  try {
    const GoogleProvider = (await import('next-auth/providers/google')).default;
    providers.unshift(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    );
  } catch { /* Google provider not available */ }
}

export const authOptions = {
  // Prisma adapter wired lazily in getServerSession calls — skip here
  // to avoid top-level await. Add adapter in a server-only init file
  // if database sessions are required.

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.defaultOrganizationId = user.defaultOrganizationId;
        token.memberships = user.memberships ?? [];
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.defaultOrganizationId = token.defaultOrganizationId;
      session.user.memberships = token.memberships ?? [];
      return session;
    },
  },
};
