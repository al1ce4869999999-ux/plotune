/* Run with: node tests/m1-melody-selection.test.cjs */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const window={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','melodic-grammar-v01.js'),'utf8'),{window},{filename:'melodic-grammar-v01.js'});
const m=window.PlotuneMelodicGrammar;
const g=m.grammar({character:{},world:{},scene:{}},{motif:{}},42);
const legacy=m.composePhrase(g,0);
const ranked=m.selectMelody(g,0,{candidateCount:6});
assert.equal(ranked.candidates.length,6);
assert.equal(ranked.candidates[0].score,Math.max(...ranked.candidates.map(c=>c.score)));
assert.equal(JSON.stringify(ranked),JSON.stringify(m.selectMelody(g,0,{candidateCount:6})));
assert.equal(JSON.stringify(ranked.events),JSON.stringify(m.composePhrase(g,0,{m1Selection:true,candidateCount:6})));
assert.equal(JSON.stringify(legacy),JSON.stringify(m.composePhrase(g,0)));
assert.ok(ranked.events.every(e=>e.position>=0&&e.durationUnits>0&&e.position+e.durationUnits<=16.001));
assert.ok(ranked.events.some(e=>!e.rest));
console.log('PASS: M1 candidate ranking, reproducibility, opt-in, legacy compatibility');
