const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const fixtures=require('./phase0-fixtures.cjs');
const files=['analyzer.js','resonare-v08.js','composer-v04.js','loop-arranger-v09.js','band-v09.js','band-piano-v15.js','story-structure-v01.js','music-psychology-v01.js','melodic-grammar-v01.js','composition-plan-v1.js','motif-planner-v1.js','handheld-v21.js'];
function context(){
 const c={Math,Float32Array,ArrayBuffer,DataView,Blob,TextEncoder,console};c.window=c;
 for(const file of files)vm.runInNewContext(fs.readFileSync(file,'utf8'),c,{filename:file});
 return c;
}
function signature(score){
 const s=score.score||score;
 return JSON.stringify(s,(key,value)=>key==='samples'?undefined:value);
}
for(const fixture of fixtures){
 const c=context();
 const {input,variant}=fixture;
 function generate(){
  const analysis=c.PlotuneAnalysis.analyze(input);
  const original=c.PlotuneAnalysis.plan(input,analysis,variant);
  const appraisal=c.PlotuneResonare.analyze(input);
  if(input.style==='band'||input.style==='bandpiano'){
   const mod=input.style==='band'?c.PlotuneBand:c.PlotuneBandPiano;
   const plan=c.PlotuneLoop.baseline(mod.adaptPlan(original,input.bandStyle));
   return mod.score(plan);
  }
  if(input.style==='handheld'){
   const plan=c.PlotuneHandheld.prepare(original,input.gameStyle,appraisal,false,input.scene,[input.character,input.world,input.scene].join('\n'));
   plan.compositionV1=fixture.compositionV1;
   return c.PlotuneHandheld.score(plan);
  }
  return c.PlotuneComposerV4.buildScore(original);
 }
 const a=signature(generate()),b=signature(generate());
 assert.equal(a,b,fixture.id+' must be deterministic for the fixed input and seed');
 assert.ok(a.length>50,fixture.id+' generated empty score');
 fingerprints[fixture.id]=crypto.createHash('sha256').update(a).digest('hex');
 console.log(fixture.id+' deterministic, score bytes='+a.length+', sha256='+fingerprints[fixture.id]);
}
if(process.env.PHASE0_FINGERPRINT_OUTPUT)fs.writeFileSync(process.env.PHASE0_FINGERPRINT_OUTPUT,JSON.stringify(fingerprints,null,2)+'\\n');
if(process.env.PHASE0_FINGERPRINT_EXPECTED){
 const expected=JSON.parse(fs.readFileSync(process.env.PHASE0_FINGERPRINT_EXPECTED,'utf8'));
 assert.deepEqual(fingerprints,expected,'Phase 0 historical score fingerprints changed');
}
console.log('Phase 0 route baseline fixtures passed');
