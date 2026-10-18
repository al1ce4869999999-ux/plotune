/* v1.3 piano unison: four-piece score, real PCM and nonbreaking 3-piece */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),window={},context={window,Blob,console};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','band-v09.js','band-piano-v13.js','comparison-v13.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,L=window.PlotuneLoop,B=window.PlotuneBand,P=window.PlotuneBandPiano,C=window.PlotuneCompare;
const input={title:'ぽんぽん',character:'人間に褒められたい',world:'たぬきの里',scene:'練習して転んでまた挑戦する。',duration:30,style:'bandpiano'};
function plans(style,duration=30){
 const data={...input,duration};
 const basic=A.plan(data,A.analyze(data));
 const appraisal=R.analyze(data);
 return {base:L.baseline(P.adaptPlan(basic,style)),rich:L.reactive(P.adaptPlan(R.attachPlan(basic,appraisal),style),appraisal)};
}
for(const duration of [15,30,60])for(const style of ['indie','rock','punk','ballad']){
 const {base,rich}=plans(style,duration);
 for(const plan of [base,rich]){
  const score=P.score(plan);
  assert.equal(score.details.genre,'bandpiano');
  assert.deepEqual(Array.from(score.details.instruments),['guitar','piano','bass','drums']);
  assert.equal(score.details.loopBars*240/duration,score.bpm);
  const piano=score.notes.filter(n=>n.instrument==='piano');
  const guitar=score.notes.filter(n=>n.instrument==='guitar');
  assert.ok(piano.length>8,'piano must contribute throughout, not a one-time cue');
  assert.ok(guitar.length>piano.length,'one main guitar with piano accents');
  assert.ok(score.details.pianoUnisonNotes>5);
  assert.ok(piano.every(n=>n.t>=0&&n.t+n.d<=duration+.001&&n.v>0));
  assert.ok(score.notes.some(n=>n.instrument==='bass'));
  assert.ok(score.percussion.length>10);
  const pianoUnison=piano.filter(n=>n.role==='unison');
  assert.ok(pianoUnison.every(n=>guitar.some(g=>
    g.role==='riff'&&Math.abs(g.t-n.t)<.00001&&Math.abs(g.midi-n.midi)<.01&&Math.abs(g.d-n.d)<.00001)),
    'all piano unisons must be exactly doubled by same-pitch guitar notes');
  assert.ok(pianoUnison.some(n=>n.t===0),'audible unison from first downbeat');
 }
}
const original=B.score(L.baseline(B.adaptPlan(A.plan(input,A.analyze(input)),'indie')));
assert.deepEqual(Array.from(original.details.instruments),['guitar','bass','drums'],'original three piece unchanged');
assert.ok(!original.notes.some(n=>n.instrument==='piano'));
const two=plans('indie',15);const wav=P.render(two.rich),reference=P.render(two.base);
assert.equal(wav.samples.length,15*22050);
assert.equal(P.wavBlob(wav.samples,wav.sampleRate).size,wav.samples.length*2+44);
assert.ok(wav.samples.every(Number.isFinite));
let diff=0,peak=0;
for(let i=0;i<wav.samples.length;i+=171){
 diff+=Math.abs(wav.samples[i]-reference.samples[i]);peak=Math.max(peak,Math.abs(wav.samples[i]));
}
assert.ok(peak>.05&&peak<=1&&diff>1);
assert.ok(Math.abs(wav.samples[0]-wav.samples.at(-1))<.005,'loop edge');
const roles=C.roleChanges(reference,wav,0,5);
assert.ok(roles.piano.base>0&&roles.piano.resonare>0,'piano A/B analysis');
assert.ok(roles.guitar.base>0&&roles.bass.base>0&&roles.drums.base>0);
console.log('PASS 1.3: all 4 styles, 15/30/60 loop, exact pitch/time guitar+piano unison, PCM, WAV and A/B');