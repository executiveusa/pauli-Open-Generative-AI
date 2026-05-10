import http from 'node:http';
import { randomUUID } from 'node:crypto';

const db = { projects: new Map(), jobs: new Map(), assets: new Map(), characters: new Map() };
const json = (res, code, payload) => { res.writeHead(code, { 'Content-Type':'application/json' }); res.end(JSON.stringify(payload)); };
const readBody = req => new Promise(resolve=>{ let d=''; req.on('data',c=>d+=c); req.on('end',()=>resolve(d?JSON.parse(d):{})); });

const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/health') return json(res,200,{ok:true,service:'more-of-less-api'});
  if (req.method === 'POST' && url.pathname === '/v1/projects') { const body = await readBody(req); const id = `project_${randomUUID()}`; const p={id,name:body.name||'Untitled',ownerUserId:body.ownerUserId||'local-user',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; db.projects.set(id,p); return json(res,201,p); }
  if (req.method === 'GET' && url.pathname === '/v1/projects') return json(res,200,{items:[...db.projects.values()]});
  if (req.method === 'POST' && ['/v1/jobs/music-video','/v1/jobs/visualizer','/v1/jobs/mix-master','/v1/jobs/autotune'].includes(url.pathname)) { const body=await readBody(req); const id=`job_${randomUUID()}`; const type=url.pathname.split('/').pop(); const j={id,projectId:body.projectId||'project_unknown',type,status:'created',progress:0,input:body,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; db.jobs.set(id,j); return json(res,202,j); }
  if (req.method==='GET' && url.pathname.startsWith('/v1/jobs/')) { const id=url.pathname.split('/')[3]; const j=db.jobs.get(id); return j?json(res,200,j):json(res,404,{error:'not_found'}); }
  return json(res,404,{error:'not_found'});
});

const port = Number(process.env.API_PORT || 8000);
server.listen(port, ()=> console.log(`api listening on ${port}`));
