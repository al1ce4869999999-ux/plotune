const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const math=Object.create(Math);math.random=()=>{throw Error('ambient RNG forbidden');};
const ctx={window:{},Blob,console,Math:math};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js','expectancy-r3.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const M=ctx.window.PlotuneM7Generation,R=ctx.window.PlotuneExpectancyR3;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fingerprint=t=>({notes:hash(Buffer.from(JSON.stringify(t.score.notes))),pcm:hash(Buffer.from(t.samples.buffer,t.samples.byteOffset,t.samples.byteLength))});
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/r0-m7-baselines.json','utf8'));
const input={scene:'森の道を歩き、友との別れを思い出して涙をこらえる',character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey'};
for(const {duration,seed,conditions} of baseline.cases){
 const output=M.generate({...input,duration},seed);
 const plans=M.makePlans(M.request({...input,duration},seed),M.dependenciesFromRoot());
 const snapshot=JSON.stringify(plans);
 for(const {conditionId,track} of output.tracks){
  const before=fingerprint(track),notesBefore=JSON.stringify(track.score.notes);
  const model=R.train([track.score.notes],{source:'R3a same-track diagnostic fixture',style:'generated',training:'in-memory-only'});
  const first=R.evaluate(track.score,{}, {model});
  const second=R.evaluate(track.score,{}, {model});
  assert.equal(JSON.stringify(first),JSON.stringify(second),'R3a deterministic');
  assert.equal(first.trace.length,track.score.notes.length,'each rendered note evaluated');
  assert(first.trace.every(e=>Number.isFinite(e.axes.joint.ic)&&Number.isFinite(e.axes.joint.entropy)));
  assert.equal(JSON.stringify(track.score.notes),notesBefore,'R3a score unchanged');
  assert.deepEqual(fingerprint(track),before,'R3a diagnostic PCM unchanged');
  assert.deepEqual(before,conditions[conditionId],duration+'s '+conditionId+' baseline');
 }
 assert.equal(JSON.stringify(plans),snapshot);
 console.log('PASS R3a M7 four-condition diagnostic baseline '+duration+'s');
}
