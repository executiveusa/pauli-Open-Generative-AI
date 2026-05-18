import { json, apiError, readJson } from '../middleware.js';
import { makeProject } from '../../../../packages/shared/src/types/core.js';
import * as db from '../db/repository.js';

export function registerProjects(router) {
  // POST /v1/projects
  router.post('/v1/projects', async (req, res) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }

    if (!body.name) return apiError(res, 400, 'validation_error', 'name is required');

    const project = makeProject({
      ownerUserId: body.ownerUserId ?? 'local-user',
      name: body.name,
      brandId: body.brandId ?? null,
    });

    await db.projects.put(project.id, project);
    json(res, 201, project);
  });

  // GET /v1/projects
  router.get('/v1/projects', async (_req, res) => {
    const items = await db.projects.list();
    json(res, 200, { items, total: items.length });
  });

  // GET /v1/projects/:id
  router.get('/v1/projects/:id', async (req, res, params) => {
    const project = await db.projects.get(params.id);
    if (!project) return apiError(res, 404, 'not_found', `Project ${params.id} not found`);
    json(res, 200, project);
  });

  // PATCH /v1/projects/:id
  router.patch('/v1/projects/:id', async (req, res, params) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }
    const updated = await db.projects.patch(params.id, { name: body.name, brandId: body.brandId });
    if (!updated) return apiError(res, 404, 'not_found', `Project ${params.id} not found`);
    json(res, 200, updated);
  });
}
