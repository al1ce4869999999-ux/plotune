const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{},Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
}
const H=context.window.PlotuneHandheld,A=context.window.PlotuneAnalysis;
const input={title:'seams',character:'旅人',world:'森',scene:'森の道を歩く',style:'handheld',duration:30};
const plan=A.plan(input,A.analyze(input));
const base=H.prepare(plan,'journey',null,false,input.scene);
const off=H.score({...base,musicDevelopment:false,musicHarmony:false,musicVoices:false,musicPerformance:false});
assert.equal(off.details.mSeamBridges.length,0,'legacy unaffected');
for(const transitions of [false,true]){
 const p={...base,musicDevelopment:true,musicHarmony:true,musicVoices:true,musicPerformance:true,musicTransitions:transitions};
 const a=H.score(p),b=H.score(p);
 assert.equal(JSON.stringify(a.notes),JSON.stringify(b.notes),'deterministic M boundary repair');
 assert(a.notes.every(n=>n.d>0&&n.t>=0&&n.t+n.d<=a.duration+.001),'valid note timing');
 assert.equal(a.details.mSeamBridges.length,0,'no speculative inserted seam notes');
 assert.equal(a.notes.filter(n=>n.transitionMarker==='m-seam-bridge').length,a.details.mSeamBridges.length);
}
console.log('PASS M section seam bridge regression');
