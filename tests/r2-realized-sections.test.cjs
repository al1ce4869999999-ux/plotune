const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},Blob,console};
for(const f of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','motif-planner-v01.js','melodic-grammar-v01.js','tension-r2a.js','tension-r2b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m5-performance-v01.js','handheld-v21.js'])
 vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const H=ctx.window.PlotuneHandheld,A=ctx.window.PlotuneAnalysis,T=ctx.window.PlotuneTensionR2a,R=ctx.window.PlotuneTensionR2b;
const x={character:'旅人',world:'森',scene:'森から帰還',duration:15};
const p=A.plan(x,A.analyze(x)),base={...H.prepare(p,'journey',null,false,x.scene),musicDevelopment:true,musicHarmony:true,musicPerformance:true};
const tensionPlan=T.plan({emotionPlan:{sections:[{name:'A'},{name:'B'}]}},{tonal:[.2,.8],rhythmic:[.8,.2],dynamic:[.1,.9]});
const off=H.score(base),on=H.score({...base,musicTensionR2:true,tensionPlan});
assert.equal(JSON.stringify(on.harmony),JSON.stringify(off.harmony));
assert.equal(on.details.tensionR2.realized.length,2);
for(const s of on.details.tensionR2.realized){
 assert(s.notes>0,'section contains notes');
 assert(s.assessment,'section has assessment');
 assert(s.assessment.measuredCount>0,'finite matching metrics');
 assert(s.assessment.components.tonal.status==='measured');
 assert(s.assessment.components.dynamic.status==='measured');
}
assert.equal(JSON.stringify(on.details.tensionR2.realized),JSON.stringify(H.score({...base,musicTensionR2:true,tensionPlan}).details.tensionR2.realized));
const original=JSON.stringify(on.notes);
const independent=R.realized(on.notes,tensionPlan.sections,on.duration);
assert.equal(JSON.stringify(independent),JSON.stringify(on.details.tensionR2.realized));
assert.equal(JSON.stringify(on.notes),original,'evaluation is read-only');
const fallback=R.realized([{t:0,d:-1,midi:60,volume:.2,voice:'lead'}],tensionPlan.sections,15);
assert.equal(fallback[0].assessment,null,'invalid score metric falls back without abort');
assert(fallback[0].diagnostics.some(d=>d.code==='EVALUATOR_FALLBACK'));
console.log('PASS R2 real score six-axis sections, deterministic metrics, read-only and fallback');
