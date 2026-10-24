const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const math=Object.create(Math);math.random=()=>{throw Error('ambient RNG forbidden');};
const ctx={window:{},Blob,console,Math:math};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','tension-r2a.js','tension-r2b.js','expectancy-r3.js','expectancy-r3b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const M=ctx.window.PlotuneM7Generation,H=ctx.window.PlotuneHandheld;
const input={scene:'森の道を歩き、友との別れを思い出して涙をこらえる',character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey',duration:15};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fp=t=>({notes:hash(Buffer.from(JSON.stringify(t.score.notes))),pcm:hash(Buffer.from(t.samples.buffer,t.samples.byteOffset,t.samples.byteLength))});
const plan=M.makePlans(M.request(input,42),M.dependenciesFromRoot()).find(x=>x.conditionId==='phase-m').plan;
const off=H.render(plan);
const diagnostic=H.render({...plan,musicExpectancyR3:true});
assert.deepEqual(fp(diagnostic),fp(off),'score-only R3 must not change actual notes or PCM');
assert.equal(diagnostic.score.details.expectancyR3.mode,'diagnostic-only');
assert(diagnostic.score.details.expectancyR3.realized.trace.length>0);
let pair=null;
for(const seed of [42,77,99,123]){
 const p={...plan,seed,characterSeed:seed,musicExpectancyR3:true,musicExpectancyR3Selection:true,expectancyScoreBudget:2};
 const low={...p,expectancyTarget:{targetBits:0}},high={...p,expectancyTarget:{targetBits:16}};
 const a=H.score(low),b=H.score(high);
 if(JSON.stringify(a.notes)!==JSON.stringify(b.notes)){pair={low,high,a,b};break;}
}
assert(pair,'R3b target variations must change real generated notes at a fixed seed');
assert(pair.a.details.expectancyR3.phrase.length>0);
assert(pair.b.details.expectancyR3.phrase.length>0);
assert(pair.a.details.expectancyR3.phrase.some(x=>x.assessments.length>0));
assert.equal(pair.a.harmony.at(-1).chord,0,'cadence chord is still tonic');
assert.equal(pair.b.harmony.at(-1).chord,0,'cadence chord is still tonic');
const a=H.render(pair.low),b=H.render(pair.high);
assert.notEqual(fp(a).notes,fp(b).notes,'expectancy target changes actual score');
assert.notEqual(fp(a).pcm,fp(b).pcm,'expectancy target changes real rendered PCM');
assert.deepEqual(fp(H.render(pair.low)),fp(a),'same seed/target render deterministic');
assert.deepEqual(fp(H.render(plan)),fp(off),'OFF notes/PCM remain exactly stable');
const selected=H.score({...pair.low,musicExpectancyR3Selection:false});
assert.equal(JSON.stringify(selected.notes),JSON.stringify(H.score({...pair.low,musicExpectancyR3:false,musicExpectancyR3Selection:false}).notes),'R3 selection independently disabled');
console.log('PASS R3b real M7 score/PCM target difference, transparent trace, cadence, deterministic OFF');
