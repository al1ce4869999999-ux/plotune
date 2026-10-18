/* v1.0 handheld ensemble: seven independent score parts and iPhone loop PCM. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),window={},context={window,Blob,console};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','handheld-v10.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,H=window.PlotuneHandheld;
const scene='ぽんぽんは掃除を練習する。何度も挑戦した。';
const form={title:'たぬきの里',character:'ぽんぽんは人間に褒められたい',world:'明るい街',
 scene,duration:15,style:'handheld'};
const original=A.plan(form,A.analyze(form)),appraisal=R.analyze(form);
const required=['lead','counter','chords','arp','bass','sparkle','pad','drums'];
const voices=new Set();
for(const gameStyle of ['journey','village','mischief','mystery']){
 const base=H.prepare(original,gameStyle,appraisal,false);
 const reacted=H.prepare(R.attachPlan(original,appraisal),gameStyle,appraisal,true);
 const a=H.score(base),b=H.score(reacted);
 assert.equal(b.details.loopMode,true);
 assert.deepEqual(Array.from(a.details.theme),Array.from(b.details.theme),'shared motif');
 assert.equal(b.details.globalArrangement?.preset,'effort');
 for(const voice of required){
  assert.ok(b.details.parts[voice]>0,gameStyle+' is missing '+voice);
  voices.add(voice);
 }
 assert.ok(a.notes.length>120,'dense accompaniment instead of chip-only melody');
 assert.ok(a.details.parts.counter>10,'counterpoint is real');
 assert.ok(a.details.parts.arp>20,'broken chord part is real');
 assert.ok(a.details.parts.chords>20,'independent chords');
 assert.ok(a.details.parts.bass>15&&a.details.parts.drums>20);
 assert.ok(b.notes.every(n=>n.t>=0&&n.t+n.d<=15+.00001&&Number.isFinite(n.midi)));
 assert.ok(b.drums.every(n=>n.t>=0&&n.t<15));
 assert.ok(b.notes.length<3400,'iPhone memory budget');
 assert.ok(b.drums.length<1200);
 assert.notDeepEqual(a.harmony.slice(0,4).map(x=>x.chord),b.harmony.slice(0,4).map(x=>x.chord),
  'global harmony must change before 4-bar loop starts');
 const first=a.notes.filter(n=>n.t<1.8).map(n=>n.role+':'+n.midi+':'+n.t.toFixed(2));
 const second=b.notes.filter(n=>n.t<1.8).map(n=>n.role+':'+n.midi+':'+n.t.toFixed(2));
 assert.notDeepEqual(first,second,'0s arrangement must be affected');
 const track=H.render(reacted),baseline=H.render(base);
 assert.equal(track.samples.length,15*22050);
 assert.equal(track.samples.length,baseline.samples.length);
 assert.ok(track.details.loopBars>0&&Number.isInteger(track.details.loopBars));
 assert.ok(Math.abs(track.details.bpm*15/240-track.details.loopBars)<1e-8);
 let peak=0,diff=0,cnt=0;
 for(let i=0;i<track.samples.length;i+=191){
  const v=track.samples[i];assert.ok(Number.isFinite(v)&&Math.abs(v)<=1);
  peak=Math.max(peak,Math.abs(v));
  if(i<2*22050){diff+=Math.abs(v-baseline.samples[i]);cnt++;}
 }
 assert.ok(peak>.12,'musically non-silent');
 assert.ok(diff/cnt>.002,'start immediately sounds different');
 assert.ok(Math.abs(track.samples[0]-track.samples.at(-1))<.001,
   'waveform edge must be smooth');
 assert.equal(H.wavBlob(track.samples,track.sampleRate).size,track.samples.length*2+44);
}
assert.deepEqual([...voices].sort(),required.slice().sort());
for(const duration of [30,60]){
 const p={...form,duration},base=A.plan(p,A.analyze(p)),ap=R.analyze(p);
 const arranged=H.prepare(base,'journey',ap,true);
 const s=H.score(arranged);
 assert.ok(s.notes.length<3400&&s.drums.length<1200);
 assert.ok(s.notes.every(n=>n.d>0&&n.t+n.d<=duration+.001));
 assert.equal(s.details.loopBars*240/duration,s.bpm);
}
const quiet={...form,character:'',world:'',scene:'窓辺に光がさす。'};
const plain=A.plan(quiet,A.analyze(quiet)),none=R.analyze(quiet);
const p1=H.prepare(plain,'village',none,false),p2=H.prepare(plain,'village',none,true);
assert.equal(p2.loopArrangement,null,'neutral scene cannot fabricate emotional response');
assert.deepEqual(H.score(p1).notes.map(n=>[n.t,n.midi,n.voice]),
 H.score(p2).notes.map(n=>[n.t,n.midi,n.voice]));
const styles=['journey','village','mischief','mystery'].map(k=>H.STYLES[k].name);
assert.equal(new Set(styles).size,4);
console.log('PASS original 4 handheld styles: 7 voices, motif, 0s harmonic differences, WAV and loop-edge');
