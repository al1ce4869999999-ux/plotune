// Node/CommonJS score regression; no browser or audio device required.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context={window:{}};
for(const name of ['motif-planner-v01.js','melodic-grammar-v01.js','handheld-v21.js']){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
}
const score=context.window.PlotuneHandheld.score;
const plan={gameStyle:'journey',duration:30,seed:34567,characterSeed:789,
 root:60,mode:'major',motifDevelopment:true};
const on=score(plan),again=score(plan);
const off=score({...plan,motifDevelopment:false});
const digest=s=>JSON.stringify({notes:s.notes,drums:s.drums,harmony:s.harmony});
assert.equal(digest(on),digest(again),'same seed remains deterministic');
assert.notEqual(digest(on),digest(off),'Phase 2 changes the actual played score');
const bars=Math.max(1,Math.round(132*30/240)),meter=30/bars;
const lead=s=>s.notes.filter(n=>n.voice==='lead');
const counter=s=>s.notes.filter(n=>n.voice==='counter');
assert.ok(lead(on).length>0,'primary melody remains audible');
assert.ok(counter(on).some(n=>n.t>=meter*bars/4),'development has answers');
assert.ok(on.notes.every(n=>n.t>=0&&n.t<30&&n.d>0&&n.t+n.d<=30.00001),'note bounds');
assert.ok(on.drums.every(n=>n.volume>=0&&n.volume<=1),'drum dynamics bounded');

const chordNotes=on.notes.filter(n=>n.voice==='chords');
const simultaneous=chordNotes.some(n=>chordNotes.filter(x=>Math.abs(x.t-n.t)<.000001).length>=3);
assert.ok(simultaneous,'simultaneous triads must be present in played notes');
const openingDrums=on.drums.filter(n=>n.t<30*.12);
const peakDrums=on.drums.filter(n=>n.t>=30*.50&&n.t<30*.75);
assert.ok(peakDrums.length>openingDrums.length,'percussion joins after opening');
const chordOnsets=[...new Set(chordNotes.map(n=>n.t.toFixed(4)))].map(Number);
assert.ok(chordOnsets.some(t=>Math.abs(t/meter-Math.round(t/meter))>.08),
 'some chord changes follow a phrase inside a measure');
console.log('PASS phase2 score: opt-in, deterministic, layered answers, safe timing');
