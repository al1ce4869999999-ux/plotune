const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const math=Object.create(Math);math.random=()=>{throw Error('ambient RNG forbidden');};
const ctx={window:{},Blob,console,Math:math};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','motif-similarity-r1.js','identity-novelty-r4.js','identity-novelty-r4b.js','tension-r2a.js','tension-r2b.js','expectancy-r3.js','expectancy-r3b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js'])
 vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const gen=ctx.window.PlotuneM7Generation,H=ctx.window.PlotuneHandheld;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fingerprint=t=>({notes:hash(Buffer.from(JSON.stringify(t.score.notes))),pcm:hash(Buffer.from(t.samples.buffer,t.samples.byteOffset,t.samples.byteLength))});
const input={scene:'森の道を歩き、友との別れを思い出して涙をこらえる',character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey'};
let observedChange=0,observedTrace=0;
for(const duration of [15,30,60]){
 const req=gen.request({...input,duration},42),plans=gen.makePlans(req,gen.dependenciesFromRoot());
 assert.deepEqual(Array.from(plans,p=>p.conditionId),['baseline','phase','m','phase-m']);
 for(const {conditionId,plan} of plans){
  const off=H.render(plan);
  const diagnostic=H.render({...plan,musicIdentityNoveltyR4:true,musicIdentityNoveltyR4Selection:false});
  assert.deepEqual(fingerprint(diagnostic),fingerprint(off),'R4a cannot alter '+duration+' '+conditionId);
  const selected=H.render({...plan,musicIdentityNoveltyR4:true,musicIdentityNoveltyR4Selection:true,identityNoveltyScoreBudget:2});
  const details=selected.score.details?.identityNoveltyR4;
  assert(details&&Array.isArray(details.phrase));
  for(const d of details.phrase){observedTrace++;assert(Array.isArray(d.assessments));}
  if(fingerprint(off).notes!==fingerprint(selected).notes){
   observedChange++;
   assert.notEqual(fingerprint(off).pcm,fingerprint(selected).pcm,'real sound must change with note score');
  }
  assert.deepEqual(fingerprint(selected),fingerprint(H.render({...plan,musicIdentityNoveltyR4:true,musicIdentityNoveltyR4Selection:true,identityNoveltyScoreBudget:2})),'determinism');
 }
 console.log('PASS R4 M7 four conditions '+duration+'s');
}
assert(observedTrace>0,'R4 trace must reach actual M2 generation');
console.log('PASS R4 real engine traces '+observedTrace+' changed score cases '+observedChange);
