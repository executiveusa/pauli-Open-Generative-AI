const transitions = { created:['queued','cancelled'], queued:['running','cancelled'], running:['waiting_for_provider','stitching','failed','cancelled'], waiting_for_provider:['running','failed'], stitching:['succeeded','failed'], succeeded:[], failed:[], cancelled:[] };
export const canTransition = (from,to)=> (transitions[from]||[]).includes(to);
