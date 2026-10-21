const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),window={},ctx={window,Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','band-piano-v13.js','band-piano-v14.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,L=window.PlotuneLoop,B=window.PlotuneBandPiano;
const input={title:'ぽんぽん',character:'人間に褒められたい',world:'里',scene:'転んでも、練習を続ける。',duration:15,style:'bandpiano'};
const plan=A.plan(input,A.analyze(input)),ap=R.analyze(input);
assert.ok(B.STYLES.glassrock&&B.STYLES.glassrock.drive<2);
const make=(style,duration,react)=>{let p={...plan,duration};p=B.adaptPlan(react?R.attachPlan(p,ap):p,style);
 return B.score(react?L.reactive(p,ap):L.baseline(p))};
for(const length of [15,30,60]){
 for(const reacted of [false,true]){
  const s=make('glassrock',length,reacted);
  assert.equal(s.details.genre,'bandpiano');
  assert.ok(s.notes.filter(n=>n.instrument==='guitar'&&n.role==='riff').length>=12);
  assert.ok(s.notes.filter(n=>n.instrument==='bass').length>=16);
  assert.ok(s.notes.filter(n=>n.instrument==='piano').length>=4);
  assert.ok(s.percussion.filter(n=>n.kind==='snare').length>=4);
  const p=s.notes.filter(n=>n.instrument==='piano'&&n.role==='unison');
  assert.ok(p.every(n=>s.notes.some(g=>g.instrument==='guitar'&&g.role==='riff'&&g.midi===n.midi&&g.t===n.t&&g.d===n.d)));
  assert.ok(s.notes.every(n=>n.t>=0&&n.t+n.d<=length+.001));
  assert.ok(Math.abs(s.details.loopBars*240/length-s.bpm)<.00001);
 }
}
const p=L.baseline(B.adaptPlan({...plan,duration:15},'glassrock'));
const result=B.render(p);
assert.equal(result.samples.length,15*22050);
assert.ok(result.samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=1));
assert.ok(Math.abs(result.samples.at(-1)-result.samples[0])<.003);
assert.equal(B.wavBlob(result.samples,result.sampleRate).size,result.samples.length*2+44);
const old=make('indie',15,false),fresh=make('glassrock',15,false);
const pattern=s=>s.notes.filter(n=>n.instrument==='bass'&&n.t<3).map(n=>n.midi+':'+n.t.toFixed(2));
assert.notDeepEqual(pattern(old),pattern(fresh),'the bass really has a different melodic pattern');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('value="glassrock"')&&/src="band-piano-v(?:14|15)\.js(?:\?[^"]*)?"/.test(html));
console.log('PASS v1.4: moving bass, articulated guitar, restrained piano, 15/30/60 loops, WAV, original pattern');
