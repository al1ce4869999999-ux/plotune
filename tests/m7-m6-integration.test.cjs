const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync('m7-generation-v01.js','utf8'),context);
const M=context.window.PlotuneM7Generation;
const calls=[];
const deps={
 analyze:()=>({}),plan:()=>({}),resonare:()=>({}),
 handheld:{
 prepare:p=>({...p}),score:p=>({duration:p.duration,bpm:120,notes:[]}),
 render:(p,override)=>{calls.push({condition:p.musicHarmony?'m':p.motifDevelopment?'phase':'baseline',override:!!override});
 return {samples:new Float32Array(p.duration*8).fill(override?.notes?.[0]?.midi/100||.1),sampleRate:8,score:override||{notes:[],duration:p.duration}};
 }
 },
 m6Integration:{apply:s=>({score:{...s,notes:[{midi:62}]},report:{accepted:1}})},
 m6Quality:{}
};
const input={scene:'森で再会する',style:'handheld',duration:15};
const off=M.generate(input,42,deps);
assert.equal(calls.filter(c=>c.override).length,0,'OFF must preserve old renderer path');
const on=M.generate(input,42,deps,{m6Repair:true});
assert.equal(on.tracks.length,4);
assert.equal(on.tracks.filter(t=>t.m6Report!==null).length,2,'only M and Phase+M treated');
assert.deepEqual(Array.from(on.tracks,t=>t.m6Report!==null),[false,false,true,true]);
assert.equal(on.tracks[0].track.samples[0],off.tracks[0].track.samples[0]);
assert.equal(on.tracks[1].track.samples[0],off.tracks[1].track.samples[0]);
assert.equal(on.tracks[2].track.samples[0],.62);
assert.equal(on.tracks[3].track.samples[0],.62);
assert.equal(off.tracks.every(t=>t.m6Report===null),true);
console.log('PASS M7 optional M6 four-condition isolation');
