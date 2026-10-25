const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{},Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','handheld-v21.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
const A=context.window.PlotuneAnalysis,H=context.window.PlotuneHandheld,M=context.window.PlotuneM3Harmony;
const sample=[{position:0,durationUnits:2,degree:1,rest:false},{position:4,durationUnits:2,degree:5,rest:false},{position:8,durationUnits:2,degree:4,rest:false},{position:12,durationUnits:2,degree:3,rest:false}];
const source=Array.from({length:8},()=>sample.map(e=>({...e})));
// M3 degree coordinates are tonic-relative, not chord-relative.
const tonic=[{position:0,durationUnits:2,degree:0,rest:false}];
assert(M.phraseFit(tonic,0,.4)>M.phraseFit(tonic,1,.4),
 'harmonic fitness must respond to the chord root');
// Source-level guard: all sadness layers must use the M3 progression,
// including the second-pass pad/counter/sparkle orchestration.
const engine=fs.readFileSync(path.join(__dirname,'../handheld-v21.js'),'utf8');
assert.match(engine,/const start=bar\*meter,degree=m3JointPlan\?m3JointPlan\.chords\[bar\]:chordSteps\[bar%4\],unit=meter\/16/);
assert.match(engine,/m3JointPlan\?meter:meter\*1\.67/,'M3 pads may not bleed into following chord');
assert.match(engine,/m3JointPlan\?scale:MAJOR/,'M3 backing must use the active mode');
const saved=JSON.stringify(source);
const plan=M.plan(source,{progression:[0,4,5,3],tension:.4});
assert.equal(JSON.stringify(plan),JSON.stringify(M.plan(source,{progression:[0,4,5,3],tension:.4})),'deterministic');
assert.equal(JSON.stringify(source),saved,'source preserved');
assert.equal(plan.chords.length,8);assert.equal(plan.phrases.length,8);
assert.equal(plan.chords.at(-1),0,'final tonic cadence');
assert.ok(plan.chords.every(x=>Number.isInteger(x)&&x>=0&&x<7));
assert.ok(plan.phrases.flat().every(e=>e.position>=0&&e.position+e.durationUnits<=16.001));
assert.throws(()=>M.plan([]),/phrase bars/);
const input={title:'harmonic movement',character:'小さな旅人',world:'森',scene:'森を進み、最後に帰る',style:'handheld',duration:30};
const p=A.plan(input,A.analyze(input));
for(const preset of ['journey','musicbox','forestflute']){
 const prepared=H.prepare(p,preset,null,false,input.scene);
 const legacy=H.score(prepared);
 const on=H.score({...prepared,musicHarmony:true,musicDevelopment:true,motifDevelopment:true});
 const again=H.score({...prepared,musicHarmony:true,musicDevelopment:true,motifDevelopment:true});
 const meter=on.duration/on.details.loopBars;
 for(const note of on.notes.filter(n=>['bass','pad','chords'].includes(n.voice))){
  const bar=Math.min(on.harmony.length-1,Math.floor((note.t+1e-8)/meter));
  if(bar<on.harmony.length-1&&on.harmony[bar].chord!==on.harmony[bar+1].chord)
   assert.ok(note.t+note.d<=(bar+1)*meter+1e-6,
    'M3 accompaniment must not bleed across chord change '+preset);
 }
 assert.equal(JSON.stringify(on.harmony),JSON.stringify(again.harmony),'seed stable harmony '+preset);
 assert.equal(JSON.stringify(on.notes),JSON.stringify(again.notes),'seed stable notes '+preset);
 assert.notEqual(JSON.stringify(on.harmony),JSON.stringify(legacy.harmony),'harmonic path changes '+preset);
 assert.ok(on.notes.some(x=>x.voice==='lead'),'audible lead '+preset);
 assert.ok(on.notes.some(x=>['chords','pad','arp','bass'].includes(x.voice)),'audible harmonic accompaniment '+preset);
 assert.ok(on.notes.every(n=>n.t>=0&&n.d>0&&n.t+n.d<=on.duration+.001),'time bounds '+preset);
 // Timbre arrangement must not replace the M3-composed lead with a preset pattern.
 const joint=H.score({...prepared,musicHarmony:true,musicDevelopment:true,motifDevelopment:true});
 const endBar=joint.duration-joint.duration/joint.details.loopBars;
 const last=joint.notes.filter(n=>n.voice==='lead'&&n.t>=endBar).sort((a,b)=>a.t-b.t).at(-1);
 assert.ok(last,'M3 cadence exists '+preset);
 assert.equal(last.midi%12,0,'M3 ending retains tonic pitch class '+preset);
 assert.equal(JSON.stringify(H.score(prepared).notes),JSON.stringify(legacy.notes),'legacy score remains fixed '+preset);
}
assert.match(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),/m3-harmony-melody-v01\.js/);
console.log('PASS M3 joint harmony melody: deterministic, cadence, instruments, legacy, bounds');
