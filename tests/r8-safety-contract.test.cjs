// Run from repository root: node tests/r8-safety-contract.test.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},console};
for(const name of ['transition-evaluation-r7.js','transition-optimization-r8.js'])
 vm.runInNewContext(fs.readFileSync(name,'utf8'),ctx,{filename:name});
const R=ctx.window.PlotuneTransitionR8,beat=.25;
const arc=[{stage:'opening'},{stage:'opening'},{stage:'climax'},{stage:'resolution'}];
const orig=[
 {t:0,d:.75,midi:72,voice:'lead',role:'lead',motifId:'theme-A'},
 {t:1.8,d:.4,midi:60,voice:'bass',role:'bass'},
 {t:2,d:.75,midi:74,voice:'lead',role:'lead',motifId:'theme-A'},
 {t:2.8,d:.2,midi:67,voice:'chords',role:'chords',sectionId:'A'},
 {t:3,d:.2,midi:74,voice:'lead',role:'lead',motifId:'theme-A'},
 {t:3,d:.2,midi:60,voice:'bass',role:'bass'}
];
for(const strategy of ['CADENCE_BREATH','COMMON_TONE','BASS_LEAD','SUSPENSION','HARD_CUT']){
 const input={notes:orig,duration:4,bpm:240,wholeTrackArc:arc,transitionPlans:[{time:3,strategy}]};
 const before=JSON.stringify(input),out=R.optimize(input),again=R.optimize(input);
 assert.equal(JSON.stringify(input),before,'no input mutation');
 assert.equal(JSON.stringify(out),JSON.stringify(again),'determinism');
 assert.equal(out.notes.length,orig.length,'no added events');
 for(let i=0;i<orig.length;i++){
  const a=orig[i],b=out.notes[i];
  for(const key of Object.keys(a).filter(k=>!['t','d','midi'].includes(k)))
   assert.equal(b[key],a[key],`identity ${key} ${strategy}`);
  if(a.voice==='lead')assert.equal(JSON.stringify(b),JSON.stringify(a),'lead preserved');
  if(JSON.stringify(a)!==JSON.stringify(b)){
   assert.ok(a.t>=3-4*beat&&a.t<3,'boundary source');
   assert.ok(b.t>=3-4*beat&&b.t<3+2*beat,'boundary destination');
   assert.ok(b.d>=.035&&b.t+b.d<=4,'valid duration');
  }
 }
 assert.equal(out.trace.strategies[0].strategy,'HARD_CUT','contrast protected');
 if(strategy!=='HARD_CUT')
  for(const e of out.trace.strategies.filter(e=>e.changed)){
   assert.ok(e.before&&e.after,'trace delta recorded');
   assert.equal(out.notes[e.index].midi,e.after.midi);
  }
}
console.log('PASS R8 safety contracts: local edits, motif/role retention, deterministic trace');
