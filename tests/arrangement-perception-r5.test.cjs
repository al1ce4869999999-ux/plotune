const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const ctx={window:{},Blob,console,Math:Object.assign(Object.create(Math),{random(){throw Error('RNG forbidden');}})};
const files=['research-evaluation-r0.js','arrangement-perception-r5.js','analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','motif-similarity-r1.js','identity-novelty-r4.js','identity-novelty-r4b.js','tension-r2a.js','tension-r2b.js','expectancy-r3.js','expectancy-r3b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js'];
for(const file of files)vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const E=ctx.window.PlotuneArrangementPerceptionR5,H=ctx.window.PlotuneHandheld,G=ctx.window.PlotuneM7Generation;
const n=(voice,t,midi,volume=.1,d=.5)=>({voice,role:voice,t,midi,volume,d});
const score=notes=>({notes,duration:4,bpm:120});
const assess=notes=>E.evaluate(score(notes));
const a=assess([n('lead',0,72),n('chords',0,71)]);
const b=assess([n('lead',0,72),n('chords',1,71)]);
assert(a.metrics.registerOverlap>b.metrics.registerOverlap,'temporal separation');
assert(a.metrics.roleConflict>b.metrics.roleConflict,'foreground competition');
assert(a.metrics.simultaneousOnset>b.metrics.simultaneousOnset);
const c=assess([n('lead',0,72),n('bass',0,42)]);
assert.equal(c.metrics.registerOverlap,0,'different register');
const d=assess([n('lead',0,72),n('chords',0,71,.001)]);
assert.equal(d.metrics.roleConflict,0,'register overlap not identical to role conflict');
const changed=assess([n('lead',0,72),n('chords',3,67)]);
assert(changed.entrances.some(x=>x.entered.includes('chords')),'entry tracking');
assert(changed.sections.length===4&&changed.windows.length===2);
assert(Object.keys(changed.metrics).length===8);
const fallback=E.evaluate({notes:[{voice:'lead'}],duration:4});
assert.equal(fallback.status,'partial');
assert.equal(E.evaluate({notes:null,duration:4}).status,'fallback');
assert.equal(JSON.stringify(a),JSON.stringify(assess([n('lead',0,72),n('chords',0,71)])),'determinism');
const json=JSON.stringify(score([n('lead',0,72)]));E.evaluate(JSON.parse(json));assert.equal(JSON.stringify(score([n('lead',0,72)])),json);
const sha=t=>({notes:crypto.createHash('sha256').update(JSON.stringify(t.score.notes)).digest('hex'),pcm:crypto.createHash('sha256').update(Buffer.from(t.samples.buffer,t.samples.byteOffset,t.samples.byteLength)).digest('hex')});
const input={scene:'森を歩く旅人',character:'旅人',world:'森',style:'handheld',gameStyle:'journey'};
for(const duration of [15,30,60]){
 const req=G.request({...input,duration},42),plans=G.makePlans(req,G.dependenciesFromRoot());
 assert.equal(plans.length,4);
 for(const {conditionId,plan} of plans){
  const off=H.render(plan),on=H.render({...plan,musicArrangementPerceptionR5:true});
  assert.deepEqual(sha(off),sha(on),'R5 must preserve notes and PCM '+conditionId+' '+duration);
  assert(on.score.details.arrangementPerceptionR5?.metrics,'R5 trace attached');
  assert.deepEqual(sha(on),sha(H.render({...plan,musicArrangementPerceptionR5:true})),'determinism');
 }
}
console.log('PASS R5 symbolic metrics, time windows, entries, fallback and M7 4x3 unchanged audio');
