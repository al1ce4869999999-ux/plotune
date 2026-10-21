const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};ctx.window=ctx;
for(const file of ['composition-plan-v1.js','melodic-grammar-v01.js','motif-planner-v1.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx);
const g=ctx.PlotuneMelodicGrammar.grammar(null,null,42);
const compose=ctx.PlotuneMelodicGrammar.composePhrase;
for(const bars of [4,8,16,32]){
 const p=ctx.PlotuneCompositionPlan.create({bars,seed:42});
 const x=ctx.PlotuneMotifPlanner.build(p,compose,g,.65);
 const y=ctx.PlotuneMotifPlanner.build(p,compose,g,.65);
 assert.equal(JSON.stringify(x),JSON.stringify(y),'deterministic motifs');
 assert.equal(x.phrases.length,bars);
 assert.ok(x.phrases.every(bar=>bar.every(n=>n.position>=0&&n.position<16&&n.durationUnits>0&&n.position+n.durationUnits<=16.001)));
 const last=x.phrases.at(-1).at(-1);
 assert.equal(last.degree,0,'final tonic');
 assert.equal(last.rest,false,'final sounding note');
}
console.log('MotifPlanner structural tests passed');
