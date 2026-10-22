const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const window={},context={window};
for(const file of ['melodic-grammar-v01.js','m2-emotion-phrase-v01.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
const G=window.PlotuneMelodicGrammar,M=window.PlotuneM2Phrase;
const g=G.grammar({character:{themeIdentity:{value:'M2-test'}}},{},3456);
const input=G.composePhrase(g,0),snapshot=JSON.stringify(input);
const opts={seed:20261022,candidates:8};
const anxious=M.selectPhrase(input,{tension:.95,energy:.8},opts);
const gentle=M.selectPhrase(input,{tension:.1,energy:.2,tenderness:.9},opts);
assert.equal(JSON.stringify(anxious),JSON.stringify(M.selectPhrase(input,{tension:.95,energy:.8},opts)),'fixed seed');
assert.notEqual(JSON.stringify(anxious.events),JSON.stringify(gentle.events),'emotion changes phrasing');
assert.equal(JSON.stringify(input),snapshot,'input is not modified');
assert.equal(JSON.stringify(G.composePhrase(g,0)),snapshot,'legacy generator unchanged');
for(const output of [anxious,gentle]){
 assert.equal(output.candidateScores.length,8);
 assert.ok(output.events.some(x=>!x.rest));
 assert.ok(output.events.every(x=>x.durationUnits>0&&x.position+x.durationUnits<=16.001&&x.degree>=0&&x.degree<=8));
}
assert.throws(()=>M.selectPhrase([]),/source events/);
console.log('PASS M2 emotion phrase planner: seed/emotion/legacy/bounds');
