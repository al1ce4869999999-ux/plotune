const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};for(const f of ['m6-quality-v01.js','m6-integration-v01.js'])
 vm.runInNewContext(fs.readFileSync(f,'utf8'),context,{filename:f});
const M=context.window.PlotuneM6Integration;
const note=(t,midi,voice)=>({t,d:.5,midi,voice,volume:.2});
const score={duration:8,bpm:60,notes:[
 ...[0,1,2,3].map(i=>note(i,60+i,'lead')),
 ...[4,5,6,7].map(i=>note(i,60+i-4,'lead')),
 note(4,64,'chords'),note(4,64,'counter'),note(4,64,'counter')
]};
const before=JSON.stringify(score);
const r=M.apply(score,{seed:1});
assert.equal(JSON.stringify(score),before,'source score untouched');
assert.equal(r.report.initial.metrics.repetition,1);
assert(r.report.attempts.some(x=>x.metric==='repetition'&&!x.accepted),'motif guard');
assert(r.report.attempts.some(x=>x.metric==='voiceCollision'&&!x.accepted),'non-chord candidate blocked');
assert.equal(JSON.stringify(r.score.notes),JSON.stringify(score.notes));
assert.equal(JSON.stringify(M.apply(score,{seed:1})),JSON.stringify(r),'deterministic');
const fake={assess:({notes})=>({issues:notes[1].midi===60?[{bar:0,metric:'voiceCollision'}]:[],metrics:{}}),
 repair:({notes})=>({accepted:true,notes:notes.map((n,i)=>i===1?{...n,midi:64}:{...n}),reason:'local metric improved'})};
const s={duration:4,bpm:60,notes:[note(0,64,'chords'),note(0,60,'counter')]};
const accepted=M.apply(s,{quality:fake});
assert.equal(accepted.report.accepted,1,'allowed counter chord-tone correction');
assert.equal(accepted.score.notes[1].midi,64);
assert.equal(s.notes[1].midi,60);
assert.equal(JSON.stringify(accepted.score.notes[0]),JSON.stringify(s.notes[0]),'outside-target unchanged');
const invalid={assess:()=>({issues:[{bar:0,metric:'voiceCollision'}],metrics:{}}),
 repair:({notes})=>({accepted:true,notes:notes.map((n,i)=>i===2?{...n,midi:64}:n),reason:'claimed improvement'})};
const anotherBar={duration:8,bpm:60,notes:[note(0,64,'chords'),note(0,60,'counter'),note(4,60,'counter')]};
const rejected=M.apply(anotherBar,{quality:invalid});
assert.equal(rejected.report.accepted,0,'another bar must never change');
assert.equal(JSON.stringify(rejected.score.notes),JSON.stringify(anotherBar.notes));
const malformed={assess:()=>({issues:[{bar:0,metric:'voiceCollision'}],metrics:{}}),
 repair:()=>({accepted:true,notes:null,reason:'invalid candidate'})};
const malformedResult=M.apply(s,{quality:malformed});
assert.equal(malformedResult.report.accepted,0,'malformed repair must be rejected');
assert.equal(JSON.stringify(malformedResult.score.notes),JSON.stringify(s.notes));
console.log('PASS M6 conservative score integration');
