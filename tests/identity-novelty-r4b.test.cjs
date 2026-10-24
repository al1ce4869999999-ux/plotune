const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const math=Object.create(Math);math.random=()=>{throw Error('R4 may not consume ambient RNG');};
const ctx={window:{},Math:math};
for(const file of ['motif-similarity-r1.js','identity-novelty-r4.js','identity-novelty-r4b.js','expectancy-r3.js','expectancy-r3b.js','m2-emotion-phrase-v01.js'])
 vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const M=ctx.window.PlotuneM2Phrase,R=ctx.window.PlotuneIdentityNoveltyR4b;
const source=[0,2,4,6,3,4,2,0].map((degree,i)=>({degree,position:i*2,durationUnits:1,rest:false}));
const before=JSON.stringify(source),emotion={tension:.3,energy:.5,tenderness:.4};
const off=M.selectPhrase(source,emotion,{seed:12,candidates:16});
const shadow=M.selectPhrase(source,emotion,{seed:12,candidates:16,identityNoveltyR4:true,sectionRoleR4:'return'});
assert.equal(JSON.stringify(shadow.events),JSON.stringify(off.events),'diagnostic only must not alter output');
const selected=M.selectPhrase(source,emotion,{seed:12,candidates:16,identityNoveltyR4:true,identityNoveltyR4Selection:true,sectionRoleR4:'return',identityNoveltyScoreBudget:2,originMotifIdR4:'theme-a'});
assert(Array.isArray(selected.identityNoveltyR4Diagnostics));
assert(selected.score>=off.score-2);
assert.equal(JSON.stringify(source),before);
assert.equal(JSON.stringify(selected.events),JSON.stringify(M.selectPhrase(source,emotion,{seed:12,candidates:16,identityNoveltyR4:true,identityNoveltyR4Selection:true,sectionRoleR4:'return',identityNoveltyScoreBudget:2,originMotifIdR4:'theme-a'}).events));
const fail=R.choose([{index:0,events:source,score:0}],{index:0,events:source,score:0},source,{sectionRoleR4:'invalid'});
assert.equal(fail.selected,false);
const noBudget=R.choose([{index:0,events:source,score:0}],{index:0,events:source,score:0},source,{identityNoveltyScoreBudget:-1});
assert.match(noBudget.reason,/invalid quality budget/);
const snapshot=JSON.stringify(source);
assert.equal(JSON.stringify(source),snapshot);

const thematic=[2,4,5,2].map((degree,i)=>({degree,position:i,durationUnits:1,cadence:false}));
const contrasting=[{degree:20,position:0,durationUnits:1,cadence:false},{degree:0,position:7,durationUnits:1,cadence:false}];
const options={identityNoveltyScoreBudget:2,originMotifIdR4:'opening-theme'};
const alternatives=[{index:0,score:10,events:thematic},{index:1,score:9.8,events:contrasting}];
const statement=R.choose(alternatives,alternatives[0],thematic,{...options,sectionRoleR4:'statement'});
const contrast=R.choose(alternatives,alternatives[0],thematic,{...options,sectionRoleR4:'contrast'});
assert.equal(statement.chosen.index,0,'statement retains clearly recognizable original');
assert.equal(contrast.chosen.index,1,'contrast selects structurally distinct candidate');
assert.equal(contrast.trace.originMotifId,'opening-theme','whole-song original motif lineage');
assert.notEqual(statement.chosen.index,contrast.chosen.index,'same candidate pool, role-specific choice');
console.log('PASS R4 role-dependent statement/contrast selection with shared candidates');

console.log('PASS R4b quality gate, fallback, opt-in, score-only, deterministic and no RNG');
