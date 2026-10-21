const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};vm.runInNewContext(fs.readFileSync('composition-plan-v1.js','utf8'),ctx);
const api=ctx.PlotuneCompositionPlan;
for(const bars of [2,4,8,9,16,24,25,32,64,128]){
 const input={bars,seed:42,tempo:96};
 const a=api.create(input),z=api.create(input);
 assert.equal(JSON.stringify(a),JSON.stringify(z),'deterministic');
 assert.equal(a.sections.reduce((n,s)=>n+s.bars,0),bars,'bar count');
 let cursor=0;
 for(const s of a.sections){
  assert.equal(s.startBar,cursor,'contiguous sections');cursor+=s.bars;
  assert.equal(s.tensionTarget.length,s.bars);
  assert.equal(s.densityTarget.length,s.bars);
  assert.ok(s.tensionTarget.every(t=>t>=0&&t<=1));
 }
 assert.equal(a.sections.at(-1).cadence,'authentic');
}
for(const bars of [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,64,128]){
 const p=api.create({bars});
 assert.equal(p.sections.reduce((n,s)=>n+s.bars,0),bars);
}
console.log('CompositionPlan phase 1 structural tests passed');
