const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{},Blob,console};
for(const f of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','motif-planner-v01.js','melodic-grammar-v01.js','tension-r2a.js','tension-r2b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','handheld-v21.js'])
 vm.runInNewContext(fs.readFileSync(f,'utf8'),context,{filename:f});
const A=context.window.PlotuneAnalysis,H=context.window.PlotuneHandheld,T=context.window.PlotuneTensionR2a;
const input={title:'R2 score integration',character:'旅人',world:'森',scene:'帰還と対比',style:'handheld',duration:15};
const p=A.plan(input,A.analyze(input)),prepared=H.prepare(p,'journey',null,false,input.scene);
const opts={...prepared,musicHarmony:true,musicDevelopment:true,motifDevelopment:true};
const baseline=H.score(opts);
const tensionPlan=T.plan({emotionPlan:{sections:[{name:'A'},{name:'B'}]}},{tonal:[.2,.9],rhythmic:[.8,.1],density:[.1,.7]});
const enhanced=H.score({...opts,musicTensionR2:true,tensionPlan});
assert.equal(JSON.stringify(enhanced.notes),JSON.stringify(baseline.notes),'R2b trace does not alter notes');
assert.equal(JSON.stringify(enhanced.harmony),JSON.stringify(baseline.harmony),'R2b trace does not alter harmony');
assert.equal(enhanced.details.tensionR2.mode,'shadow-only');
assert(enhanced.details.tensionR2.phrase.length>0,'M2 candidate trace emitted');
assert(enhanced.details.tensionR2.harmony.length>0,'M3 candidate trace emitted');
assert(!baseline.details.tensionR2,'OFF has no R2 diagnostics');
assert.equal(JSON.stringify(H.score({...opts,musicTensionR2:true,tensionPlan}).details.tensionR2),
 JSON.stringify(enhanced.details.tensionR2),'R2b diagnostic determinism');
assert.equal(JSON.stringify(H.score({...opts,musicTensionR2:true}).notes),JSON.stringify(baseline.notes),'missing plan falls back');
console.log('PASS R2b on real score: independent tension plan, M2/M3 trace, deterministic, no change to notes/harmony');
