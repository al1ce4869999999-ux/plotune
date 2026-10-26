// R8 stage-1 real-engine strategy coverage audit (Node/vm, no synthetic notes).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},Blob,console};
const files=['research-evaluation-r0.js','arrangement-perception-r5.js','arrangement-optimization-r6.js','transition-evaluation-r7.js','transition-optimization-r8.js','analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','motif-similarity-r1.js','identity-novelty-r4.js','identity-novelty-r4b.js','tension-r2a.js','tension-r2b.js','expectancy-r3.js','expectancy-r3b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js'];
for(const file of files)vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const {PlotuneTransitionR7:R7,PlotuneTransitionR8:R8,PlotuneHandheld:H,PlotuneM7Generation:G}=ctx.window;
const request={scene:'森を歩く旅人',character:'旅人',world:'森',style:'handheld',gameStyle:'journey',duration:15};
const plans=G.makePlans(G.request(request,42),G.dependenciesFromRoot());
assert.equal(plans.length,4,'real M7 conditions');
const coverage=Object.fromEntries(Array.from(R8.STRATEGIES,x=>[x,0]));
const opportunities=Object.fromEntries(Array.from(R8.STRATEGIES,x=>[x,0]));
const smooth=['COMMON_TONE','MOTIF_PREVIEW','RHYTHMIC_BRIDGE','BASS_LEAD','TEXTURE_DOVETAIL','CADENCE_BREATH','SUSPENSION'];
let actualEdits=0,boundaries=0,hardCuts=0;
for(const {conditionId,plan} of plans){
 const s=H.score({...plan,musicTransitionOptimizationR8:false});
 const input={notes:s.notes,duration:s.duration,bpm:s.bpm,wholeTrackArc:s.details?.wholeTrackArc};
 // Phase 4 stage arc currently stored in the R7 trace; if not exported in details use stage plan from the same real bars.
 const bars=Math.round(s.bpm*s.duration/240);
 const fallbackArc=Array.from({length:bars},(_,b)=>({stage:['opening','development','climax','resolution'][Math.min(3,Math.floor((b+.5)/bars*4))]}));
 input.wholeTrackArc=fallbackArc;
 const diagnosed=R7.evaluate(input);
 assert.equal(diagnosed.status,'ok',conditionId);
 const baseline=JSON.stringify(s.notes);
 for(const boundary of diagnosed.transitions){
  boundaries++;
  const time=boundary.time;
  if(boundary.plan.continuityTarget==='contrast'){
   const x=R8.optimize({...input,transitionPlans:[{time,strategy:'HARD_CUT'}]});
   const entry=x.trace.strategies.find(y=>y.time===time);
   assert.equal(entry.strategy,'HARD_CUT');assert.equal(entry.changed,0);
   coverage.HARD_CUT++;hardCuts++;continue;
  }
  for(const strategy of smooth){
   opportunities[strategy]++;
   const out=R8.optimize({...input,transitionPlans:[{time,strategy}]});
   const entry=out.trace.strategies.find(y=>y.time===time);
   assert.ok(entry,conditionId+' '+strategy);
   const offered=entry.candidates.some(c=>c.strategy===strategy);
   if(!offered)continue;
   const before=s.notes[entry.index],after=out.notes[entry.index];
   assert.equal(entry.strategy,strategy,'preferred feasible candidate should win');
   assert.equal(entry.changed,1);
   assert.notDeepEqual(JSON.stringify(after),JSON.stringify(before));
   const differences=out.notes.reduce((n,v,i)=>n+(JSON.stringify(v)!==JSON.stringify(s.notes[i])?1:0),0);
   // Other smooth boundaries can also select a candidate; each differs by at most one per boundary.
   assert.ok(differences<=diagnosed.transitions.length);
   assert.ok(after.t>=time-4*60/s.bpm&&after.t<time+2*60/s.bpm,'boundary-local');
   coverage[strategy]++;actualEdits++;
  }
 }
 assert.equal(JSON.stringify(s.notes),baseline,'R8 audit must not mutate original score');
}
assert.ok(boundaries>0&&hardCuts>0&&actualEdits>0,'real-score transition edits');
assert.deepEqual(Object.entries(coverage).filter(([,count])=>count===0).map(([name])=>name),[], 'every transition strategy must be feasible and actually selected in real M7 notes');
console.log('R8 REAL_ENGINE_STRATEGY_COVERAGE '+JSON.stringify({coverage,opportunities,actualEdits,boundaries,hardCuts}));
