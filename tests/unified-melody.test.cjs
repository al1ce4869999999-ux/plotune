const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function load(files){
 const scope={window:{},console,Math,Float32Array,Uint8Array,ArrayBuffer,DataView};
 scope.window.window=scope.window;
 vm.createContext(scope);
 for(const file of files)vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),scope,{filename:file});
 return scope.window;
}
test('shared composer is deterministic and produces structured phrases',()=>{
 const w=load(['melodic-grammar-v01.js']);
 const options={seed:21,bars:4,slots:16,notesPerBar:6,mood:'sorrow'};
 const a=w.PlotuneMelodicGrammar.compose(options);
 const b=w.PlotuneMelodicGrammar.compose(options);
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.equal(a.bars.length,4);
 assert.ok(a.bars.every(bar=>bar.length===6&&bar.every(note=>note.offset>=0&&note.offset<16&&note.durationUnits>0)));
 assert.equal(a.bars[3][5].degree,0);
});
test('normal song and instrumental arrangements use the same melody service',()=>{
 const grammar=load(['melodic-grammar-v01.js']);
 let count=0;
 const original=grammar.PlotuneMelodicGrammar.compose;
 grammar.PlotuneMelodicGrammar.compose=(...args)=>{count++;return original(...args)};
 const scope={window:grammar,console,Math,Float32Array,Uint8Array,ArrayBuffer,DataView};
 vm.createContext(scope);
 for(const file of ['composer-v04.js','handheld-v21.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),scope,{filename:file});
 const plan={seed:1,characterSeed:2,bpm:100,duration:8,mode:'major',root:60,genre:'pop'};
 const normal=grammar.PlotuneComposerV4.buildScore(plan);
 assert.ok(normal.notes.some(n=>n.role==='lead'));
 assert.ok(count>=1);
 const handheld=grammar.PlotuneHandheld;
 const prepared=handheld.prepare(plan,'musicbox',null,false,'','');
 const scored=handheld.score(prepared);
 assert.ok(scored.notes.some(n=>n.voice==='lead'));
 assert.ok(count>=2);
});
