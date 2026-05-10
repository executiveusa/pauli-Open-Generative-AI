export const defaultProviderRoutes = [
  { id:'local-ttv', capability:'text-to-video', provider:'local', modelId:'local/ttv', requiresGpu:true, estimatedCost:'free', enabled:true, supportsSeed:true },
  { id:'hf-ttv', capability:'text-to-video', provider:'huggingface', modelId:'hf/ttv', requiresGpu:false, estimatedCost:'free', enabled:true, supportsSeed:true },
  { id:'comfy-ttv', capability:'text-to-video', provider:'comfyui', modelId:'comfy/ttv', requiresGpu:true, estimatedCost:'low', enabled:true, supportsSeed:true },
  { id:'fal-ttv', capability:'text-to-video', provider:'fal', modelId:'fal/ttv', requiresGpu:false, estimatedCost:'high', enabled:true, supportsSeed:true },
  { id:'muapi-ttv', capability:'text-to-video', provider:'muapi', modelId:'muapi/ttv', requiresGpu:false, estimatedCost:'medium', enabled:true, supportsSeed:true },
  { id:'stub-ttv', capability:'text-to-video', provider:'stub', modelId:'stub/ttv', requiresGpu:false, estimatedCost:'free', enabled:true, supportsSeed:true }
];
