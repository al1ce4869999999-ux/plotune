/* Run with: node tests/m1-motif-signature.test.cjs */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const window={},ctx={window};
for(const name of ['motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),ctx,{filename:name});
const P=window.PlotuneMotifPlanner,G=window.PlotuneMelodicGrammar,M2=window.PlotuneM2Phrase,M3=window.PlotuneM3Harmony;
const g=G.grammar({character:{themeIdentity:{value:'m1-signature'}}},{},123);
const source=G.selectMelody(g,0).events;
const identity=P.capture(source),sig=P.signature(source);
assert.ok(sig.protectedIndices.length>0);
for(const kind of ['variation','contrast']){
 const out=P.transform(identity,kind,{preserveSignature:true}).events;
 for(const i of sig.protectedIndices)assert.equal(JSON.stringify(out[i]),JSON.stringify(identity.events[i]));
 assert.equal(JSON.stringify(out.map(e=>e.position)),JSON.stringify(identity.events.map(e=>e.position)));
}
const transformed=G.composePhrase(g,1,{motifIdentity:identity,motifTransform:'variation',preserveSignature:true});
for(const i of sig.protectedIndices){
 assert.equal(transformed[i].degree,source[i].degree);
 assert.equal(transformed[i].rest,source[i].rest);
}
const m2=M2.selectPhrase(transformed,{tension:.8},{seed:4,protectedIndices:sig.protectedIndices});
const reprise=M2.selectPhrase(transformed,{tension:.2},{seed:4,protectedIndices:sig.protectedIndices,preserveRhythm:true});
assert.equal(JSON.stringify(reprise.events.map(e=>[e.position,e.durationUnits,e.rest])),JSON.stringify(transformed.map(e=>[e.position,e.durationUnits,e.rest])));
const m3=M3.plan([m2.events,m2.events],{protectedIndices:[sig.protectedIndices,sig.protectedIndices]});
for(const i of sig.protectedIndices){
 assert.equal(m2.events[i].degree,transformed[i].degree);
 assert.equal(m3.phrases[0][i].degree,transformed[i].degree);
}
console.log('PASS M1 motif signature through Phase, M2 and M3');
