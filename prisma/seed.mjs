/**
 * Development seed — creates a local org, workspace, and admin user.
 * Run: npm run db:seed
 *
 * Uses LOCAL_DEV_AUTH credentials from .env.example defaults.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEV_ORG_ID = 'dev-org-seed';
const DEV_USER_ID = 'dev-user-seed';
const DEV_WORKSPACE_ID = 'dev-workspace-seed';

async function main() {
  console.log('[seed] Seeding development data...');

  // Create dev user
  const user = await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: {
      id: DEV_USER_ID,
      email: 'dev@cynthia.studio',
      name: 'Dev Admin',
      emailVerified: new Date(),
    },
  });

  // Create dev org
  const org = await prisma.organization.upsert({
    where: { id: DEV_ORG_ID },
    update: {},
    create: {
      id: DEV_ORG_ID,
      slug: 'dev-org',
      name: 'Dev Organization',
      displayName: 'Cynthia Studio Dev',
      country: 'MX',
      locale: 'es',
      ownerId: DEV_USER_ID,
    },
  });

  // Create dev workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: DEV_WORKSPACE_ID },
    update: {},
    create: {
      id: DEV_WORKSPACE_ID,
      organizationId: DEV_ORG_ID,
      name: 'Main Workspace',
      slug: 'main',
    },
  });

  // Create membership
  await prisma.membership.upsert({
    where: {
      userId_organizationId_workspaceId: {
        userId: DEV_USER_ID,
        organizationId: DEV_ORG_ID,
        workspaceId: null,
      },
    },
    update: {},
    create: {
      userId: DEV_USER_ID,
      organizationId: DEV_ORG_ID,
      workspaceId: null,
      role: 'owner',
      acceptedAt: new Date(),
    },
  });

  // Create billing account
  await prisma.billingAccount.upsert({
    where: { organizationId: DEV_ORG_ID },
    update: {},
    create: {
      organizationId: DEV_ORG_ID,
      plan: 'dev',
      monthlyBudgetUsd: 50,
    },
  });

  console.log('[seed] Done.');
  console.log(`  User: ${user.email} (id: ${user.id})`);
  console.log(`  Org:  ${org.name} (id: ${org.id})`);
  console.log(`  Workspace: ${workspace.name} (id: ${workspace.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
