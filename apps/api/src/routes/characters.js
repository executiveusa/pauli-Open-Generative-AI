import { json, apiError, readJson } from '../middleware.js';
import { makeCharacterPassport, validatePassport } from '../../../../packages/shared/src/character/passport.js';
import * as db from '../db/repository.js';

export function registerCharacters(router) {
  // POST /v1/characters
  router.post('/v1/characters', async (req, res) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }

    const passport = makeCharacterPassport({
      ...body,
      ownerUserId: body.ownerUserId ?? 'local-user',
    });

    const { valid, errors } = validatePassport(passport);
    if (!valid) return apiError(res, 400, 'validation_error', 'Invalid character passport', errors);

    await db.characters.put(passport.id, passport);
    json(res, 201, passport);
  });

  // GET /v1/characters/:id
  router.get('/v1/characters/:id', async (req, res, params) => {
    const c = await db.characters.get(params.id);
    if (!c) return apiError(res, 404, 'not_found', `Character ${params.id} not found`);
    json(res, 200, c);
  });

  // GET /v1/projects/:id/characters
  router.get('/v1/projects/:id/characters', async (req, res, params) => {
    const items = await db.characters.list(c => c.projectId === params.id);
    json(res, 200, { items, total: items.length });
  });

  // PATCH /v1/characters/:id
  router.patch('/v1/characters/:id', async (req, res, params) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }
    const updated = await db.characters.patch(params.id, body);
    if (!updated) return apiError(res, 404, 'not_found', `Character ${params.id} not found`);
    json(res, 200, updated);
  });
}
