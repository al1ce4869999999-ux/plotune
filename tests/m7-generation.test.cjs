const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const sandbox={};sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('m7-generation-v01.js','utf8'),sandbox);
const m=sandbox.PlotuneM7Generation;
assert.deepEqual(Array.from(m.IDS),['baseline','phase','m','phase-m']);
assert.deepEqual(Array.from(m.IDS, id=>[m.condition(id).phase,m.condition(id).m]),[[false,false],[true,false],[false,true],[true,true]]);
for(const id of m.IDS)assert.equal(m.condition(id).m6Repair,false);
assert.throws(()=>m.condition('unknown'),RangeError);
const input={scene:'A quiet forest',style:'handheld',gameStyle:'musicbox',duration:15};
const deps={
 analyze:()=>({}),plan:(_i,_a,v)=>({seed:99,duration:15,characterSeed:99,variant:v}),
 resonare:()=>({}),structure:()=>({}),psychology:()=>({}),
 handheld:{prepare:(p)=>({...p,genre:'game'}),render:(p)=>({
  samples:new Float32Array(15*8).fill(p.musicHarmony?.2:.1),
  sampleRate:8,score:{duration:15,notes:[{t:0,d:1,midi:60}]}
 })}
};
const a=m.generate(input,42,deps),b=m.generate(input,42,deps);
assert.equal(a.tracks.length,4);
for(const t of a.tracks){
 assert.equal(t.request.seed,42);assert.equal(t.track.score.duration,15);
 assert.equal(t.config.m6Repair,false);assert.equal(t.track.samples.length,120);
}
assert.deepEqual(Array.from(a.tracks,t=>t.track.samples[0]),Array.from(b.tracks,t=>t.track.samples[0]));
const plans=m.makePlans(m.request(input,42),deps);
assert.deepEqual(Array.from(plans,p=>p.plan.motifDevelopment),[false,true,false,true]);
assert.deepEqual(Array.from(plans,p=>p.plan.musicHarmony),[false,false,true,true]);
assert(plans.every(p=>p.plan.seed===42&&p.plan.duration===15));
assert.throws(()=>m.request({...input,duration:12},42),RangeError);
assert.throws(()=>m.request({...input,style:'band'},42),RangeError);
assert.throws(()=>m.generate(input,42,{...deps,handheld:{...deps.handheld,render:()=>({samples:new Float32Array(5),sampleRate:8,score:{}})}}),RangeError);
console.log('M7.1 generation contract passed');
