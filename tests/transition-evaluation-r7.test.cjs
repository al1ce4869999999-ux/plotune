const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const ctx={window:{},Blob,console};
const files=['research-evaluation-r0.js','arrangement-perception-r5.js','arrangement-optimization-r6.js','transition-evaluation-r7.js','analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','motif-similarity-r1.js','identity-novelty-r4.js','identity-novelty-r4b.js','tension-r2a.js','tension-r2b.js','expectancy-r3.js','expectancy-r3b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js'];
for(const file of files)vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const R=ctx.window.PlotuneTransitionR7,H=ctx.window.PlotuneHandheld,G=ctx.window.PlotuneM7Generation;
const notes=[{t:0,d:1,midi:72,voice:'lead',volume:.2},{t:2,d:1,midi:74,voice:'lead',volume:.2},{t:2,d:1,midi:60,voice:'counter',volume:.12}];
const arc=[{stage:'opening'},{stage:'opening'},{stage:'climax'},{stage:'resolution'}];
const input={notes,duration:4,bpm:240,wholeTrackArc:arc},snap=JSON.stringify(input);
const a=R.evaluate(input),b=R.evaluate(input);
assert.equal(a.status,'ok');assert.equal(a.transitions.length,2);assert.equal(a.transitions[0].plan.continuityTarget,'contrast');assert.equal(a.transitions[1].plan.continuityTarget,'smooth');
assert.equal(a.transitions[0].diagnostics.intentionalContrast,true);
assert.deepEqual(JSON.stringify(a),JSON.stringify(b),'determinism');assert.equal(JSON.stringify(input),snap,'pure evaluation');
assert.equal(R.evaluate({...input,wholeTrackArc:[]}).status,'fallback');
assert.equal(R.evaluate({...input,wholeTrackArc:arc.slice(0,2)}).status,'fallback');
const hash=x=>({notes:crypto.createHash('sha256').update(JSON.stringify(x.score.notes)).digest('hex'),pcm:crypto.createHash('sha256').update(Buffer.from(x.samples.buffer,x.samples.byteOffset,x.samples.byteLength)).digest('hex')});
const request={scene:'森を歩く旅人',character:'旅人',world:'森',style:'handheld',gameStyle:'journey'};
for(const duration of [15,30,60]){
 const req=G.request({...request,duration},42),plans=G.makePlans(req,G.dependenciesFromRoot());
 assert.equal(plans.length,4);
 for(const {conditionId,plan} of plans){
  const off=H.render({...plan,musicTransitionEvaluationR7:false});
  const on=H.render({...plan,musicTransitionEvaluationR7:true});
  assert.deepEqual(hash(on),hash(off),'R7 diagnosis must preserve notes and PCM '+conditionId+' '+duration);
  assert.equal(on.score.details.transitionEvaluationR7.status,'ok');
  assert.deepEqual(hash(on),hash(H.render({...plan,musicTransitionEvaluationR7:true})),'seed stability');
  const withR6=H.render({...plan,musicArrangementOptimizationR6:true,musicTransitionEvaluationR7:true});
  const withoutR7=H.render({...plan,musicArrangementOptimizationR6:true,musicTransitionEvaluationR7:false});
  assert.deepEqual(hash(withR6),hash(withoutR7),'R6 ON preserved '+conditionId+' '+duration);
 }
}
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/r0-m7-baselines.json','utf8'));
const reference={scene:'森の道を歩き、友との別れを思い出して涙をこらえる',character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey'};
for(const {duration,seed,conditions} of fixture.cases){
 const req=G.request({...reference,duration},seed);
 for(const {conditionId,plan} of G.makePlans(req,G.dependenciesFromRoot())){
  assert.deepEqual(hash(H.render({...plan,musicTransitionEvaluationR7:true,musicArrangementOptimizationR6:false})),conditions[conditionId],'R0 baseline '+duration+' '+conditionId);
 }
}
console.log('PASS R7 transition plan diagnostics; M7 4x3; R6 preservation; R0 baseline');
