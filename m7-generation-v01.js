/* M7.1: four-condition generation contract. No playback/UI changes. */
(function(root){'use strict';
const IDS=Object.freeze(['baseline','phase','m','phase-m']);
const FLAG_KEYS=Object.freeze(['motifDevelopment','musicDevelopment','musicHarmony','musicVoices','musicPerformance','musicTransitions','musicTonalJourney','musicMotifMemory','phaseSongForm','phaseArrangement']);
function condition(id){
 if(!IDS.includes(id))throw new RangeError('unknown M7 condition: '+id);
 const phase=id==='phase'||id==='phase-m',m=id==='m'||id==='phase-m';
 return Object.freeze({id,phase,m,phaseScope:phase?'form-motif-arrangement-transitions':'off',m6Repair:false,flags:Object.freeze({
  phaseSongForm:phase,phaseArrangement:phase,motifDevelopment:phase,musicTransitions:phase,musicTonalJourney:m,musicMotifMemory:m,musicDevelopment:m,musicHarmony:m,musicVoices:m,musicPerformance:m
 })});
}
function request(input,seed){
 if(!input||typeof input!=='object')throw new TypeError('M7 input required');
 const duration=Number(input.duration??input.durationSec);
 if(![15,30,60].includes(duration))throw new RangeError('M7 duration must be 15, 30 or 60 seconds');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('invalid generation seed');
 if(typeof input.scene!=='string'||!input.scene.trim())throw new TypeError('scene required');
 const style=input.style??'handheld';
 if(input.instrumentSet!=null&&input.instrumentSet!=='handheld-current')throw new RangeError('unsupported M7 instrument set');
 if(style!=='handheld')throw new RangeError('M7.1 currently supports handheld only');
 return Object.freeze({title:String(input.title??''),character:String(input.character??''),
  world:String(input.world??''),scene:input.scene,style,gameStyle:String(input.gameStyle??'auto'),
  duration,seed:seed>>>0,instrumentSet:String(input.instrumentSet??'handheld-current')});
}
function dependenciesFromRoot(){
 const required=['PlotuneAnalysis','PlotuneResonare','PlotuneHandheld','PlotuneStoryStructure','PlotuneMusicPsychology',
  'PlotuneMelodicGrammar','PlotuneMotifPlanner','PlotuneM2Phrase','PlotuneM3Harmony','PlotuneM3TonalJourney','PlotuneM4Voices','PlotuneM5Performance'];
 for(const name of required)if(!root[name])throw new TypeError('M7 engine dependency missing: '+name);
 return {analyze:root.PlotuneAnalysis.analyze,plan:root.PlotuneAnalysis.plan,
  resonare:root.PlotuneResonare.analyze,handheld:root.PlotuneHandheld,
  structure:root.PlotuneStoryStructure.analyze,psychology:root.PlotuneMusicPsychology.derive};
}
// Prepared plans contain plain data. Isolate nested state between conditions and renders.
function clone(value){
 if(Array.isArray(value))return value.map(clone);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clone(v)]));
 return value;
}
function makePlans(req,dependencies){
 const {analyze,plan,resonare,handheld,structure,psychology}=dependencies||{};
 if(!analyze||!plan||!resonare||!handheld?.prepare)throw new TypeError('M7 analysis dependencies required');
 const input={...req,duration:String(req.duration)};
 const analyzed=analyze(input);
 const original=plan(input,analyzed,0);
 const appraisal=resonare(input);
 const storyContext=[req.character,req.world,req.scene].filter(Boolean).join('\n');
 const shared=handheld.prepare({...original,seed:req.seed,characterSeed:req.seed,duration:req.duration},
  req.gameStyle,appraisal,false,req.scene,storyContext);
 const story=structure?.(input);
 const base={...shared,structure:story,expression:psychology?.(story,req.gameStyle)};
 return IDS.map(id=>{
  const config=condition(id);
  const flags=Object.fromEntries(FLAG_KEYS.map(k=>[k,config.flags[k]]));
  return {conditionId:id,config,plan:{...clone(base),...flags,m6Repair:false,seed:req.seed,characterSeed:req.seed,duration:req.duration}};
 });
}
function generate(input,seed,dependencies,options={}){
 dependencies=dependencies||dependenciesFromRoot();
 const req=request(input,seed);
 const plans=makePlans(req,dependencies);
 if(typeof dependencies.handheld.render!=='function')throw new TypeError('M7 renderer required');
 const tracks=plans.map(({conditionId,config,plan})=>{
  const requested=options.m6Repair===true&&config.m;
  if(requested&&(!(dependencies.m6Integration||root.PlotuneM6Integration)||
     !(dependencies.m6Quality||root.PlotuneM6Quality)||typeof dependencies.handheld.score!=='function'))
   throw new TypeError('M6 repair dependencies missing');
  const enabled=requested;
  const repair=enabled?(dependencies.m6Integration||root.PlotuneM6Integration).apply(dependencies.handheld.score(plan),{seed:req.seed,quality:dependencies.m6Quality||root.PlotuneM6Quality}):null;
  const track=repair?dependencies.handheld.render(plan,repair.score):dependencies.handheld.render(plan);
  if(!track||!track.samples||!track.score||!Number.isFinite(track.sampleRate))throw new TypeError('invalid M7 rendered track: '+conditionId);
  if(track.samples.length!==Math.round(req.duration*track.sampleRate))throw new RangeError('M7 duration mismatch: '+conditionId);
  if(!track.samples.length||!track.samples.every(Number.isFinite))throw new RangeError('invalid M7 samples: '+conditionId);
  return {conditionId,config,request:req,track,m6Report:repair?.report||null};
 });
 return {schemaVersion:'m7.1-v1',request:req,tracks};
}
// UI-safe incremental rendering. Yield between conditions so Safari can paint progress.
async function generateProgressively(input,seed,onTrack,dependencies){
 dependencies=dependencies||dependenciesFromRoot();
 const req=request(input,seed),plans=makePlans(req,dependencies),tracks=[];
 for(const {conditionId,config,plan} of plans){
  // A browser task boundary lets status and controls paint before the next render.
  await new Promise(resolve=>setTimeout(resolve,0));
  const track=dependencies.handheld.render(plan);
  if(!track?.samples||!track?.score||!Number.isFinite(track.sampleRate)||
   track.samples.length!==Math.round(req.duration*track.sampleRate)||
   !track.samples.every(Number.isFinite))throw new RangeError('invalid M7 track '+conditionId);
  const item={conditionId,config,request:req,track,m6Report:null};
  tracks.push(item);
  if(onTrack)onTrack(item,tracks.length);
 }
 return {schemaVersion:'m7.1-v1',request:req,tracks};
}
// Safari: offload four expensive renders so the player never freezes the UI.
// On unsupported/blocked Workers use the incremental same-thread fallback.
function generateForListening(input,seed,onTrack){
 if(typeof root.Worker!=='function')return generateProgressively(input,seed,onTrack);
 return new Promise((resolve,reject)=>{
  const req=request(input,seed),tracks=[];let worker,settled=false;
  const finish=(error)=>{
   if(settled)return;settled=true;if(worker)worker.terminate();
   if(error)reject(error);
   else resolve({schemaVersion:'m7.1-v1',request:req,tracks});
  };
  try{worker=new root.Worker('m7-worker-v01.js?v=20261025-worker');}
  catch{return generateProgressively(input,seed,onTrack).then(resolve,reject);}
  worker.onerror=()=>{worker.terminate();generateProgressively(input,seed,onTrack).then(resolve,reject);};
  worker.onmessage=e=>{
   const data=e.data||{};
   if(data.type==='ready')worker.postMessage({type:'generate',input,seed});
   else if(data.type==='track'){
    tracks.push(data.item);
    if(onTrack)onTrack(data.item,tracks.length);
   }else if(data.type==='complete')finish();
   else if(data.type==='error')finish(new Error(data.message||'作曲ワーカーのエラー'));
  };
 });
}
// Individual flag ablations are additional tracks, not substitutions for the fixed four.
const ABLATIONS=Object.freeze({
 m1:'musicMotifMemory',m2:'musicDevelopment',m3:'musicHarmony',
 m4:'musicVoices',m5:'musicPerformance'
});
function generateAblations(input,seed,dependencies){
 dependencies=dependencies||dependenciesFromRoot();
 const req=request(input,seed),plans=makePlans(req,dependencies);
 const original=plans.find(p=>p.conditionId==='phase-m').plan;
 const variants=[{id:'all-on',key:null},...Object.entries(ABLATIONS).map(([id,key])=>({id:id+'-off',key}))];
 return {schemaVersion:'m7.ablation.v1',request:req,
  tracks:variants.map(({id,key})=>{
   const plan=clone(original);
   if(key)plan[key]=false;
   const track=dependencies.handheld.render(plan);
   if(!track?.score||!track?.samples||track.samples.length!==Math.round(req.duration*track.sampleRate)||
      !track.samples.every(Number.isFinite))throw new RangeError('invalid ablation track '+id);
   return {ablationId:id,disabledFlag:key,track};
  })};
}
root.PlotuneM7Generation={IDS,condition,request,makePlans,generate,generateProgressively,generateForListening,generateAblations,ABLATIONS,dependenciesFromRoot};
})(typeof window!=='undefined'?window:globalThis);
