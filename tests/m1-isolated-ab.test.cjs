/* Run with: node tests/m1-isolated-ab.test.cjs */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{},Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','handheld-v21.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
const A=context.window.PlotuneAnalysis,H=context.window.PlotuneHandheld,G=context.window.PlotuneMelodicGrammar;
const input={title:'M1 isolated comparison',character:'旅人',world:'森',scene:'森を歩いて帰る',style:'handheld',duration:15};
const plan=A.plan(input,A.analyze(input)),prepared=H.prepare(plan,'journey',null,false,input.scene);
const opts={...prepared,musicDevelopment:true,musicHarmony:true,motifDevelopment:true};
const legacy=H.score({...opts,m1CandidateSelection:false}),selected=H.score(opts);
assert.equal(legacy.details.melodySelection,null,'OFF disables candidate ranking');
assert.equal(selected.details.melodySelection.scores.length,6,'ON exposes six scores');
assert.equal(JSON.stringify(selected.notes),JSON.stringify(H.score(opts).notes),'ON deterministic');
assert.equal(JSON.stringify(legacy.notes),JSON.stringify(H.score({...opts,m1CandidateSelection:false}).notes),'OFF deterministic');
assert.ok(selected.notes.some(n=>n.voice==='lead')&&legacy.notes.some(n=>n.voice==='lead'));
for(const seed of [1,6,7,8]){
 const grammar=G.grammar({character:{},world:{},scene:{}},{},seed);
 const ranked=G.selectMelody(grammar,0);
 assert.ok(ranked.candidates[0].score>=ranked.candidates.find(c=>c.index===0).score);
}
console.log('PASS M1 isolated A/B score contract and legacy candidate');
