const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const math=Object.create(Math);math.random=()=>{throw Error('ambient RNG forbidden');};
const ctx={window:{},Math:math};
for(const file of ['expectancy-r3.js','expectancy-r3b.js','tension-r2a.js','tension-r2b.js','m2-emotion-phrase-v01.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const M=ctx.window.PlotuneM2Phrase,R=ctx.window.PlotuneExpectancyR3;
const src=[0,2,4,6,3,4,2,0].map((degree,i)=>({degree,position:i*2,durationUnits:1,rest:false}));
const emotion={tension:.35,energy:.6,tenderness:.3};
const original=JSON.stringify(src);
const baseline=M.selectPhrase(src,emotion,{seed:42,candidates:12});
const shadow=M.selectPhrase(src,emotion,{seed:42,candidates:12,expectancyTarget:{targetBits:3}});
assert.equal(JSON.stringify(baseline.events),JSON.stringify(shadow.events),'shadow-only notes same');
assert.equal(shadow.candidateIndex,baseline.candidateIndex);
assert.equal(shadow.expectancySelected,false);
assert(shadow.expectancyDiagnostics.length>0);
assert(shadow.expectancyDiagnostics.every(d=>Number.isFinite(d.distance)&&Number.isFinite(d.meanIC)));
assert.equal(JSON.stringify(src),original,'input unchanged');
const none=M.selectPhrase(src,emotion,{seed:42,candidates:12,expectancyTarget:{targetBits:-4},expectancySelection:true});
assert.equal(JSON.stringify(none.events),JSON.stringify(baseline.events),'bad target must fallback');
assert.match(none.expectancyReason,/invalid target/);
const noBudget=M.selectPhrase(src,emotion,{seed:42,candidates:12,expectancyTarget:{targetBits:4},expectancySelection:true,expectancyScoreBudget:-1});
assert.equal(noBudget.candidateIndex,baseline.candidateIndex,'bad quality band fallback');
const timeGoal=M.selectPhrase(src,emotion,{seed:42,candidates:12,expectancyTarget:{trajectory:[0,1,2,4,1,0]},expectancySelection:true,expectancyScoreBudget:2});
assert(timeGoal.expectancyDiagnostics.every(d=>Array.isArray(d.surpriseTrajectory)));
assert(timeGoal.score>=baseline.score-2);
assert.equal(timeGoal.events.at(-1).cadence,baseline.events.at(-1).cadence,'cadence preserved');
let change=null;
for(let seed=1;seed<=100&&!change;seed++){
 const opts={seed,candidates:16,expectancySelection:true,expectancyScoreBudget:2};
 const a=M.selectPhrase(src,emotion,{...opts,expectancyTarget:{targetBits:0}});
 const b=M.selectPhrase(src,emotion,{...opts,expectancyTarget:{targetBits:16}});
 if(a.candidateIndex!==b.candidateIndex)change={seed,a,b};
}
assert(change,'different expectancy targets must select different candidates at fixed emotion/seed');
for(const choice of [change.a,change.b]){
 assert(choice.expectancyDiagnostics.length>0);
 assert(Number.isFinite(choice.expectancyDiagnostics[0].distance));
 assert(choice.score>=M.selectPhrase(src,emotion,{seed:change.seed,candidates:16}).score-2);
}
assert.equal(JSON.stringify(M.selectPhrase(src,emotion,{seed:change.seed,candidates:16,expectancyTarget:{targetBits:16},expectancySelection:true,expectancyScoreBudget:2}).events),JSON.stringify(change.b.events));
assert.equal(JSON.stringify(src),original);
const withR2=M.selectPhrase(src,emotion,{seed:change.seed,candidates:16,tensionTarget:{tonal:.8,rhythmic:.2},tensionSelection:true,expectancyTarget:{targetBits:16},expectancySelection:true,expectancyScoreBudget:2});
assert(Array.isArray(withR2.tensionDiagnostics)&&Array.isArray(withR2.expectancyDiagnostics),'R2 and R3 separately reported');
assert.equal(withR2.events.at(-1).cadence,baseline.events.at(-1).cadence);
const standalone=R.evaluate(src);assert(Number.isFinite(standalone.metrics.meanIC));
console.log('PASS R3b M2 opt-in, target differences, legacy quality band, cadence, R2 independence and fallback');
