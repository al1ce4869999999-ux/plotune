const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},Math:Object.assign(Object.create(Math),{random(){throw Error('ambient RNG prohibited');}})};
vm.runInNewContext(fs.readFileSync('r9-listening-protocol.js','utf8'),ctx,{filename:'r9-listening-protocol.js'});
const R=ctx.window.PlotuneR9Listening;
const m=R.makeManifest(),n=R.makeManifest();
assert.equal(JSON.stringify(m),JSON.stringify(n),'same seeds generate same blind assignments');
assert.equal(m.pairs.length,36,'4 M7 conditions x 3 durations x 3 seeds');
assert.equal(new Set(m.pairs.map(p=>p.id)).size,36);
for(const p of m.pairs){
 assert.equal(p.items.length,2);assert.equal(p.items[0].slot,'A');assert.equal(p.items[1].slot,'B');
 assert.notEqual(p.items[0].researchEnabled,p.items[1].researchEnabled,'exactly one ON');
}
const responses=m.pairs.map(p=>({pairId:p.id,difference:false,preference:'tie',...Object.fromEntries(R.DIMENSIONS.filter(k=>!['difference','preference'].includes(k)).map(k=>[k,[3,3]]))}));
assert.equal(R.validateSubmission(m,{responses}),true);
assert.equal(R.validateSubmission(m,{responses:responses.slice(1)}),false,'no partial submissions');
assert.equal(R.validateSubmission(m,{responses:[...responses.slice(0,-1),responses[0]]}),false,'duplicate rejected');
assert.equal(R.validateSubmission(m,{responses:responses.map((x,i)=>i===0?{...x,naturalness:[0,3]}:x)}),false,'out-of-range rejected');
assert.throws(()=>R.makeManifest({seeds:[]}));
assert.throws(()=>R.makeManifest({conditions:['bogus']}));
console.log('PASS R9 deterministic blind assignment and complete structured survey');
