const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={};box.globalThis=box;vm.runInNewContext(fs.readFileSync('m7-generation-v01.js','utf8'),box);
const M=box.PlotuneM7Generation;
const input={scene:'Forest',style:'handheld',duration:15};
const rendered=[];
const deps={analyze:()=>({}),plan:()=>({}),resonare:()=>({}),structure:()=>({}),psychology:()=>({}),
 handheld:{prepare:p=>({...p}),render:p=>{rendered.push(JSON.stringify(p));return {
  score:{notes:[{midi:60}]},sampleRate:8,samples:new Float32Array(120).fill(.1)
 };}}};
const first=M.generateAblations(input,42,deps),second=M.generateAblations(input,42,deps);
assert.equal(first.tracks.length,6);
assert.equal(JSON.stringify(first.tracks.map(x=>x.ablationId)),JSON.stringify(['all-on','m1-off','m2-off','m3-off','m4-off','m5-off']));
assert.equal(JSON.stringify(first.tracks.map(x=>x.disabledFlag)),JSON.stringify([null,'motifDevelopment','musicDevelopment','musicHarmony','musicVoices','musicPerformance']));
assert.equal(JSON.stringify(rendered.slice(0,6)),JSON.stringify(rendered.slice(6)),'determinism');
const base=JSON.parse(rendered[0]);
for(let i=1;i<6;i++){
 const p=JSON.parse(rendered[i]);const flag=first.tracks[i].disabledFlag;
 assert.equal(base[flag],true);
 assert.equal(p[flag],false);
 p[flag]=true;
 assert.equal(JSON.stringify(p),JSON.stringify(base),'only selected flag may change');
}
const normal=M.generate(input,42,deps);
assert.equal(normal.tracks.length,4,'fixed four tracks unchanged');
assert.equal(normal.tracks.every(x=>x.m6Report===null),true,'M6 default off');
console.log('PASS M7 independent ablations');
