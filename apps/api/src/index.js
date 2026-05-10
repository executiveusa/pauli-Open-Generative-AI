import http from 'node:http';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const storageRoot = process.env.STORAGE_ROOT || './storage';
const db = { projects:new Map(), assets:new Map(), characters:new Map(), jobs:new Map(), events:new Map() };

const now = () => new Date().toISOString();
const send = (res, code, payload) => { res.writeHead(code, {'Content-Type':'application/json'}); res.end(JSON.stringify(payload)); };
const bad = (res, message, details) => send(res, 400, { error:{ code:'bad_request', message, details } });
const readJson = req => new Promise((resolve,reject)=>{ let d=''; req.on('data',c=>d+=c); req.on('end',()=>{ try{ resolve(d?JSON.parse(d):{});}catch(e){reject(e);} });});
const ensureJobDirs = (projectId, jobId) => {
  const base = path.join(storageRoot, 'projects', projectId, 'jobs', jobId);
  ['','logs','artifacts/audio','artifacts/video','artifacts/prompts','artifacts/subtitles','artifacts/thumbnails','artifacts/exports'].forEach(p=>fs.mkdirSync(path.join(base,p), { recursive:true }));
  return base;
};
const pushEvent = (jobId, message, stage='info') => {
  const list = db.events.get(jobId) || [];
  list.push({ id: `evt_${randomUUID()}`, at: now(), stage, message });
  db.events.set(jobId, list);
};

function createJob(type, input) {
  const id = `job_${randomUUID()}`;
  const projectId = input.projectId || 'project_unknown';
  const job = { id, projectId, ownerUserId: input.ownerUserId || 'local-user', type, status:'created', progress:0, stage:'created', input, artifacts:[], error:null, createdAt:now(), updatedAt:now() };
  db.jobs.set(id, job);
  const folder = ensureJobDirs(projectId, id);
  fs.writeFileSync(path.join(folder, 'input.json'), JSON.stringify(input, null, 2));
  fs.writeFileSync(path.join(folder, 'status.json'), JSON.stringify(job, null, 2));
  pushEvent(id, `Job created for ${type}`, 'created');
  return job;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok:true, service:'more-of-less-api', time: now() });

    if (req.method === 'POST' && url.pathname === '/v1/projects') {
      const body = await readJson(req);
      if (!body.name) return bad(res, 'name is required');
      const id = `project_${randomUUID()}`;
      const p = { id, ownerUserId: body.ownerUserId || 'local-user', name: body.name, brandId: body.brandId, createdAt: now(), updatedAt: now() };
      db.projects.set(id, p);
      fs.mkdirSync(path.join(storageRoot, 'projects', id), { recursive:true });
      fs.writeFileSync(path.join(storageRoot, 'projects', id, 'project.json'), JSON.stringify(p, null, 2));
      return send(res, 201, p);
    }
    if (req.method === 'GET' && url.pathname === '/v1/projects') return send(res, 200, { items:[...db.projects.values()] });
    if (req.method === 'GET' && url.pathname.startsWith('/v1/projects/')) {
      const parts = url.pathname.split('/').filter(Boolean);
      const projectId = parts[2];
      if (parts.length === 3) return db.projects.get(projectId) ? send(res,200,db.projects.get(projectId)) : send(res,404,{error:{code:'not_found',message:'project not found'}});
      if (parts[3] === 'assets') return send(res,200,{items:[...db.assets.values()].filter(a=>a.projectId===projectId)});
      if (parts[3] === 'characters') return send(res,200,{items:[...db.characters.values()].filter(c=>c.projectId===projectId)});
    }

    if (req.method === 'POST' && url.pathname === '/v1/assets/upload') {
      const body = await readJson(req);
      if (!body.projectId || !body.originalFilename) return bad(res, 'projectId and originalFilename are required');
      const id = `asset_${randomUUID()}`;
      const asset = { id, projectId: body.projectId, ownerUserId: body.ownerUserId || 'local-user', kind: body.kind || 'other', originalFilename: body.originalFilename, mimeType: body.mimeType || 'application/octet-stream', storagePath: body.storagePath || '', sha256: body.sha256 || '', durationSeconds: body.durationSeconds, width: body.width, height: body.height, createdAt: now(), provenance: body.provenance || { source:'user-upload', rightsStatus:'unknown' } };
      db.assets.set(id, asset);
      return send(res, 201, asset);
    }
    if (req.method === 'GET' && url.pathname.startsWith('/v1/assets/')) {
      const id = url.pathname.split('/')[3];
      return db.assets.get(id) ? send(res,200,db.assets.get(id)) : send(res,404,{error:{code:'not_found',message:'asset not found'}});
    }

    if (req.method === 'POST' && url.pathname === '/v1/characters') {
      const body = await readJson(req);
      if (!body.displayName || !body.ownerUserId) return bad(res, 'displayName and ownerUserId are required');
      const id = `character_${randomUUID()}`;
      const c = { id, ...body, createdAt: now(), updatedAt: now() };
      db.characters.set(id, c);
      return send(res, 201, c);
    }
    if (req.method === 'PATCH' && url.pathname.startsWith('/v1/characters/')) {
      const id = url.pathname.split('/')[3];
      const cur = db.characters.get(id); if (!cur) return send(res,404,{error:{code:'not_found',message:'character not found'}});
      const body = await readJson(req); const next = { ...cur, ...body, updatedAt: now() }; db.characters.set(id, next); return send(res,200,next);
    }
    if (req.method === 'GET' && url.pathname.startsWith('/v1/characters/')) {
      const id = url.pathname.split('/')[3];
      return db.characters.get(id) ? send(res,200,db.characters.get(id)) : send(res,404,{error:{code:'not_found',message:'character not found'}});
    }

    const jobRoutes = ['/v1/jobs/music-video','/v1/jobs/visualizer','/v1/jobs/mix-master','/v1/jobs/autotune'];
    if (req.method === 'POST' && jobRoutes.includes(url.pathname)) {
      const body = await readJson(req);
      const type = url.pathname.split('/').pop();
      return send(res, 202, createJob(type, body));
    }
    if (req.method === 'GET' && /^\/v1\/jobs\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split('/')[3]; const job = db.jobs.get(id);
      return job ? send(res,200,job) : send(res,404,{error:{code:'not_found',message:'job not found'}});
    }
    if (req.method === 'GET' && /^\/v1\/jobs\/[^/]+\/events$/.test(url.pathname)) {
      const id = url.pathname.split('/')[3]; return send(res,200,{items:db.events.get(id)||[]});
    }
    if (req.method === 'POST' && /^\/v1\/jobs\/[^/]+\/cancel$/.test(url.pathname)) {
      const id = url.pathname.split('/')[3]; const job = db.jobs.get(id); if (!job) return send(res,404,{error:{code:'not_found',message:'job not found'}});
      job.status='cancelled'; job.updatedAt=now(); pushEvent(id,'Job cancelled','cancelled'); return send(res,200,job);
    }
    if (req.method === 'POST' && /^\/v1\/jobs\/[^/]+\/remake$/.test(url.pathname)) {
      const id = url.pathname.split('/')[3]; const job = db.jobs.get(id); if (!job) return send(res,404,{error:{code:'not_found',message:'job not found'}});
      const body = await readJson(req); job.stage='remake'; job.updatedAt=now(); pushEvent(id,`Remake requested for scenes: ${(body.sceneIds||[]).join(',')}`,'running'); return send(res,202,job);
    }

    if (req.method === 'POST' && /^\/v1\/jobs\/music-video\/[^/]+\/(generate-scenes|render)$/.test(url.pathname)) {
      const parts = url.pathname.split('/'); const id = parts[4]; const action = parts[5]; const job = db.jobs.get(id); if (!job) return send(res,404,{error:{code:'not_found',message:'job not found'}});
      job.status='running'; job.stage=action; job.updatedAt=now(); pushEvent(id,`Music-video ${action} started`,'running'); return send(res,202,job);
    }

    if (req.method === 'GET' && url.pathname === '/v1/providers') {
      return send(res,200,{items:[
        {provider:'local',enabled:true},{provider:'huggingface',enabled:process.env.HF_ENABLED==='true'},{provider:'comfyui',enabled:process.env.COMFYUI_ENABLED==='true'},{provider:'fal',enabled:process.env.FAL_ENABLED==='true'},{provider:'muapi',enabled:process.env.MUAPI_ENABLED==='true'},{provider:'stub',enabled:true}
      ]});
    }
    if (req.method === 'POST' && url.pathname === '/v1/admin/providers/test') {
      const body = await readJson(req);
      if (req.headers['x-admin-token'] !== (process.env.ADMIN_TOKEN || 'dev-admin-token')) return send(res,403,{error:{code:'forbidden',message:'admin token required'}});
      return send(res,200,{ok:true,provider:body.provider || 'unknown',message:'provider test stub ok'});
    }

    return send(res, 404, { error:{code:'not_found',message:'route not found'} });
  } catch (err) {
    return send(res, 500, { error:{ code:'internal_error', message: err.message } });
  }
});

const port = Number(process.env.API_PORT || 8000);
server.listen(port, ()=>console.log(`api listening on ${port}`));
