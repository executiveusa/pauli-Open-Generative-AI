import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition } from '../src/jobs/mediaJobState.js';
import { selectProvider } from '../src/model-routing/selectProvider.js';
import { buildScenePrompt } from '../src/prompts/musicVideoPromptBuilder.js';

test('job transitions', ()=>{
  assert.equal(canTransition('created','queued'), true);
  assert.equal(canTransition('succeeded','running'), false);
});

test('provider selection respects paid gate', ()=>{
  const routes=[
    {id:'fal1',capability:'text-to-video',provider:'fal',modelId:'m',requiresGpu:false,estimatedCost:'high',enabled:true},
    {id:'stub1',capability:'text-to-video',provider:'stub',modelId:'s',requiresGpu:false,estimatedCost:'free',enabled:true}
  ];
  const s=selectProvider(routes,{capability:'text-to-video',preferFree:true,allowPaid:false,enabledProviders:['fal','stub']});
  assert.equal(s.route.provider,'stub');
});

test('prompt includes character anchor', ()=>{
  const out=buildScenePrompt({scene:{sceneId:'s1',visualPrompt:'night city',seed:12},characterPassports:[{promptAnchor:'same artist face',triggerWords:['mol_artist'],negativePromptAnchor:'blurry'}]});
  assert.match(out.positivePrompt,/same artist face/);
  assert.equal(out.seed,12);
});
