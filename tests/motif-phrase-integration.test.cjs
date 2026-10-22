const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const window={},context={window};
for(const file of ['motif-planner-v01.js','melodic-grammar-v01.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
const G=window.PlotuneMelodicGrammar,P=window.PlotuneMotifPlanner;
const config=G.grammar({character:{themeIdentity:{value:'character-1'}}},{},314159);
const baseline=G.composePhrase(config,0);
const identity=P.capture(baseline);
const original=G.composePhrase(config,1);
const unchanged=G.composePhrase(config,1,{});
assert.equal(JSON.stringify(original),JSON.stringify(unchanged),'OFF path unchanged');
const opts={motifIdentity:identity,motifTransform:'variation'};
const varied=G.composePhrase(config,1,opts);
const returnA=G.composePhrase(config,3,{motifIdentity:identity,motifTransform:'return'});
assert.equal(JSON.stringify(varied),JSON.stringify(G.composePhrase(config,1,opts)),'seeded transformation is stable');
assert.notEqual(JSON.stringify(varied.map(x=>x.degree)),JSON.stringify(baseline.map(x=>x.degree)),'variation modifies melody');
assert.equal(returnA[returnA.length-1].degree,identity.anchors[0].degree,'return closes on identity anchor');
assert.ok(returnA[returnA.length-1].cadence,'return cadence is marked');
for(const output of [varied,returnA]){
 assert.ok(output.some(x=>!x.rest),'audible phrase');
 assert.ok(output.every(x=>x.position>=0&&x.position+x.durationUnits<=16.001&&x.degree>=0&&x.degree<=8));
}
const absent={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../melodic-grammar-v01.js'),'utf8'),absent);
const missing=absent.window.PlotuneMelodicGrammar.grammar({}, {}, 123);
assert.throws(()=>absent.window.PlotuneMelodicGrammar.composePhrase(missing,1,{motifIdentity:identity}),/PlotuneMotifPlanner/);
console.log('PASS phase2 integration: opt-in shared phrase path and legacy stability');
