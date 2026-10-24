const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const ctx={window:{},Blob,console,Math:Object.assign(Object.create(Math),{random(){throw Error('R6 candidate RNG forbidden');}})};
const files=['research-evaluation-r0.js','arrangement-perception-r5.js','arrangement-optimization-r6.js','analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','motif-similarity-r1.js','identity-novelty-r4.js','identity-novelty-r4b.js','tension-r2a.js','tension-r2b.js','expectancy-r3.js','expectancy-r3b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js'];
for(const file of files)vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const R=ctx.window.PlotuneArrangementOptimizationR6,H=ctx.window.PlotuneHandheld,G=ctx.window.PlotuneM7Generation;
const score=[{t:0,d:.5,midi:72,voice:'lead',volume:.3},{t:0,d:.5,midi:71,voice:'chords',volume:.3},{t:1,d:.5,midi:74,voice:'lead',volume:.3},{t:1,d:.5,midi:73,voice:'chords',volume:.3}];
const input={notes:score,duration:4,bpm:120,wholeTrackArc:[{stage:'opening'},{stage:'climax'}]};
const original=JSON.stringify(score),a=R.optimize(input),b=R.optimize(input);
assert.equal(JSON.stringify(score),original,'pure input');
assert.equal(JSON.stringify(a),JSON.stringify(b),'deterministic');
assert.equal(a.trace.candidates.length,5);
assert(a.trace.candidates.some(c=>c.kind==='register'&&c.edits===undefined||c.kind==='duck'));
assert(a.trace.candidates.every(c=>c.reasons&&typeof c.passes==='boolean'&&c.metrics));
assert.equal(R.optimize({notes:[],duration:0,bpm:120}).status,'fallback');
const sha=t=>({notes:crypto.createHash('sha256').update(JSON.stringify(t.score.notes)).digest('hex'),pcm:crypto.createHash('sha256').update(Buffer.from(t.samples.buffer,t.samples.byteOffset,t.samples.byteLength)).digest('hex')});
const request={scene:'森を歩く旅人',character:'旅人',world:'森',style:'handheld',gameStyle:'journey'};
let changed=0;
for(const duration of [15,30,60]){
 const req=G.request({...request,duration},42),plans=G.makePlans(req,G.dependenciesFromRoot());
 assert.equal(plans.length,4);
 for(const {conditionId,plan} of plans){
  const off=H.render(plan),disabled=H.render({...plan,musicArrangementOptimizationR6:false}),on=H.render({...plan,musicArrangementOptimizationR6:true});
  assert.deepEqual(sha(off),sha(disabled),'OFF unchanged '+conditionId+' '+duration);
  assert(on.score.details.arrangementOptimizationR6,'R6 trace '+conditionId+' '+duration);
  assert.deepEqual(sha(on),sha(H.render({...plan,musicArrangementOptimizationR6:true})),'ON deterministic');
  if(sha(off).notes!==sha(on).notes&&sha(off).pcm!==sha(on).pcm)changed++;
 }
}
assert(changed>0,'R6 ON must change real notes and PCM for at least one condition');
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/r0-m7-baselines.json','utf8'));
const reference={scene:'森の道を歩き、友との別れを思い出して涙をこらえる',character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey'};
for(const {duration,seed,conditions} of fixture.cases){
 const req=G.request({...reference,duration},seed);
 for(const {conditionId,plan} of G.makePlans(req,G.dependenciesFromRoot()))
  assert.deepEqual(sha(H.render({...plan,musicArrangementOptimizationR6:false})),conditions[conditionId],'immutable R0 '+duration+' '+conditionId);
}
console.log('PASS R6 candidate traces, gates, determinism, M7 4x3, R0 OFF baseline, real notes/PCM differences '+changed);
