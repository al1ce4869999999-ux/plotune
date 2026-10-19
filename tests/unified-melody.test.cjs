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

test('rhythmic grid has no collisions and is not a uniform note conveyor',()=>{
 const w=load(['melodic-grammar-v01.js']).PlotuneMelodicGrammar;
 for(const mood of ['sorrow','courage','mystery','sparse']){
  const music=w.compose({seed:1729,bars:8,slots:16,notesPerBar:6,mood,density:.88});
  for(const bar of music.bars){
   const starts=bar.map(n=>n.offset);
   assert.equal(new Set(starts).size,starts.length,'unique attacks');
   assert.ok(starts.every((t,i)=>i===0||t>starts[i-1]),'onsets ordered');
   assert.ok(bar.every(n=>n.durationUnits>0&&n.offset+n.durationUnits<=16+1e-9));
  }
  const spacings=music.bars.flatMap(bar=>bar.slice(1).map((n,i)=>n.offset-bar[i].offset));
  assert.ok(new Set(spacings).size>1,'the rhythmic layer must vary note spacings');
  assert.equal(music.bars[3].at(-1).degree,0);
 }
});
test('motif is identifiable while variation, answer and cadence differ',()=>{
 const w=load(['melodic-grammar-v01.js']).PlotuneMelodicGrammar;
 const m=w.compose({seed:1729,bars:8,slots:16,notesPerBar:7,mood:'mystery',density:1});
 assert.ok(m.motif.length>=3);
 assert.equal(JSON.stringify(m.bars.slice(0,4).map(b=>b[0].phraseRole)),JSON.stringify(['statement','variation','answer','resolution']));
 const patterns=m.bars.slice(0,4).map(b=>b.map(n=>n.degree).join(','));
 assert.ok(new Set(patterns).size>=3,'phrase development must not repeat the same pitch row');
 assert.notEqual(m.bars[0][1].step,m.bars[2][1].step,'answer reshapes the motivic contour');
});
test('scene changes expression without hardcoding an instrument motif',()=>{
 const w=load(['melodic-grammar-v01.js']).PlotuneMelodicGrammar;
 const a=w.compose({seed:300,bars:4,slots:16,notesPerBar:7,mood:'sorrow'});
 const b=w.compose({seed:300,bars:4,slots:16,notesPerBar:7,mood:'courage'});
 assert.equal(JSON.stringify(a.motif),JSON.stringify(b.motif),'identity remains character-based');
 assert.notEqual(JSON.stringify(a.bars),JSON.stringify(b.bars),'scene changes its development');
});
