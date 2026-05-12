import path from 'node:path';
export function buildJobPath(root, projectId, jobId) { return path.join(root, 'projects', projectId, 'jobs', jobId); }
