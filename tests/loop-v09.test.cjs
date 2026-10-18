/* v0.9 contract: use WHOLE narrative to arrange consistent full-length loops.
 * All tests are deterministic, local JS and avoid external APIs.
 */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),window={},context={window,Blob,console};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','band-v09.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,L=window.PlotuneLoop,B=window.PlotuneBand;
const profile='ぽんぽんは人間に褒めてもらいたい。掃除の練習を続ける。';
const scenes=[
 'ぽんぽんはへんな音を聞いた。だけど、まだできないのでれんしゅうを続ける。',
 'ぽんぽんは掃除を始めた。ところが引っかかって転んだ。もう一度挑戦する。',
 'ぽんぽんは危険な音を聞いた。暗闇から怪物が迫る。',
 'ぽんぽんは練習を頑張って完成させた。できた！'
];
function prep(scene, duration=30, style='indie'){
 const input={title:'たぬきの里',character:profile,world:'静かな里',scene,style:'band',duration};
 const plan=A.plan(input,A.analyze(input),0),analysis=R.analyze(input);
 const baseline=L.baseline(B.adaptPlan(plan,style));
 const reactive=L.reactive(B.adaptPlan(R.attachPlan(plan,analysis),style),analysis);
 return {baseline,reactive,analysis,a:B.score(baseline),b:B.score(reactive)};
}
for(const s of scenes){
 const {baseline,reactive,a,b,analysis}=prep(s);
 assert.ok(analysis.events.length);
 assert.equal(a.details.loopMode,true);assert.equal(b.details.loopMode,true);
 assert.ok(reactive.loopArrangement?.active,'appraisal should select a global loop arrangement for '+s);
 assert.equal(a.details.loopBars,b.details.loopBars);
 assert.ok(Number.isInteger(b.details.loopBars));
 assert.equal(Math.round(b.duration/b.eighth)||b.details.loopBars>0,true);
 assert.ok(Math.abs(b.details.bpm-b.details.loopBars*240/30)<.001);
 assert.deepEqual(Array.from(a.details.theme),Array.from(b.details.theme),'stable character motif');
 assert.equal(b.details.narrativeIntegration,'whole-loop');
 assert.equal(b.details.breaks,0,'no mid-song narrative cuts for a reusable loop');
 assert.equal(b.details.cueHits,0,'no forced scene events at timestamps');
 assert.ok(b.details.globalArrangement?.progression?.length===4);
 // The entire loop must change, not just the last 20 seconds.
 const pick=score=>score.notes.filter(n=>n.t<1.5).map(n=>[n.instrument,n.midi,Math.round(n.t*100)] .join(':'));
 const change=JSON.stringify(pick(a))!==JSON.stringify(pick(b));
 assert.ok(change,'beginning 1.5s must be different: '+s);
 const beats=score=>score.percussion.filter(d=>d.t<2).map(d=>d.kind+'@'+Math.round(d.t*100));
 assert.notDeepEqual(beats(a),beats(b),'drum groove must differ from first beat');
 assert.notDeepEqual(a.details.harmonies.slice(0,2).map(x=>x.chord),b.details.harmonies.slice(0,2).map(x=>x.chord),
  'harmonic progression changes at the beginning');
 // MIDI material genuinely includes ONLY one guitar, one bass, one drum kit.
 assert.ok(b.notes.every(n=>['guitar','bass'].includes(n.instrument)));
 assert.ok(b.percussion.every(x=>x.t>=0&&x.t<b.duration));
}
const practice=prep('でも、れんしゅう。ひとりで挑戦する。');
assert.equal(practice.reactive.loopArrangement.preset,'effort');
assert.equal(practice.b.details.globalArrangement.guitar,'driving');
assert.equal(practice.b.details.globalArrangement.drums,'driving');
for(const seconds of [15,30,60]){
 for(const style of ['indie','rock','punk','ballad']){
  const p=prep(scenes[0],seconds,style),bars=p.b.details.loopBars;
  assert.equal(p.b.notes.length>10,true);
  assert.ok(bars>0&&Math.abs(p.b.details.bpm-(bars*240/seconds))<1e-9);
  assert.ok(p.b.notes.every(n=>n.t>=0&&n.t+n.d<=seconds+.001));
  assert.ok(p.b.percussion.length<1400,'mobile memory needs bounded note counts');
 }
}
const thirty=prep(scenes[0],30);
const reference=B.render(thirty.baseline),react=B.render(thirty.reactive);
assert.equal(reference.samples.length,30*22050);
assert.equal(react.samples.length,30*22050);
let diff=0,startDiff=0,startTotal=0;
for(let i=0;i<react.samples.length;i+=181){
 assert.ok(Number.isFinite(react.samples[i])&&Math.abs(react.samples[i])<=1);
 diff+=Math.abs(reference.samples[i]-react.samples[i]);
 if(i<2*22050){startDiff+=Math.abs(reference.samples[i]-react.samples[i]);startTotal++;}
}
assert.ok(startDiff/startTotal>.003,'A/B signal differs in first two seconds');
assert.ok(diff>0);
assert.ok(Math.abs(react.samples[react.samples.length-1]-react.samples[0])<.003,
 'circular edge crossfade must remove an audible hard click');
assert.equal(B.wavBlob(react.samples,react.sampleRate).size,react.samples.length*2+44);
const noEvent={title:'静か',character:'',world:'',scene:'窓辺に光がさす。',duration:30,style:'band'};
const q=A.plan(noEvent,A.analyze(noEvent));
const appraisal=R.analyze(noEvent);
assert.equal(L.analyzeWhole(appraisal).active,false,'no spurious psychological prediction');
const qBase=B.adaptPlan(q,'indie'),qRes=R.attachPlan(qBase,appraisal);
const dry=B.render(L.baseline(qBase)),wet=B.render(L.reactive(qRes,appraisal));
assert.deepEqual(Array.from(dry.samples),Array.from(wet.samples),
 'no evidence means same rendered audio throughout, including at the seam');
console.log('PASS v0.9: 0-second global differences, 4 styles, loop bars, audio edges, no fabricated contrast');
