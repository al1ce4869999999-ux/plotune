// Node 22: local M3/R8 harmony contract (未実行 in this GitHub commit).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},Blob,console};
for(const file of ['research-evaluation-r0.js','arrangement-perception-r5.js','arrangement-optimization-r6.js','transition-evaluation-r7.js','transition-optimization-r8.js','analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','motif-similarity-r1.js','identity-novelty-r4.js','identity-novelty-r4b.js','tension-r2a.js','tension-r2b.js','expectancy-r3.js','expectancy-r3b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js'])
 vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const R=ctx.window.PlotuneTransitionR8,H=ctx.window.PlotuneHandheld,G=ctx.window.PlotuneM7Generation;
const notes=[{t:2.75,d:.2,midi:60,voice:'bass'},{t:3,d:.2,midi:62,voice:'bass'},{t:3,d:.2,midi:72,voice:'lead'}];
const arc=[{stage:'opening'},{stage:'opening'},{stage:'climax'},{stage:'resolution'}];
const args={notes,duration:4,bpm:240,wholeTrackArc:arc,transitionPlans:[{time:3,strategy:'BASS_LEAD'}]};
const without=R.optimize(args),withM3=R.optimize({...args,harmony:[{t:0,chord:0},{t:3,chord:0}],tonic:60,scale:[0,2,4,5,7,9,11],meter:1});
assert.equal(without.trace.status,'selected');
assert.ok(!withM3.trace.strategies.some(x=>x.strategy==='BASS_LEAD'&&x.changed),'reject worsening BASS_LEAD while allowing a safe alternative');
assert.equal(JSON.stringify(notes),JSON.stringify(args.notes),'do not mutate input');
const request={scene:'森を歩く旅人',character:'旅人',world:'森',style:'handheld',gameStyle:'journey',duration:15};
const plans=G.makePlans(G.request(request,42),G.dependenciesFromRoot());
assert.equal(plans.length,4);
for(const {plan} of plans){
 const off=H.render({...plan,musicTransitionOptimizationR8:false});
 const on=H.render({...plan,musicTransitionOptimizationR8:true});
 assert.ok(on.score.details.transitionOptimizationR8);
 assert.equal(on.score.notes.length,off.score.notes.length,'preserve event count');
}
console.log('PASS R8 M3 harmony contract');
