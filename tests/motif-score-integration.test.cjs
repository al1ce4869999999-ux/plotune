const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{},Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','motif-planner-v01.js','melodic-grammar-v01.js','handheld-v21.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
const A=context.window.PlotuneAnalysis,H=context.window.PlotuneHandheld;
const input={title:'seeded phase2',character:'小さな冒険家',world:'森',scene:'森の道を歩いて帰る',style:'handheld',duration:30};
const analysis=A.analyze(input),planned=A.plan(input,analysis);
for(const preset of ['journey','musicbox','forestflute']){
 const prepared=H.prepare(planned,preset,null,false,input.scene);
 // The journey path is tested without the automatic scene palette, which
 // deliberately replaces its lead after shared-phrase composition.
 if(preset==='journey')prepared.instrumentChoice=null;
 const off=H.score(prepared);
 const on=H.score({...prepared,motifDevelopment:true});
 const again=H.score({...prepared,motifDevelopment:true});
 const a=off.notes.filter(n=>n.voice==='lead').map(n=>[n.t,n.d,n.midi]);
 const b=on.notes.filter(n=>n.voice==='lead').map(n=>[n.t,n.d,n.midi]);
 assert.ok(a.length&&b.length,'both modes must contain lead '+preset);
 assert.equal(JSON.stringify(on.notes),JSON.stringify(again.notes),'same seed deterministic '+preset);
 if(preset==='journey')assert.notEqual(JSON.stringify(a),JSON.stringify(b),'flag must affect audible score lead');
 assert.ok(on.notes.every(n=>Number.isFinite(n.t)&&Number.isFinite(n.d)&&Number.isFinite(n.midi)&&n.t>=0&&n.d>0&&n.t+n.d<=on.duration+.001),'bounds '+preset);
 assert.equal(JSON.stringify(off.notes),JSON.stringify(H.score(prepared).notes),'OFF stable '+preset);
}
console.log('PASS phase2 score: opted-in handheld lead variation, seed, bounds, legacy, instrument families');
