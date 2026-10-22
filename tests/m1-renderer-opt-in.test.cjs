const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function load(withM){
 const window={},context={window,console,Blob};
 const files=['analyzer.js','resonare-v08.js','loop-arranger-v09.js','melodic-grammar-v01.js'];
 if(withM)files.push('m1-motif-registry-v01.js','m1-motif-transform-v01.js');
 files.push('handheld-v21.js');
 for(const file of files)vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
 return window;
}
const legacy=load(false),modern=load(true);
const input={title:'テーマ',character:'探索する',world:'森',scene:'静かな道を歩く。',style:'handheld',duration:30};
const p=modern.PlotuneAnalysis.plan(input,modern.PlotuneAnalysis.analyze(input));
const prior=legacy.PlotuneHandheld.prepare(p,'journey',null,false,input.scene);
const current=modern.PlotuneHandheld.prepare(p,'journey',null,false,input.scene);
const baseline=legacy.PlotuneHandheld.score(prior);
const off=modern.PlotuneHandheld.score({...current,musicDevelopment:false});
const on=modern.PlotuneHandheld.score({...current,musicDevelopment:true});
const onAgain=modern.PlotuneHandheld.score({...current,musicDevelopment:true});
// Actual handheld score contract: note classification is `voice`, not `role`.
function lead(s){
 assert.ok(Array.isArray(s.notes)&&s.notes.length>0,'nonempty score notes required');
 assert.ok(s.notes.every(n=>typeof n.voice==='string'&&n.voice.length>0),
  'each handheld note must expose its actual voice field');
 const selected=s.notes.filter(n=>n.voice==='lead');
 assert.ok(selected.length>0,'lead voice must exist before comparing melody');
 assert.ok(selected.every(n=>Number.isFinite(n.midi)&&Number.isFinite(n.t)&&Number.isFinite(n.d)),
  'lead notes must expose midi/t/d');
 return selected.map(n=>[n.t,n.midi,n.d]);
}
assert.throws(()=>lead({notes:[]}),/nonempty score notes/,'empty score must not pass');
assert.throws(()=>lead({notes:[{role:'lead',midi:60,t:0,d:1}]}),/actual voice field/,'wrong field must not pass');
assert.throws(()=>lead({notes:[{voice:'bass',midi:48,t:0,d:1}]}),/lead voice must exist/,'empty selection must not pass');
assert.ok(lead(baseline).length>0,'baseline must have lead events');
assert.ok(lead(off).length>0,'OFF must have lead events');
assert.ok(lead(on).length>0,'ON must have lead events');
assert.equal(JSON.stringify(baseline.notes),JSON.stringify(off.notes),'OFF must preserve all legacy notes');
assert.equal(JSON.stringify(baseline.drums),JSON.stringify(off.drums),'OFF must preserve percussion');
assert.equal(JSON.stringify(baseline.harmony),JSON.stringify(off.harmony),'OFF must preserve harmony');
assert.equal(JSON.stringify(lead(on)),JSON.stringify(lead(onAgain)),'ON is deterministic');
assert.notEqual(JSON.stringify(lead(off)),JSON.stringify(lead(on)),'ON must affect rendered melody');
assert.equal(on.details.mDevelopmentActive,true);
assert.equal(off.details.mDevelopmentActive,false);
assert.ok(on.notes.every(n=>n.d>0&&n.t>=0&&n.t+n.d<=30+.001),'notes are bounded');
assert.ok(on.drums.every(n=>n.t>=0&&n.t<30),'drums are bounded');
assert.equal(JSON.stringify(off.harmony),JSON.stringify(on.harmony),'motif stage must not unexpectedly rewrite harmony');
console.log('PASS M1 renderer: opt-in lead changes, fixed seed, preserved OFF and bounded score');
