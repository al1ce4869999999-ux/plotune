/* Phase 5/6 integration: real PlotuneHandheld.score, deterministic four-way
 * score audit and comparison. PCM can be requested separately, to avoid
 * rendering four large buffers when only score auditing is needed.
 */
(function(root){
'use strict';
function createRunner(engine,auditor,evaluator){
 if(!engine||typeof engine.score!=='function'||!auditor||!evaluator)
  throw new TypeError('Engine, Phase 5 audit and Phase 6 evaluator required');
 function generate(input,seed,{pcm=false}={}){
  if(!Number.isInteger(seed)||seed<0)throw new TypeError('seed must be a nonnegative integer');
  const base={...input,seed};
  const flags={
   Baseline:{motifDevelopment:false,musicDevelopment:false,musicHarmony:false,musicVoices:false,musicPerformance:false,musicTransitions:false},
   Phase:{motifDevelopment:true,musicDevelopment:false,musicHarmony:false,musicVoices:false,musicPerformance:false,musicTransitions:true},
   M:{motifDevelopment:false,musicDevelopment:true,musicHarmony:true,musicVoices:true,musicPerformance:true,musicTransitions:false},
   'Phase+M':{motifDevelopment:true,musicDevelopment:true,musicHarmony:true,musicVoices:true,musicPerformance:true,musicTransitions:true}
  };
  const cases={};
  for(const condition of evaluator.CONDITIONS){
   const plan={...base,...flags[condition]};
   const score=engine.score(plan);
   cases[condition]={plan,score};
   if(pcm){
    if(typeof engine.render!=='function')throw new TypeError('PCM rendering unavailable');
    cases[condition].audio=engine.render(plan);
   }
  }
  const report=evaluator.compare(cases,seed,{audit:auditor.auditHandheld});
  return {cases,report};
 }
 function proposeCadenceRepair(entry,revision){
  if(!entry||!entry.score||!revision||typeof revision.reviseSection!=='function')
   throw new TypeError('Score and revision gate required');
  const original=entry.score;
  const length=original.duration/4,start=original.duration-length,end=original.duration;
  const leads=original.notes.filter(n=>n.voice==='lead'&&n.t>=start&&n.t<end).sort((a,b)=>a.t-b.t);
  if(!leads.length)return {accepted:false,reason:'NO_CADENCE_LEAD',score:original};
  const last=leads[leads.length-1];
  const target=Number.isFinite(entry.plan.cadenceTargetPitch)?entry.plan.cadenceTargetPitch:null;
  if(target===null)return {accepted:false,reason:'NO_EXPLICIT_CADENCE_TARGET',score:original};
  const candidate={...original,notes:original.notes.map(n=>n===last?{...n,midi:target}:n)};
  const cost=notes=>{const lead=notes.filter(n=>n.voice==='lead').sort((a,b)=>a.t-b.t).at(-1);return lead?Math.abs(lead.midi-target):Infinity;};
  return revision.reviseSection(original,candidate,{start,end,cost});
 }
 return {generate,proposeCadenceRepair};
}
const api={createRunner};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.PlotunePhase56Integration=api;
})(typeof globalThis!=='undefined'?globalThis:this);
