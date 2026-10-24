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
assert.throws(()=>apply(score,{semitones:8}),{name:'TypeError'});
console.log('PASS M3 resolved temporary tonicization');
