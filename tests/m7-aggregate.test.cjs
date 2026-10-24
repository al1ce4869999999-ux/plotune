const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={};box.globalThis=box;vm.runInNewContext(fs.readFileSync('m7-aggregate-v01.js','utf8'),box);
const M=box.PlotuneM7Aggregate;
const trial=(seed,score)=>({trialId:'run-'+seed,evaluation:{schema:'plotune.m7.listening.v1',seed,
 ratings:Object.fromEntries(M.IDS.map(id=>[id,Object.fromEntries(M.KEYS.map(k=>[k,id==='baseline'?3:score]))]))},
 diagnostics:{schema:'plotune.m7.diagnostics.v1',seed,
 metrics:Object.fromEntries(M.IDS.map(id=>[id,{noteCount:id==='baseline'?100:90}]))}});
const a=M.aggregate([trial(1,4),trial(2,2)]);
assert.equal(a.trialCount,2);
assert.equal(a.summary.baseline.preference.mean,3);
assert.equal(a.summary.m.preference.mean,3);
assert.equal(a.disagreements.length,3);
assert.equal(a.disagreements[0].trialId,'run-1');
const missing=trial(3,5);missing.evaluation.ratings.m.preference=null;
assert.equal(M.aggregate([missing]).summary.m.preference.count,0);
const missingSubjective=trial(6,4);missingSubjective.evaluation.ratings.m.preference=null;
assert.equal(M.aggregate([missingSubjective]).disagreements.filter(x=>x.conditionId==='m').length,0,'unrated M preference must never create an M disagreement');
assert.throws(()=>M.aggregate([]),{name:'TypeError'});
assert.throws(()=>M.aggregate([trial(1,4),trial(1,2)]),{name:'RangeError'});
assert.throws(()=>M.aggregate([{...trial(4,2),diagnostics:{...trial(4,2).diagnostics,seed:5}}]),{name:'TypeError'});
console.log('PASS M7 multi-trial descriptive aggregation');
