const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{}},root=path.resolve(__dirname,'..');
for(const f of ['m1-motif-registry-v01.js','m1-motif-transform-v01.js','m1-section-history-v01.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
const registry=context.window.PlotuneMotifRegistry,motif=registry.register('A',[{position:0,durationUnits:1,degree:3},{position:2,durationUnits:1,degree:5}]);
const sections=[{sectionId:'opening',motifReferences:['A']},{sectionId:'return',motifReferences:['A']}];
const render=context.window.PlotuneMotifSectionHistory.realize;
const opts={rules:{opening:{kind:'transposition',options:{steps:0}},return:{kind:'inversion'}}};
const before=JSON.stringify(motif),one=render(sections,{A:motif},opts),two=render(sections,{A:motif},opts);
assert.equal(JSON.stringify(one),JSON.stringify(two),'deterministic section history');
assert.equal(one.trace.length,2);
assert.equal(one.trace[0].operation,'transposition');
assert.equal(one.trace[1].operation,'inversion');
assert.equal(one.variations[0].events[1].degree,5);
assert.equal(one.variations[1].events[1].degree,1);
assert.equal(JSON.stringify(motif),before,'source motif unchanged');
assert.throws(()=>render([{sectionId:'oops',motifReferences:['missing']}],{A:motif}),/missing motif/);
console.log('PASS M1-3 section motif history');
