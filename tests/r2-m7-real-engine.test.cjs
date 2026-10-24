const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const math=Object.create(Math);math.random=()=>{throw Error('ambient RNG forbidden');};
const ctx={window:{},Blob,console,Math:math};
for(const f of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','tension-r2a.js','tension-r2b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js'])
 vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const H=ctx.window.PlotuneHandheld,M=ctx.window.PlotuneM7Generation,T=ctx.window.PlotuneTensionR2a;
const input={scene:'森の道を歩き、友との別れを思い出して涙をこらえる',character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey',duration:15};
const seed=42,req=M.request(input,seed),prepared=M.makePlans(req,M.dependenciesFromRoot());
assert.deepEqual(Array.from(prepared,x=>x.conditionId),['baseline','phase','m','phase-m']);
const plan=prepared.find(x=>x.conditionId==='phase-m').plan;
const tensionPlan=T.plan({emotionPlan:{sections:[{name:'A'},{name:'B'}]}},{dynamic:[0,1],tonal:[.2,.8],rhythmic:[.8,.2]});
const fingerprint=track=>({notes:crypto.createHash('sha256').update(JSON.stringify(track.score.notes)).digest('hex'),
 pcm:crypto.createHash('sha256').update(Buffer.from(track.samples.buffer,track.samples.byteOffset,track.samples.byteLength)).digest('hex')});
const off=H.render(plan),on=H.render({...plan,musicTensionR2:true,tensionPlan});
assert.equal(off.samples.length,on.samples.length);
assert.notEqual(fingerprint(off).pcm,fingerprint(on).pcm,'R2 dynamics changes rendered PCM');
assert.notEqual(fingerprint(off).notes,fingerprint(on).notes,'R2 dynamics changes note velocities');
assert.equal(JSON.stringify(off.score.harmony),JSON.stringify(on.score.harmony),'M3 chord selection unchanged');
assert.equal(on.score.details.tensionR2.realized.length,2);
assert.equal(on.score.details.tensionR2.mode,'dynamics-applied');
assert.deepEqual(fingerprint(H.render(plan)),fingerprint(off),'OFF PCM stable');
assert.deepEqual(fingerprint(H.render({...plan,musicTensionR2:true,tensionPlan})),fingerprint(on),'ON PCM stable');
console.log('PASS R2 M7 phase-m real render PCM/dynamics diff, R4 selection untouched, OFF/ON deterministic');
