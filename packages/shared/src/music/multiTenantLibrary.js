/**
 * Multi-tenant artifact library and sharing system.
 * Manages access, permissions, and collaboration for music artifacts.
 */

import { newId, now } from '../types/core.js';

export const ARTIFACT_VISIBILITY = {
  PRIVATE: 'private',
  WORKSPACE: 'workspace',
  ORGANIZATION: 'organization',
  PUBLIC: 'public',
};

export const SHARE_PERMISSIONS = {
  VIEW: 'view',
  COMMENT: 'comment',
  REMIX: 'remix',
  EDIT: 'edit',
};

/**
 * Create an artifact library entry
 */
export function makeArtifactLibraryEntry(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('libentry'),
    artifactId: partial.artifactId ?? '',
    organizationId: partial.organizationId ?? '',
    workspaceId: partial.workspaceId ?? '',
    ownerId: partial.ownerId ?? '',

    title: partial.title ?? '',
    description: partial.description ?? '',
    tags: partial.tags ?? [],
    category: partial.category ?? '',

    visibility: partial.visibility ?? ARTIFACT_VISIBILITY.PRIVATE,
    featured: partial.featured ?? false,
    endorsedByOrganization: partial.endorsedByOrganization ?? false,

    accessControl: partial.accessControl ?? {},
    sharedWith: partial.sharedWith ?? [],

    viewCount: partial.viewCount ?? 0,
    remixCount: partial.remixCount ?? 0,
    favoriteCount: partial.favoriteCount ?? 0,

    metadata: partial.metadata ?? {},

    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * Create a share permission record
 */
export function makeSharePermission(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('sharep'),
    artifactId: partial.artifactId ?? '',
    sharedByUserId: partial.sharedByUserId ?? '',
    sharedWithUserId: partial.sharedWithUserId ?? '',
    sharedWithTeamId: partial.sharedWithTeamId ?? null,

    permission: partial.permission ?? SHARE_PERMISSIONS.VIEW,
    expiresAt: partial.expiresAt ?? null,
    canForward: partial.canForward ?? false,

    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * Check user access to artifact
 */
export function checkArtifactAccess(artifact, libraryEntry, userId, userTeamIds = []) {
  const { visibility, sharedWith, ownerId } = libraryEntry;

  // Owner always has access
  if (ownerId === userId) {
    return {
      hasAccess: true,
      permission: SHARE_PERMISSIONS.EDIT,
      reason: 'owner',
    };
  }

  // Check visibility level
  switch (visibility) {
    case ARTIFACT_VISIBILITY.PRIVATE:
      // Check share list
      const shareRecord = sharedWith?.find(s => s.userId === userId);
      if (shareRecord) {
        return {
          hasAccess: true,
          permission: shareRecord.permission,
          reason: 'shared',
        };
      }
      return { hasAccess: false, permission: null, reason: 'private' };

    case ARTIFACT_VISIBILITY.WORKSPACE:
      // Organization users can view
      return {
        hasAccess: true,
        permission: SHARE_PERMISSIONS.VIEW,
        reason: 'workspace_member',
      };

    case ARTIFACT_VISIBILITY.ORGANIZATION:
      // Organization members can view
      return {
        hasAccess: true,
        permission: SHARE_PERMISSIONS.VIEW,
        reason: 'organization_member',
      };

    case ARTIFACT_VISIBILITY.PUBLIC:
      // Anyone can view
      return {
        hasAccess: true,
        permission: SHARE_PERMISSIONS.VIEW,
        reason: 'public',
      };

    default:
      return { hasAccess: false, permission: null, reason: 'unknown' };
  }
}

/**
 * Create remix artifact entry (derived from another)
 */
export function makeRemixArtifact(baseArtifact, remixArtifact, partial = {}) {
  return {
    ...remixArtifact,
    metadata: {
      ...remixArtifact.metadata,
      baseArtifactId: baseArtifact.id,
      baseArtifactTitle: baseArtifact.title,
      baseArtifactOwner: baseArtifact.createdByUserId,
      remixedAt: now(),
    },
  };
}

/**
 * Get library filters/categories
 */
export function getLibraryCategories() {
  return {
    genre: ['electronic', 'hip-hop', 'jazz', 'ambient', 'classical', 'pop', 'rock', 'lo-fi'],
    mood: ['energetic', 'calm', 'dark', 'happy', 'melancholic', 'cinematic'],
    mode: ['simple', 'instrumental', 'lyrics', 'cover', 'remix'],
    userType: ['mine', 'shared_with_me', 'featured', 'trending'],
  };
}

/**
 * Filter artifacts by tags
 */
export function filterArtifactsByTags(artifacts, selectedTags) {
  if (selectedTags.length === 0) return artifacts;

  return artifacts.filter(entry =>
    selectedTags.some(tag => entry.tags?.includes(tag))
  );
}

/**
 * Sort artifacts by metric
 */
export function sortArtifacts(artifacts, sortBy = 'recent') {
  const sorted = [...artifacts];

  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'popular':
      return sorted.sort((a, b) => b.viewCount - a.viewCount);
    case 'remixed':
      return sorted.sort((a, b) => b.remixCount - a.remixCount);
    case 'favorited':
      return sorted.sort((a, b) => b.favoriteCount - a.favoriteCount);
    case 'trending':
      return sorted.sort((a, b) => {
        const scoreA = b.viewCount + b.remixCount * 2 + b.favoriteCount * 3;
        const scoreB = a.viewCount + a.remixCount * 2 + a.favoriteCount * 3;
        return scoreB - scoreA;
      });
    default:
      return sorted;
  }
}

/**
 * Get sharing recommendations for organization
 */
export function getSharingRecommendations(artifact, organizationSize = 10) {
  const recommendations = [];

  if (!artifact.visibility || artifact.visibility === 'private') {
    recommendations.push({
      type: 'increase_visibility',
      title: 'Share with workspace',
      description: 'Let your team members discover and remix your music',
      action: 'Update visibility to "Workspace"',
    });
  }

  if (artifact.viewCount > 5 && !artifact.featured) {
    recommendations.push({
      type: 'feature_request',
      title: 'Consider featuring',
      description: 'This artifact is popular - consider requesting organization feature',
      action: 'Request organization feature',
    });
  }

  if (organizationSize > 5 && artifact.visibility !== 'public') {
    recommendations.push({
      type: 'public_share',
      title: 'Share publicly',
      description: 'Sharing high-quality music publicly grows the community',
      action: 'Change visibility to "Public"',
    });
  }

  return recommendations;
}

/**
 * Build artifact library URL
 */
export function buildArtifactShareUrl(artifact, baseUrl = '') {
  return `${baseUrl}/music/artifacts/${artifact.id}`;
}

/**
 * Get featured artifacts for locale
 */
export function getFeaturedArtifacts(allArtifacts, locale = 'en', limit = 5) {
  return allArtifacts
    .filter(entry => entry.featured || entry.endorsedByOrganization)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, limit);
}

/**
 * Get trending artifacts (last 7 days)
 */
export function getTrendingArtifacts(allArtifacts, days = 7, limit = 10) {
  const cutoffDate = new Date(now() - days * 24 * 60 * 60 * 1000);

  return allArtifacts
    .filter(entry => new Date(entry.createdAt) > cutoffDate)
    .sort((a, b) => {
      const scoreA = a.viewCount + a.remixCount * 2 + a.favoriteCount * 3;
      const scoreB = b.viewCount + b.remixCount * 2 + b.favoriteCount * 3;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}
