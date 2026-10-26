const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const ctx={window:{},Blob,console};
const files=['research-evaluation-r0.js','arrangement-perception-r5.js','arrangement-optimization-r6.js','transition-evaluation-r7.js','transition-optimization-r8.js','analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','motif-similarity-r1.js','identity-novelty-r4.js','identity-novelty-r4b.js','tension-r2a.js','tension-r2b.js','expectancy-r3.js','expectancy-r3b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js'];
for(const file of files)vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const R=ctx.window.PlotuneTransitionR8,H=ctx.window.PlotuneHandheld,G=ctx.window.PlotuneM7Generation;
const arc=[{stage:'opening'},{stage:'opening'},{stage:'climax'},{stage:'resolution'}];
const notes=[{t:0,d:1,midi:72,voice:'lead'},{t:1.8,d:.5,midi:60,voice:'bass'},{t:2,d:1,midi:74,voice:'lead'},{t:2.8,d:.5,midi:62,voice:'bass'}];
const input={notes,duration:4,bpm:240,wholeTrackArc:arc},snapshot=JSON.stringify(input);
const a=R.optimize(input),b=R.optimize(input);
assert.equal(a.trace.status,'selected');assert.equal(a.trace.changedNotes,1);
assert.equal(a.trace.strategies[0].strategy,'HARD_CUT');
assert.equal(a.trace.strategies[0].changed,0);
assert.equal(a.trace.strategies[1].strategy,'CADENCE_BREATH');
assert.equal(a.notes[1].d,notes[1].d);assert.ok(a.notes[3].d<notes[3].d);
assert.equal(JSON.stringify(input),snapshot);assert.equal(JSON.stringify(a),JSON.stringify(b));

const strategyCases={
 COMMON_TONE:[{t:2.75,d:.2,midi:60,voice:'bass'},{t:3,d:.2,midi:62,voice:'bass'}],
 MOTIF_PREVIEW:[{t:2.75,d:.2,midi:72,voice:'counter'},{t:3,d:.2,midi:74,voice:'lead'}],
 RHYTHMIC_BRIDGE:[{t:2.82,d:.16,midi:70,voice:'arp'},{t:3,d:.2,midi:74,voice:'lead'}],
 BASS_LEAD:[{t:2.75,d:.2,midi:60,voice:'bass'},{t:3,d:.2,midi:65,voice:'bass'}],
 TEXTURE_DOVETAIL:[{t:2.75,d:.15,midi:67,voice:'pad'},{t:3,d:.2,midi:74,voice:'lead'}],
 CADENCE_BREATH:[{t:2.8,d:.18,midi:60,voice:'bass'},{t:3,d:.2,midi:74,voice:'lead'}],
 SUSPENSION:[{t:2.8,d:.2,midi:67,voice:'chords'},{t:3,d:.2,midi:74,voice:'lead'}]
};
assert.deepEqual(Array.from(R.STRATEGIES).sort(),Object.keys(strategyCases).concat('HARD_CUT').sort());
for(const [strategy,events] of Object.entries(strategyCases)){
 const synthetic={notes:events,duration:4,bpm:240,wholeTrackArc:arc,transitionPlans:[{time:3,strategy}]};
 const before=JSON.stringify(synthetic),r=R.optimize(synthetic);
 assert.equal(r.trace.strategies[0].strategy,'HARD_CUT',strategy+' keeps earlier hard cut');
 assert.equal(r.trace.strategies[1].strategy,strategy,strategy+' candidate is selectable');
 assert.equal(r.trace.changedNotes,1,strategy+' exactly one local edit');
 assert.equal(JSON.stringify(synthetic),before,strategy+' pure input');
 assert.notEqual(JSON.stringify(r.notes),JSON.stringify(events),strategy+' real note edit');
}
const hash=x=>({notes:crypto.createHash('sha256').update(JSON.stringify(x.score.notes)).digest('hex'),pcm:crypto.createHash('sha256').update(Buffer.from(x.samples.buffer,x.samples.byteOffset,x.samples.byteLength)).digest('hex')});
const request={scene:'森を歩く旅人',character:'旅人',world:'森',style:'handheld',gameStyle:'journey'};
let selected=0;
for(const duration of [15,30,60]){
 const plans=G.makePlans(G.request({...request,duration},42),G.dependenciesFromRoot());
 assert.equal(plans.length,4);
 for(const {conditionId,plan} of plans){
  const off=H.render({...plan,musicTransitionOptimizationR8:false});
  const on=H.render({...plan,musicTransitionOptimizationR8:true});
  const repeat=H.render({...plan,musicTransitionOptimizationR8:true});
  assert.deepEqual(hash(on),hash(repeat),'determinism '+conditionId+' '+duration);
  assert.equal(on.score.details.transitionOptimizationR8.version,'r8.1');
  assert.deepEqual(hash(off),hash(H.render({...plan})),'OFF preservation '+conditionId+' '+duration);
  if(on.score.details.transitionOptimizationR8.status==='selected'){
   selected++;assert.notDeepEqual(hash(on).notes,hash(off).notes,'real notes '+conditionId+' '+duration);
   assert.notDeepEqual(hash(on).pcm,hash(off).pcm,'real PCM '+conditionId+' '+duration);
  }
 }
}
assert.ok(selected>0,'at least one actual ON generation changes notes and PCM');
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/r0-m7-baselines.json','utf8'));
const reference={scene:'森の道を歩き、友との別れを思い出して涙をこらえる',character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey'};
for(const {duration,seed,conditions} of fixture.cases){
 const plans=G.makePlans(G.request({...reference,duration},seed),G.dependenciesFromRoot());
 for(const {conditionId,plan} of plans)
  assert.deepEqual(hash(H.render({...plan,musicTransitionOptimizationR8:false,musicArrangementOptimizationR6:false})),conditions[conditionId],'R0 baseline '+duration+' '+conditionId);
}
console.log('PASS R8 local strategies, determinism, OFF, M7 4x3, R0 baseline; selected='+selected);
