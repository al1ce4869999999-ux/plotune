const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const context={window:{}};
for(const file of ['analyzer.js','m-comparison-v01.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const analysis=context.window.PlotuneAnalysis,comparison=context.window.PlotuneMComparison;
const input={title:'固定主題',character:'静かな物語',world:'森',scene:'光が差す。',style:'piano',duration:'30'};
const plan=analysis.plan(input,analysis.analyze(input),0);
const run=comparison.modes(plan);
for(const [name,candidate] of Object.entries(run)){
 const result=comparison.compare(plan,candidate);
 assert.equal(result.compatible,true,name+': base composition parameters must match');
 assert.deepEqual(Array.from(result.changed),[]);
 assert.equal(candidate.seed,plan.seed);
 assert.equal(candidate.characterSeed,plan.characterSeed);
}
assert.equal(run.baseline.musicDevelopment,undefined,'M OFF must preserve old path');
assert.equal(run.baseline.emotionComposition,false);
assert.equal(run.phaseOnly.musicDevelopment,undefined,'Phase-only mode must not enable M');
assert.equal(run.mOnly.emotionComposition,false,'M-only mode must not enable Phase');
assert.equal(run.mOnly.musicDevelopment,true);
assert.equal(run.combined.emotionComposition,true);
const edited={...run.mOnly,seed:run.mOnly.seed+1};
assert.deepEqual(Array.from(comparison.compare(plan,edited).changed),['seed']);
const changedProgression={...run.mOnly,progression:[...plan.progression].reverse()};
assert.equal(comparison.compare(plan,changedProgression).compatible,false);
const snapshot=comparison.conditions(plan);
plan.progression[0]=999;
assert.notEqual(snapshot.progression[0],999,'snapshot cannot alias the input progression');
assert.throws(()=>comparison.conditions({...plan,seed:1.5}),/integer seeds/);
console.log('PASS M0-2: independent Phase/M flags and fixed-seed comparison contract');
