const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx={window:{},Blob,console};const root=path.resolve(__dirname,'..');
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','motif-planner-v01.js',
 'melodic-grammar-v01.js','m1-motif-registry-v01.js','m1-motif-transform-v01.js',
 'm1-section-history-v01.js','handheld-v21.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const A=ctx.window.PlotuneAnalysis,H=ctx.window.PlotuneHandheld;
const input={title:'Return',character:'traveler',world:'forest',scene:'森を抜けてまた帰る',style:'handheld',duration:15};
const p=A.plan(input,A.analyze(input)),shared=H.prepare(p,'journey',null,false,input.scene);
const before=JSON.stringify(shared),off=H.score(shared);
const config={...shared,phaseSongForm:true,phaseArrangement:true,musicTransitions:true};
const on=H.score(config),again=H.score(config);
assert.equal(JSON.stringify(on.notes),JSON.stringify(again.notes),'same seed repeatable');
assert.equal(JSON.stringify(shared),before,'original plan preserved');
assert.notEqual(JSON.stringify(off.notes),JSON.stringify(on.notes),'Phase form/arrangement materially alter score');
assert.equal(off.details.phaseArrangement,null);
assert.equal(on.details.phaseArrangement,'four-section instrument entrance/exit plan');
assert.equal(on.details.phaseSongForm,'four-section dynamic arc');
assert(on.details.transitions.length>0,'Phase4 arrival preparation occurs');
assert.equal(off.details.transitions.length,0,'legacy Phase4 remains off');
assert(on.notes.every(n=>n.t>=0&&n.d>0&&n.t+n.d<=on.duration+.001));
console.log('PASS Phase1+Phase3+Phase4 score integration');
