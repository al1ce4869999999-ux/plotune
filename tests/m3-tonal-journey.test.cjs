const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync('m3-tonal-journey-v01.js','utf8'),context);
const apply=context.window.PlotuneM3TonalJourney.apply;
const score={duration:16,harmony:[0,4,8,12].map(t=>({t,chord:0})),notes:[
 {t:0,d:.5,midi:60,voice:'lead'},{t:8,d:.5,midi:62,voice:'lead'},
 {t:9,d:.5,midi:65,voice:'counter'},{t:9,d:.5,midi:36,voice:'bass'},
 {t:11,d:.5,midi:64,voice:'chords'},{t:12,d:.5,midi:60,voice:'lead'},
 {t:9,d:.2,voice:'drums',midi:35}]};
const saved=JSON.stringify(score);
const out=apply(score);
assert.equal(out.notes[0].midi,60);
assert.deepEqual(out.notes.slice(1,5).map(n=>n.midi),[64,67,38,66]);
assert.equal(out.notes[5].midi,60,'tonic return');
assert.equal(out.notes[6].midi,35,'drums unchanged');
assert.deepEqual(out.harmony.map(h=>h.keyOffset),[0,0,2,0]);
assert.equal(JSON.stringify(score),saved,'source preserved');
assert.equal(JSON.stringify(out),JSON.stringify(apply(score)),'deterministic');
const major={duration:16,bpm:60,harmony:[{t:0,chord:0},{t:4,chord:3},{t:8,chord:4},{t:12,chord:0}],
 notes:[{t:4,d:1,midi:65,voice:'pad'},{t:4,d:1,midi:69,voice:'pad'},
 {t:4,d:1,midi:72,voice:'pad'},{t:4,d:1,midi:69,voice:'lead'}]};
const minorIV=apply(major,{tonic:60,mode:'major'});
assert.equal(minorIV.notes[1].midi,68,'minor iv third borrowed from parallel minor');
assert.equal(minorIV.notes[3].midi,69,'melody identity stays unchanged');
assert.equal(minorIV.tonalJourney.borrowed.function,'iv borrowed from parallel minor');
assert.equal(JSON.stringify(major.notes[1]),JSON.stringify({t:4,d:1,midi:69,voice:'pad'}));
assert.equal(apply(major,{tonic:60,mode:'minor'}).tonalJourney.borrowed,null);
assert.throws(()=>apply(score,{semitones:8}),{name:'TypeError'});
console.log('PASS M3 resolved temporary tonicization');
