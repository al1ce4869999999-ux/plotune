const assert=require('node:assert/strict');
const H0=require('../h0-diagnostics-v01.js');
const {createRunner}=require('../phase56-integration-v01.js');
const audit=require('../phase5-whole-song-audit-v01.js');
const evaluation=require('../phase6-evaluation-v01.js');
const engine={
 score(plan){
  const offset=plan.musicDevelopment?1:0;
  return {duration:16,meter:4,notes:[
   {t:3.5,d:.3,midi:60+offset,voice:'lead',volume:.1},
   {t:4,d:.3,midi:72+offset,voice:'lead',volume:.1},
   {t:4.5,d:.3,midi:72+offset,voice:'lead',volume:.1},
   {t:5,d:.4,midi:48,voice:'bass',volume:.1}
  ],details:{transitions:[{boundary:4}]}};
 },
 render(plan){return {samples:new Float32Array([plan.musicDevelopment?1:0,plan.musicTransitions?1:0])};}
};
const runner=createRunner(engine,audit,evaluation);
const input={duration:16,gameStyle:'journey'};
const off=runner.generate(input,42,{pcm:true});
const on=runner.generate(input,42,{pcm:true,h0:true});
assert.deepEqual(Object.keys(on.cases),evaluation.CONDITIONS);
assert.deepEqual(on.cases,off.cases,'H0 does not affect scores, plans or PCM');
for(const condition of evaluation.CONDITIONS){
 assert.deepEqual(on.cases[condition].score.notes,off.cases[condition].score.notes);
 assert.deepEqual(on.cases[condition].audio.samples,off.cases[condition].audio.samples);
}
assert.deepEqual(on.report,off.report,'four-condition evaluation unchanged');
assert.deepEqual(on.h0,runner.generate(input,42,{h0:true}).h0,'fixed seed deterministic');
assert.deepEqual(on.h0.conditions,evaluation.CONDITIONS);
const ab=runner.generate(input,42,{h0Ablations:true});
assert.deepEqual(Object.keys(ab.h0Ablations.variants),['M2','M3','M4','M5']);
assert.equal(ab.h0Ablations.variants.M2.disabledFlag,'musicDevelopment');
assert.equal(ab.h0Ablations.variants.M2.unchanged,false);
assert.equal(ab.h0Ablations.variants.M3.unchanged,true);
assert.deepEqual(ab.h0Ablations,runner.generate(input,42,{h0Ablations:true}).h0Ablations);
assert.deepEqual(ab.cases,off.cases);
assert(on.h0.events.some(e=>e.suspectedProblem==='LARGE_LEAP'));
assert(on.h0.events.every(e=>e.confidence==='low'||e.confidence==='unconfirmed'));
const before=JSON.stringify(on.cases);
const second=H0.diagnose(on.cases,42);
assert.equal(JSON.stringify(on.cases),before,'score input immutable');
assert.deepEqual(second,on.h0);
assert.equal(H0.diagnose({},42).summary.M.reason,'SCORE_UNAVAILABLE');
assert.equal(H0.diagnose({M:{score:{notes:[null,{t:null,d:1,midi:60}]}}},42).summary.M.noteCount,0);
assert.throws(()=>H0.diagnose(null,42),/cases/);
assert.throws(()=>H0.diagnose({},-1),/seed/);
console.log('PASS H0 opt-in score and PCM preservation, fixed-seed JSON, safety, four conditions');
