/* Plotune v0.4 structural score regression. No packages, no network. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),window={};
for(const name of ['analyzer.js','resonare.js','composer-v04.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),{window,Blob,console},{filename:name});
}
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,C=window.PlotuneComposerV4;
const character='ぽんぽんは人間に褒められたい。掃除を上手にやりたい。';
const base={title:'たぬきの里',character,world:'のどかな里',style:'chip',duration:15};
const scene='ぽんぽんは褒めてもらおうと、得意げに掃除を始めた。ところが、ほうきが畳に引っかかって転んだ。もう一度挑戦する。そして、最後には上手にできた。';
const input={...base,scene},legacy=A.plan(input,A.analyze(input)),appraisal=R.analyze(input),adapted=R.attachPlan(legacy,appraisal);
assert.ok(appraisal.events.some(e=>e.cue==='anticipation'),'wishes must not be treated as achieved success');
assert.ok(appraisal.events.some(e=>e.cue==='stumble'),'setback');
assert.ok(appraisal.events.some(e=>e.cue==='recovery'),'recovery after neutral text');
const dry=C.buildScore(legacy),wet=C.buildScore(adapted);
assert.deepEqual(dry.theme,wet.theme,'character theme unchanged across arrangements');
assert.equal(dry.bpm,wet.bpm,'A/B has same BPM');
assert.equal(dry.duration,wet.duration,'A/B has same length');
assert.equal(dry.details.breaks,0,'control has no narrative cuts');
assert.ok(wet.details.breaks>=1,'stumble silences ongoing notes');
assert.ok(wet.rests.some(x=>x.end-x.start>.2),'audible break duration');
assert.ok(wet.notes.some(n=>n.role==='impact'),'impact not only a tiny auxiliary note');
assert.ok(wet.notes.some(n=>n.role==='recovery'),'theme returns after a setback');
assert.ok(wet.details.shiftedChords>0,'story modifies harmonic progression');
assert.ok(wet.details.harmonies.some(x=>x.alteration===1),'chromatic harmonic tension inserted');
assert.ok(wet.details.cueHits>=3,'story has multiple changes');
assert.ok(wet.details.percussionHits!==dry.details.percussionHits,'orchestration changes');
assert.ok(wet.details.melodyNotes!==dry.details.melodyNotes,'melodic rhythm or density changes');
assert.ok(wet.details.events.length===appraisal.events.length,'every event mapped');
const material=C.render(adapted),control=C.render(legacy);
assert.deepEqual(material.details.theme,control.details.theme,'renderer preserves theme');
assert.equal(material.samples.length,control.samples.length);
let absDiff=0,avgEnergy=0,n=material.samples.length,max=0;
for(let i=0;i<n;i+=53){
 const a=material.samples[i],b=control.samples[i];
 assert.ok(Number.isFinite(a)&&Math.abs(a)<=1,'finite bounded waveform');
 absDiff+=Math.abs(a-b);avgEnergy+=Math.abs(a);max=Math.max(max,Math.abs(a));
}
absDiff/=Math.ceil(n/53);avgEnergy/=Math.ceil(n/53);
assert.ok(absDiff>.035,'effect should be clearly measurable, not a tiny accent: '+absDiff);
assert.ok(avgEnergy>.015&&max>.20,'music must not be silence');
const check=R.analyze({...base,scene:'窓から木漏れ日がさした。'});
const quietPlan=R.attachPlan(A.plan({...base,scene:'窓から木漏れ日がさした。'},A.analyze({...base,scene:'窓から木漏れ日がさした。'})),check);
const quietScore=C.buildScore(quietPlan);
assert.equal(quietScore.details.breaks,0,'quiet scenes must not receive artificial drama');
assert.equal(quietScore.details.cueHits,0,'no invented dramatic cues');
// Character and scene are independent: alter scene, keep motif seed.
const different=A.plan({...input,scene:'木陰で眠った。'},A.analyze({...input,scene:'木陰で眠った。'}));
assert.deepEqual(C.buildScore(different).theme,dry.theme);
for(const seconds of [15,30,60]){
 const p={...adapted,duration:seconds};
 const s=C.buildScore(p);
 assert.ok(s.notes.every(n=>n.t>=0&&n.t+n.d<=seconds+.001),'bounded notes');
 assert.ok(s.rests.every(n=>n.start>=0&&n.end<=seconds),'bounded rests');
 assert.ok(s.notes.length<3000,'mobile-friendly score size');
}
assert.equal(C.wavBlob(material.samples,material.sampleRate).size,material.samples.length*2+44,'valid WAV size');
console.log('PASS v0.4: expectations, recoveries, structure, 2-beat harmony, audible pauses, music density, bounded PCM, WAV');
