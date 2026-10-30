const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={};ctx.globalThis=ctx;
vm.runInNewContext(fs.readFileSync('m7-evaluation-v01.js','utf8'),ctx);
const m=ctx.PlotuneM7Evaluation;
const generation={request:{seed:42,scene:'forest',style:'handheld',gameStyle:'auto',duration:15},tracks:m.IDS.map(conditionId=>({conditionId}))};
const record=m.createRecord(generation);
for(const key of ['difference','emotionalComplexity','motifRecognition','variationFreshness','melodyClarity','boundaryPersuasiveness','wholeSongCoherence','relistenIntent']){
 assert(m.CRITERIA.some(([name])=>name===key));
 assert.equal(record.ratings.baseline[key],null);
}
assert.equal(record.seed,42);assert.equal(m.complete(record),false);
assert.equal(record.generation.schemaVersion,null);
assert.equal(record.generation.conditions.length,4);
assert.equal(record.generation.conditions[0].id,'baseline');
assert.equal(record.input.seed,42);
assert.equal(record.presentationOrder,null);
const ordered=m.createRecord({...generation,presentationOrder:['m','baseline','phase-m','phase']});
assert.deepEqual(Array.from(ordered.presentationOrder),['m','baseline','phase-m','phase']);
assert.deepEqual(Object.keys(record.objectiveDiagnostics.baseline).sort(),['r0','r3','r4','r5','r7']);
assert.equal(record.objectiveDiagnostics.baseline.r3,null);
const source={metrics:{meanIC:2.5}};
const measured=m.createRecord({...generation,tracks:generation.tracks.map((t,i)=>i===0?{...t,diagnostics:{r3:source}}:t)});
assert.equal(measured.objectiveDiagnostics.baseline.r3.metrics.meanIC,2.5);
assert.equal(measured.objectiveDiagnostics.phase.r3,null);
const actual=m.createRecord({...generation,tracks:generation.tracks.map((t,i)=>i===0?{...t,track:{details:{expectancyR3:{metrics:{meanIC:1.7}},arrangementPerceptionR5:{metrics:{foregroundClarity:.8}},transitionEvaluationR7:{transitions:[]}}}}:t)});
assert.equal(actual.objectiveDiagnostics.baseline.r3.metrics.meanIC,1.7);
assert.equal(actual.objectiveDiagnostics.baseline.r5.metrics.foregroundClarity,.8);
assert.equal(actual.objectiveDiagnostics.baseline.r7.transitions.length,0);
assert.equal(actual.objectiveDiagnostics.phase.r3,null);
source.metrics.meanIC=99;
assert.equal(measured.objectiveDiagnostics.baseline.r3.metrics.meanIC,2.5);
const versioned=m.createRecord({...generation,schemaVersion:'m7.1-v1',version:'test-revision',tracks:generation.tracks.map(t=>({...t,config:{flags:{musicHarmony:false}}}))});
assert.equal(versioned.generation.schemaVersion,'m7.1-v1');
assert.equal(versioned.generation.version,'test-revision');
assert.equal(versioned.generation.conditions[0].version,'test-revision');
assert.equal(versioned.generation.conditions[0].config.flags.musicHarmony,false);
for(const key of ['liking','expectation','memorability','naturalness']){
 assert(m.CRITERIA.some(([name])=>name===key));
 assert.equal(record.ratings.baseline[key],null);
 m.setRating(record,'baseline',key,5);
 assert.equal(record.ratings.baseline[key],5);
 m.setRating(record,'baseline',key,'');
 assert.equal(record.ratings.baseline[key],null);
}
assert.equal(m.rating(''),null);assert.equal(m.rating('5'),5);
assert.throws(()=>m.rating('6'),{name:'RangeError'});
assert.throws(()=>m.rating('2.5'),{name:'RangeError'});
for(const id of m.IDS)for(const [key] of m.CRITERIA)m.setRating(record,id,key,4);
assert.equal(m.complete(record),true);
m.setRating(record,'baseline','liking',2);
m.setRating(record,'phase-m','liking',5);
const compared=m.compareRatings(record);
assert.equal(compared.axes.liking.delta,3);
assert.equal(compared.axes.expectation.delta,0);
assert.equal(compared.axes.emotionalComplexity.delta,0);
assert.equal(Object.keys(compared.axes).length,m.CRITERIA.length);
assert.equal(compared.objective.left.r0,null);
m.setRating(record,'phase-m','memorability','');
assert.equal(m.compareRatings(record).axes.memorability.delta,null);
m.setRating(record,'phase-m','memorability',4);
assert.throws(()=>m.compareRatings(record,'baseline','baseline'),{name:'RangeError'});
m.setRating(record,'m','emotion','');assert.equal(m.complete(record),false);
assert.throws(()=>m.setRating(record,'other','emotion',2),{name:'RangeError'});
const researchPair={schemaVersion:'r9.research-pairs.v1',request:generation.request,ablation:['r8'],tracks:[
 {conditionId:'phase-m',mode:'off',config:{research:{musicTransitionOptimizationR8:false}},track:{details:{expectancyR3:{mean:1}}}},
 {conditionId:'phase-m',mode:'on',config:{research:{musicTransitionOptimizationR8:false}},track:{details:{expectancyR3:{mean:2}}}}
]};
const researchRecord=m.createResearchRecord(researchPair,'phase-m');
assert.equal(researchRecord.ratings.off.liking,null);
assert.equal(researchRecord.ratings.on.liking,null);
assert.equal(researchRecord.objectiveDiagnostics.on.r3.mean,2);
assert.equal(researchRecord.ablation[0],'r8');
assert.throws(()=>m.createResearchRecord(researchPair,'baseline'),{name:'TypeError'});
const html=fs.readFileSync('index.html','utf8');
for(const id of ['m7Evaluation','m7RatingFields','m7RatingSave','m7RatingExport','m7RatingStatus'])assert(html.includes('id="'+id+'"'));
for(const id of ['r9Evaluation','r9RatingFields','r9RatingSave','r9RatingExport'])assert(html.includes('id="'+id+'"'));
assert(html.includes('m7-evaluation-v01.js'));
assert(fs.readFileSync('m7-listening-v01.js','utf8').includes('controller.begin(result)'));
console.log('M7.3 evaluation contract passed');
