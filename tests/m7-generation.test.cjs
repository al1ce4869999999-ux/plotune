const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const sandbox={};sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('m7-generation-v01.js','utf8'),sandbox);
const m=sandbox.PlotuneM7Generation;
assert.deepEqual(Array.from(m.IDS),['baseline','phase','m','phase-m']);
assert.deepEqual(Array.from(m.IDS, id=>[m.condition(id).phase,m.condition(id).m]),[[false,false],[true,false],[false,true],[true,true]]);
for(const id of m.IDS)assert.equal(m.condition(id).m6Repair,false);
assert.throws(()=>m.condition('unknown'),{name:'RangeError'});
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
assert.throws(()=>m.request({...input,duration:12},42),{name:'RangeError'});
assert.throws(()=>m.request({...input,style:'band'},42),{name:'RangeError'});
assert.throws(()=>m.generate(input,42,{...deps,handheld:{...deps.handheld,render:()=>({samples:new Float32Array(5),sampleRate:8,score:{}})}}),{name:'RangeError'});
console.log('M7.1 generation contract passed');
assert.throws(()=>m.request({...input,instrumentSet:'unimplemented'},42),{name:'RangeError'});
// Exercise the actual workflow script so escaping cannot silently weaken the gate.
const gate=fs.readFileSync('.github/workflows/goal-retention.yml','utf8').split('          script: |\n')[1]
 .split('\n').map(s=>s.slice(12)).join('\n');
const headings=['固定する小目標','ユーザーが通る利用経路','完了条件','変更内容と影響する既存テスト','現在の状態','未完了と次の一手'];
const runGate=body=>{let failed=false;new Function('context','core',gate)(
 {payload:{pull_request:{body}}},{setFailed:()=>{failed=true;},info:()=>{}});return !failed;};
assert(runGate(headings.map(h=>'## '+h+'\n具体的な内容').join('\n')));
assert(!runGate(''));
assert(!runGate(headings.map((h,i)=>'## '+h+'\n'+(i?'具体的な内容':'<!-- placeholder -->')).join('\n')));
assert(!runGate(headings.map((h,i)=>'## '+h+'\n'+(i?'具体的な内容':'')).join('\n')));
console.log('PASS goal retention actual script positive/negative cases');
