const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const math=Object.create(Math);math.random=()=>{throw Error('ambient RNG forbidden');};
const ctx={window:{},Blob,console,Math:math};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js','research-evaluation-r0.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const gen=ctx.window.PlotuneM7Generation,ev=ctx.window.PlotuneResearchEvaluation;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fingerprint=t=>({notes:hash(Buffer.from(JSON.stringify(t.score.notes))),pcm:hash(Buffer.from(t.samples.buffer,t.samples.byteOffset,t.samples.byteLength))});
const input={scene:'森の道を歩き、友との別れを思い出して涙をこらえる',character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey'};
const fixtures=JSON.parse(fs.readFileSync('tests/fixtures/r0-m7-baselines.json','utf8'));
assert.equal(fixtures.schemaVersion,'r0-m7-baseline-v1');
for(const {duration,seed,conditions} of fixtures.cases){
 const output=gen.generate({...input,duration},seed);
 assert.deepEqual(Array.from(output.tracks,t=>t.conditionId),['baseline','phase','m','phase-m']);
 const plans=gen.makePlans(gen.request({...input,duration},seed),gen.dependenciesFromRoot());
 const planSnapshots=JSON.stringify(plans);
 const observed={};
 for(const t of output.tracks){
  const before=fingerprint(t.track);
  const result=ev.evaluate((score,plan,context)=>({metrics:{notes:score.notes.length,samples:context.samples},diagnostics:[]}),t.track.score,plans.find(p=>p.conditionId===t.conditionId).plan,{samples:t.track.samples.length});
  assert.equal(result.status,'ok');assert.equal(result.metrics.samples,duration*t.track.sampleRate);
  const trace=ev.record({version:'0.1'},result,'diagnostic only');assert.equal(trace.researchEvaluations[0].status,'ok');
  const actual=gen.dependenciesFromRoot().handheld.render(plans.find(p=>p.conditionId===t.conditionId).plan);
  assert.deepEqual(fingerprint(actual),before,'R0 OFF/ON identical notes/PCM');
  observed[t.conditionId]=before;
 }
 assert.equal(JSON.stringify(plans),planSnapshots,'render cannot mutate shared plans');
 if(process.env.UPDATE_R0_BASELINE==='1')console.log('R0_FIXTURE '+JSON.stringify({duration,seed,conditions:observed}));
 else assert.deepEqual(observed,conditions,'fixed baseline drift at '+duration+'s');
 console.log('PASS R0 M7 integration '+duration+'s');
}
