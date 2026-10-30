// H3 contracts: new opt-in planner, phrase immutability, region tracking and fallback.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{},Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js',
  'motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js',
  'm3-harmony-melody-v01.js','handheld-v21.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
const M=context.window.PlotuneM3Harmony,A=context.window.PlotuneAnalysis,H=context.window.PlotuneHandheld;
const bar=[{position:0,durationUnits:2,degree:0,localScaleDegree:0,motifDegree:0},
 {position:4,durationUnits:2,degree:4,localScaleDegree:4,motifDegree:4},
 {position:8,durationUnits:2,degree:6,localScaleDegree:6,motifDegree:6},
 {position:12,durationUnits:2,degree:1,localScaleDegree:1,motifDegree:1}];
const phrases=Array.from({length:16},()=>bar.map(e=>({...e}))),snapshot=JSON.stringify(phrases);
const result=M.planH3(phrases,{progression:[0,4,5,3]});
assert.equal(JSON.stringify(phrases),snapshot,'H3 source remains unchanged');
assert.equal(JSON.stringify(result.phrases),snapshot,'H3 motif/local degree unchanged');
assert.equal(JSON.stringify(result),JSON.stringify(M.planH3(phrases,{progression:[0,4,5,3]})),'H3 deterministic');
assert.equal(result.chords.length,16);assert.equal(result.regions.length,16);
assert.ok(result.regions.every((r,i)=>r.bar===i&&r.globalChordDegree===result.chords[i]));
assert.ok(result.regions.every(r=>Number.isInteger(r.regionId)&&[0,4].includes(r.keyOffset)));
assert.equal(result.regions[0].keyOffset,0,'start in home key');
assert.equal(result.regions.at(-1).keyOffset,0,'home cadence');
assert.ok(result.decisions.every(d=>Array.isArray(d.nonChord)&&Number.isFinite(d.score)));
assert.throws(()=>M.planH3([]),/phrase bars/);
assert.throws(()=>M.planH3([[]]),/phrase bars/);
const input={title:'H3 regression',character:'旅人',world:'森',scene:'歩いて帰る',style:'handheld',duration:30};
for(const seconds of [15,30,60]){
 const scenario={...input,duration:seconds};
 const prepared=H.prepare(A.plan(scenario,A.analyze(scenario)),'journey',null,false,scenario.scene);
 const base={...prepared,musicHarmony:true,musicDevelopment:true,motifDevelopment:true,h2HarmonyAlignment:true};
 const h2=H.score(base);
 const off=H.score({...base,h3HarmonicContinuity:false});
 assert.equal(JSON.stringify(off.notes),JSON.stringify(h2.notes),'H3 OFF H2 notes '+seconds);
 assert.equal(JSON.stringify(off.harmony),JSON.stringify(h2.harmony),'H3 OFF H2 harmony '+seconds);
 const on=H.score({...base,h3HarmonicContinuity:true});
 const again=H.score({...base,h3HarmonicContinuity:true});
 assert.equal(JSON.stringify(on.notes),JSON.stringify(again.notes),'H3 ON deterministic notes '+seconds);
 assert.equal(JSON.stringify(on.details.h3),JSON.stringify(again.details.h3),'H3 ON deterministic diagnostics '+seconds);
 assert.equal(on.details.h3.regions.length,on.harmony.length);
 assert.ok(on.details.h3.decisions.some(d=>Array.isArray(d.nonChord)));
}
// H3 independent opt-in without H2 and M3, while H3 OFF is untouched.
const prepared=H.prepare(A.plan(input,A.analyze(input)),'journey',null,false,input.scene);
const on=H.score({...prepared,musicHarmony:false,h2HarmonyAlignment:false,h3HarmonicContinuity:true});
const off=H.score({...prepared,musicHarmony:false,h2HarmonyAlignment:false,h3HarmonicContinuity:false});
assert.ok(on.details.h3);
assert.equal(off.details.h3,undefined);
console.log('PASS H3 planner contract, diagnostics, independent toggle and 15/30/60 note fallback');
