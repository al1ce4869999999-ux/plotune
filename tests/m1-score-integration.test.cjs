/* Run with: node tests/m1-score-integration.test.cjs */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{},Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','handheld-v21.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
const A=context.window.PlotuneAnalysis,H=context.window.PlotuneHandheld;
const input={title:'motif',character:'旅人',world:'森',scene:'森を歩いて帰る',style:'handheld',duration:15};
const plan=A.plan(input,A.analyze(input)),prepared=H.prepare(plan,'journey',null,false,input.scene);
const original=H.score(prepared),off=H.score({...prepared,musicDevelopment:false,musicHarmony:false,motifDevelopment:false});
assert.equal(JSON.stringify(original.notes),JSON.stringify(off.notes),'M1 opt-in keeps legacy notes');
assert.equal(original.details.melodySelection,null,'legacy has no candidate selection');
const options={...prepared,musicDevelopment:true,musicHarmony:true,motifDevelopment:true,m1CandidateSelection:true};
const a=H.score(options),b=H.score(options);
assert.equal(JSON.stringify(a.notes),JSON.stringify(b.notes),'same seed yields same notes');
assert.ok(a.notes.some(n=>n.voice==='lead'));
assert.equal(a.details.melodySelection.scores.length,6);
assert.ok(a.details.melodySelection.selectedIndex>=0&&a.details.melodySelection.selectedIndex<6);
console.log('PASS M1 score integration: opt-in, notes, diagnostics and seed');
