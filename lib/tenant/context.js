/**
 * Tenant context — extracts and validates tenant identity for every request.
 * Every API route must call requireTenantContext() before touching data.
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options.js';

/**
 * Resolves tenant context from a Next.js request.
 * Returns { user, organizationId, workspaceId, role } or throws.
 *
 * @param {Request} request - Next.js Request object
 * @returns {Promise<TenantContext>}
 */
export async function resolveTenantContext(request) {
  // Allow dev bypass ONLY in local dev mode — never in production
  if (process.env.LOCAL_DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    return {
      userId: process.env.DEV_USER_ID ?? 'dev-user-seed',
      organizationId: process.env.DEV_ORG_ID ?? 'dev-org-seed',
      workspaceId: process.env.DEV_WORKSPACE_ID ?? null,
      role: 'admin',
      isDevBypass: true,
    };
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    err.code = 'unauthorized';
    throw err;
  }

  // Organization comes from header (set by client on tenant switch)
  // or from session default org
  const orgId =
    request.headers.get('x-organization-id') ||
    session.user.defaultOrganizationId;

  if (!orgId) {
    const err = new Error('No organization selected');
    err.statusCode = 400;
    err.code = 'no_organization';
    throw err;
  }

  // Verify membership — membership check is cached in session
  const membership = session.user.memberships?.find(
    (m) => m.organizationId === orgId
  );

  if (!membership) {
    const err = new Error('You are not a member of this organization');
    err.statusCode = 403;
    err.code = 'forbidden';
    throw err;
  }

  const workspaceId =
    request.headers.get('x-workspace-id') ||
    membership.defaultWorkspaceId ||
    null;

  return {
    userId: session.user.id,
    organizationId: orgId,
    workspaceId,
    role: membership.role,
    isDevBypass: false,
  };
}

/**
 * Require tenant context — throws structured errors on failure.
 * Use in every API route handler.
 */
export async function requireTenantContext(request) {
  return resolveTenantContext(request);
}

/**
 * Assert that the requesting user has at least the specified role.
 * Role order: viewer < client < reviewer < editor < producer < admin < owner
 */
const ROLE_RANK = {
  viewer: 0,
  client: 1,
  reviewer: 2,
  editor: 3,
  producer: 4,
  admin: 5,
  owner: 6,
};

export function requireRole(ctx, minimumRole) {
  const userRank = ROLE_RANK[ctx.role] ?? 0;
  const requiredRank = ROLE_RANK[minimumRole] ?? 0;
  if (userRank < requiredRank) {
    const err = new Error(`Role '${minimumRole}' required, you have '${ctx.role}'`);
    err.statusCode = 403;
    err.code = 'insufficient_role';
    throw err;
  }
}

/**
 * Assert that a resource belongs to the tenant making the request.
 * Pass the organizationId field from the loaded resource.
 */
export function requireTenantOwnership(ctx, resourceOrganizationId) {
  if (resourceOrganizationId !== ctx.organizationId) {
    const err = new Error('Resource not found');
    err.statusCode = 404;
    err.code = 'not_found';
    throw err;
  }
}

/**
 * Wraps a Next.js Route Handler with automatic tenant context resolution.
 * Attaches ctx to the request object and handles auth errors.
 *
 * Usage:
 *   export const GET = withTenantContext(async (req, ctx, params) => { ... });
 */
export function withTenantContext(handler) {
  return async function (request, { params } = {}) {
    let ctx;
    try {
      ctx = await requireTenantContext(request);
    } catch (err) {
      return Response.json(
        { error: err.code ?? 'auth_error', message: err.message },
        { status: err.statusCode ?? 401 }
      );
    }

    try {
      return await handler(request, ctx, params);
    } catch (err) {
      const code = err.statusCode ?? 500;
      const redacted = redactSecrets(err.message ?? 'Internal error');
      if (code >= 500) {
        console.error('[api]', redacted, err.stack);
      }
      return Response.json(
        { error: err.code ?? 'internal_error', message: redacted },
        { status: code }
      );
    }
  };
}

function redactSecrets(s) {
  return String(s ?? '').replace(
    /(sk-[A-Za-z0-9_-]+|hf_[A-Za-z0-9]+|fal_[A-Za-z0-9_-]+|nvapi-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9]+|AKIA[0-9A-Z]{16}|Bearer\s+[A-Za-z0-9._-]+)/gi,
    '[REDACTED]'
  );
}
