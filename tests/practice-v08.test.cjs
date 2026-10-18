/* Plotune 0.8: Japanese practice and conjunction-aware musical storytelling.
   Pure JS without API or dependencies; tests the actual score, not labels alone.
 */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const assert=require('node:assert/strict'),folder=path.resolve(__dirname,'..'),window={};
const context={window,Blob,console};
for(const file of ['analyzer.js','resonare-v08.js','band-v08.js']){
 vm.runInNewContext(fs.readFileSync(path.join(folder,file),'utf8'),context,{filename:file});
}
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,B=window.PlotuneBand;
const chunks=Array.from(R.splitEvents('ぽんぽんは待っていた。でも、れんしゅう、ひとりで続ける。'));
assert.ok(chunks.some(x=>x.startsWith('でも、れんしゅう')));
assert.ok(!chunks.some(x=>x==='でも、'),'dangling connectors must merge with following action');
assert.equal(R.splitEvents('でも、').length,0,'a dangling conjunction is not an event');
for(const word of ['練習','れんしゅう','挑戦','ちょうせん','もう一度','再挑戦','やりなおし']){
 const result=R.analyze({character:'',world:'',scene:word+'をはじめた。'});
 assert.ok(result.events.some(e=>e.cue==='practice'),word+' is supported as effort');
 assert.ok(!result.events.some(e=>['success','recovery','stumble'].includes(e.cue)),
  word+' must not invent a completed success or failure');
}
assert.ok(R.analyze({character:'',world:'',scene:'練習しない。'}).events.every(e=>e.cue!=='practice'));
const input={title:'ぽんぽん',character:'ぽんぽんは人間に褒められたい。上手になろうとしている。',
 world:'たぬきの里',style:'band',duration:30,
 scene:'まだうまくできないけれど、れんしゅう、何度もくり返す。'};
const basePlan=A.plan(input,A.analyze(input)),appraisal=R.analyze(input);
assert.ok(appraisal.events.some(e=>e.cue==='practice'),'practice should be visible in narrative');
const base=B.adaptPlan(basePlan,'indie');
const revised=B.adaptPlan(R.attachPlan(basePlan,appraisal),'indie');
const baseline=B.score(base),updated=B.score(revised);
const practiced=updated.details.musicalActions.filter(e=>e.cue==='practice');
assert.ok(practiced.length>0,'practice cue reaches band score');
assert.ok(practiced[0].phraseSeconds>=2,'practice influences a phrase, not just a blip');
assert.ok(updated.details.breaks===0,'practice is not a failure and creates no fabricated stop');
function signatures(score,kind){
 if(kind==='drums')return score.percussion.map(x=>x.kind+'@'+Math.round(x.t*100));
 return score.notes.filter(x=>x.instrument===kind).map(x=>x.midi+'@'+Math.round(x.t*100)+' '+x.articulation);
}
for(const role of ['guitar','bass','drums']){
 const a=signatures(baseline,role),b=signatures(updated,role);
 assert.notDeepEqual(a,b,'effort must impact '+role);
}
const resA=B.render(base),resB=B.render(revised);
assert.equal(resA.samples.length,resB.samples.length);
let average=0;
for(let i=0;i<resA.samples.length;i+=103)average+=Math.abs(resA.samples[i]-resB.samples[i]);
average/=Math.ceil(resA.samples.length/103);
assert.ok(average>.004,'practice should produce measurable score-signal contrast '+average);
assert.ok(updated.details.shiftedChords<=Math.ceil(30/(30/118)/4),
  'report harmonic regions, not every eighth-note step');
const turnInput={...input,scene:'廊下は静かだった。しかし、誰かが来た。'};
const turnA=A.plan(turnInput,A.analyze(turnInput));
const turns=B.score(B.adaptPlan(R.attachPlan(turnA,R.analyze(turnInput)),'indie'));
assert.ok(turns.details.shiftedChords<24,
  'a single transition cannot be described as 24 chord changes');
const neutral={...input,scene:'窓辺に光がさす。'};
const p=A.plan(neutral,A.analyze(neutral)),empty=R.analyze(neutral);
const dry=B.render(B.adaptPlan(p,'indie'));
const wet=B.render(B.adaptPlan(R.attachPlan(p,empty),'indie'));
assert.deepEqual(Array.from(dry.samples),Array.from(wet.samples),
 'no observed action, no fabricated narrative contrast');
console.log('PASS v0.8: Japanese practice, linked conjunction, grounded expectations, three-piece response, chord diagnostics');
