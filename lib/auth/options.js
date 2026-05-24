/**
 * Auth.js / NextAuth options for Cynthia Studio.
 * Supports email/password (credentials) + OAuth providers.
 * Session carries user id, default org, and memberships.
 */

import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

// Prisma adapter is wired here when DATABASE_URL is set
// If no DATABASE_URL (local dev without DB), use JWT-only fallback
let prismaAdapter = null;
try {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    const { PrismaAdapter } = await import('@auth/prisma-adapter');
    const { prisma } = await import('@/lib/db/client.js');
    prismaAdapter = PrismaAdapter(prisma);
  }
} catch {
  // DB not available — JWT-only mode
}

export const authOptions = {
  adapter: prismaAdapter,

  session: {
    strategy: prismaAdapter ? 'database' : 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    // Google OAuth (optional — only active if GOOGLE_CLIENT_ID is set)
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Email/password credentials (dev + production)
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // LOCAL_DEV_AUTH: accept any login with seed user
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
                select: {
                  organizationId: true,
                  workspaceId: true,
                  role: true,
                },
              },
            },
          });

          if (!user) return null;

          const pwHash = user.passwordHash;
          if (!pwHash) return null;

          const valid = await verifyPassword(credentials.password, pwHash);
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
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.defaultOrganizationId = user.defaultOrganizationId;
        token.memberships = user.memberships ?? [];
      }
      return token;
    },

    async session({ session, token, user }) {
      if (token) {
        // JWT strategy
        session.user.id = token.userId;
        session.user.defaultOrganizationId = token.defaultOrganizationId;
        session.user.memberships = token.memberships ?? [];
      } else if (user) {
        // Database strategy
        session.user.id = user.id;
        try {
          const { prisma } = await import('@/lib/db/client.js');
          const memberships = await prisma.membership.findMany({
            where: { userId: user.id, acceptedAt: { not: null } },
            select: { organizationId: true, workspaceId: true, role: true },
          });
          session.user.memberships = memberships;
          session.user.defaultOrganizationId = memberships[0]?.organizationId ?? null;
        } catch {
          session.user.memberships = [];
        }
      }
      return session;
    },
  },
};
