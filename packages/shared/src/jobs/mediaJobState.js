export const MEDIA_JOB_TRANSITIONS = { created:['queued','cancelled'], queued:['running','cancelled'], running:['waiting_for_provider','stitching','failed','cancelled'], waiting_for_provider:['running','failed'], stitching:['succeeded','failed'], succeeded:[], failed:[], cancelled:[] };
export const canTransition = (from,to)=> (MEDIA_JOB_TRANSITIONS[from]||[]).includes(to);
export function assertTransition(from,to){ if(!canTransition(from,to)) throw new Error(`invalid transition ${from} -> ${to}`); return true; }
