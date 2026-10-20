const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function load(){
 const context={window:{},console};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync('melodic-grammar-v01.js','utf8'),context);
 return context.window.PlotuneMelodicGrammar;
}
test('phrase events fit within a bar, no overlapping notes, cadence and rests',()=>{
 const api=load();
 for(let seed=1;seed<=30;seed++){
  const g=api.grammar({}, {motif:{bounce:seed%2?.8:.1,hesitation:seed%2?.1:.8}},seed);
  for(let bar=0;bar<8;bar++){
   const a=api.phrase(g,bar);
   assert.ok(a.length>=2);
   assert.equal(a[0].positionUnits,0);
   let end=0;
   for(const event of a){
    assert.ok(event.positionUnits>=end-1e-8);
    assert.ok(event.durationUnits>0 && event.durationUnits<=16);
    assert.ok(event.positionUnits+event.durationUnits<=16+1e-8);
    assert.ok(event.degree>=0&&event.degree<=8);
    end=event.positionUnits+event.durationUnits;
   }
   const last=a.at(-1);
   assert.equal(last.rest,false);
   assert.equal(last.cadence,bar%4===3?'authentic':bar%4===1?'half':'open');
   if(bar%4===3)assert.equal(last.degree,0);
   if(bar%4===1)assert.equal(last.degree,4);
   assert.deepEqual(JSON.stringify(api.phrase(g,bar)),JSON.stringify(a));
  }
 }
});
test('handheld renderer uses generated positions, durations and rests with legacy fallback',()=>{
 const code=fs.readFileSync('handheld-v21.js','utf8');
 assert.match(code,/plan\.phraseMode!=='legacy'/);
 assert.match(code,/generated\.positionUnits/);
 assert.match(code,/generated\.durationUnits/);
 assert.match(code,/if\(generated\?\.rest\)continue/);
});
