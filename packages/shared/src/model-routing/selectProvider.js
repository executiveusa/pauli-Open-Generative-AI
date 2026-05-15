export function selectProvider(routes, input) {
  const filtered = routes.filter(r=>r.enabled&&input.enabledProviders.includes(r.provider)&&r.capability===input.capability);
  const rank = ['local','huggingface','comfyui','fal','muapi','stub'];
  const eligible = filtered.filter(r=> r.provider!=='fal' || input.allowPaid).sort((a,b)=>rank.indexOf(a.provider)-rank.indexOf(b.provider));
  const route = eligible[0] ?? {id:'stub-default',provider:'stub',capability:input.capability,modelId:'stub',requiresGpu:false,estimatedCost:'free',enabled:true};
  return { route, reason:`selected ${route.provider} by priority order`, fallbacks: eligible.slice(1) };
}
