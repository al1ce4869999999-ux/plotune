const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),window={},ctx={window,Blob,console};
for(const f of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','handheld-v21.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,H=window.PlotuneHandheld;
function make(scene,style,duration){const input={title:'t',character:'',world:'',scene,style:'handheld',duration};
const p=A.plan(input,A.analyze(input));return H.prepare(p,style,R.analyze(input),false,scene)}
for(const duration of [15,30,60]){
const p=make('ぽんぽんは大切な友達が亡くなったと知り、泣き崩れた','sadness',duration),s=H.score(p);
assert.equal(s.details.emotionalArc.gravity,'low-pedal-and-unresolved-cluster');
for(const type of ['gravity-pedal','gravity-floor','dark-cluster','hollow-afterglow'])
assert.ok(s.notes.some(n=>n.arcMarker===type),type);
assert.equal(s.notes.filter(n=>n.arcMarker==='dark-cluster').length,3);
assert.ok(s.notes.find(n=>n.arcMarker==='gravity-floor').midi<s.notes.find(n=>n.arcMarker==='gravity-pedal').midi);
assert.ok(s.notes.every(n=>n.d>0&&n.t>=0&&n.t+n.d<=duration+.001));
const audio=H.render(p);
assert.equal(audio.samples.length,duration*22050);
assert.ok(audio.samples.every(n=>Number.isFinite(n)&&Math.abs(n)<=1));
assert.ok(Math.abs(audio.samples[0]-audio.samples.at(-1))<.003);
}
const gentle=H.score(make('ぽんぽんが涙をこらえて泣いた','sadness',15));
assert.equal(gentle.details.emotionalArc,null,'ordinary tears should not trigger catastrophic grief');
const happy=H.score(make('うれしくて笑った','joy',15));
assert.equal(happy.details.emotionalArc,null);
assert.ok(!happy.notes.some(n=>n.arcMarker==='gravity-floor'));
console.log('PASS grief gravity v2.1');
