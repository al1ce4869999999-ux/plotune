const assert=require('node:assert/strict');
const H0=require('../h0-diagnostics-v01.js');
const {createRunner}=require('../phase56-integration-v01.js');
const audit=require('../phase5-whole-song-audit-v01.js');
const evaluation=require('../phase6-evaluation-v01.js');
const engine={
 score(plan){
  const offset=plan.musicDevelopment?1:0;
  return {duration:16,bpm:60,meter:4,notes:[
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
assert.deepEqual(Object.fromEntries(Object.entries(on.cases).map(([key,entry])=>[key,{...entry,plan:{...entry.plan,h0Trace:undefined}}])),Object.fromEntries(Object.entries(off.cases).map(([key,entry])=>[key,{...entry,plan:{...entry.plan,h0Trace:undefined}}])),'H0 does not affect scores or PCM');
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
assert.deepEqual(Object.fromEntries(Object.entries(ab.cases).map(([k,v])=>[k,{plan:v.plan,score:v.score}])),Object.fromEntries(Object.entries(off.cases).map(([k,v])=>[k,{plan:v.plan,score:v.score}])));
assert(on.h0.events.some(e=>e.suspectedProblem==='LARGE_LEAP'));
assert(on.h0.events.every(e=>e.confidence==='low'||e.confidence==='unconfirmed'));
const before=JSON.stringify(on.cases);
const second=H0.diagnose(on.cases,42);
assert.equal(JSON.stringify(on.cases),before,'score input immutable');
assert.deepEqual(second.events,on.h0.events);
assert.deepEqual(second.summary,on.h0.summary);
assert.equal(H0.diagnose({},42).summary.M.reason,'SCORE_UNAVAILABLE');
assert.equal(H0.diagnose({M:{score:{notes:[null,{t:null,d:1,midi:60}]}}},42).summary.M.noteCount,0);
assert.throws(()=>H0.diagnose(null,42),/cases/);
assert.throws(()=>H0.diagnose({},-1),/seed/);
const sourceStages={preM4:[{t:1,d:.4,midi:60,voice:'lead'}],postM4:[{t:1,d:.4,midi:60,voice:'lead'}],postM5:[{t:1.02,d:.4,midi:60,voice:'lead'}],postTransition:[{t:1.02,d:.3,midi:60,voice:'lead'}]};
const stageBefore=JSON.stringify(sourceStages);
const stageDiff=H0.compareStages(sourceStages,42);
assert.equal(stageDiff.events.length,2);
assert.deepEqual(stageDiff,H0.compareStages(sourceStages,42));
assert.equal(JSON.stringify(sourceStages),stageBefore);
assert(stageDiff.events.every(e=>e.confidence==='unconfirmed'));
const phraseTrace={beforeM2:[[{position:0,degree:0}]],afterM2:[[{position:0,degree:1}]],afterM3:[[{position:0,degree:2}]]};
const phraseOriginal=JSON.stringify(phraseTrace);
const phraseDiff=H0.comparePhrases(phraseTrace,42);
assert.equal(phraseDiff.events.length,2);
assert.deepEqual(phraseDiff,H0.comparePhrases(phraseTrace,42));
assert.equal(JSON.stringify(phraseTrace),phraseOriginal);
assert.deepEqual(H0.comparePhrases(null,42).events,[]);
console.log('PASS H0 opt-in score and PCM preservation, fixed-seed JSON, safety, four conditions');
