const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const math=Object.create(Math);math.random=()=>{throw Error('ambient RNG forbidden');};
const ctx={window:{},Blob,console,Math:math};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js','research-evaluation-r0.js','motif-similarity-r1.js'])
 vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const gen=ctx.window.PlotuneM7Generation,R=ctx.window.PlotuneResearchEvaluation,E=ctx.window.PlotuneMotifSimilarityEvaluator;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fingerprint=t=>({notes:hash(Buffer.from(JSON.stringify(t.score.notes))),pcm:hash(Buffer.from(t.samples.buffer,t.samples.byteOffset,t.samples.byteLength))});
const base=JSON.parse(fs.readFileSync('tests/fixtures/r0-m7-baselines.json','utf8'));
const input={scene:'森の道を歩き、友との別れを思い出して涙をこらえる',character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey'};
for(const {duration,seed,conditions} of base.cases){
 const rendered=gen.generate({...input,duration},seed);
 for(const {conditionId,track} of rendered.tracks){
  const before=fingerprint(track), notes=track.score.notes.filter(n=>Number.isFinite(n.t)&&Number.isFinite(n.midi)&&Number.isFinite(n.d)&&n.d>0);
  assert(notes.length,'real rendered notes');
  const snapshot=JSON.stringify(track.score.notes);
  const motif=notes.slice(0,Math.min(12,notes.length));
  const result=R.evaluate((score)=>E.compare(score,score),{notes:motif},{},{});
  assert.equal(result.status,'ok',conditionId+' real note scoring');
  assert.equal(result.metrics.coverage,1);
  assert.equal(result.metrics.contour,1);
  assert.equal(result.metrics.rhythm,1);
  assert.equal(result.metrics.transport,1);
  assert.equal(JSON.stringify(track.score.notes),snapshot,'read-only score');
  assert.deepEqual(fingerprint(track),before,'R1 OFF/ON notes PCM');
  assert.deepEqual(before,conditions[conditionId],'R1 retains R0 fixture');
 }
 console.log('PASS R1 real M7 diagnostic '+duration+'s');
}
