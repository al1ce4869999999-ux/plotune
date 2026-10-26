// R8 harmonic guard, motif identity and boundary invariants (Node 22 / vm).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},console};
for(const file of ['transition-evaluation-r7.js','transition-optimization-r8.js'])
 vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const R=ctx.window.PlotuneTransitionR8;
const arc=[{stage:'opening'},{stage:'opening'},{stage:'climax'},{stage:'resolution'}];
const note=(t,d,midi,voice,extra={})=>({t,d,midi,voice,role:voice,...extra});
const run=(notes,strategy)=>R.optimize({notes,duration:4,bpm:240,wholeTrackArc:arc,transitionPlans:[{time:3,strategy}]});
const consonant=[note(2.75,.2,60,'bass'),note(2.74,.24,72,'chords'),note(3,.2,61,'bass'),note(3,.2,73,'lead',{motifId:'theme'})];
assert.equal(run(consonant,'BASS_LEAD').trace.strategies[1].candidates.some(x=>x.strategy==='BASS_LEAD'),false,'no new semitone against chord');
const clear=[note(2.75,.2,60,'bass'),note(3,.2,64,'bass'),note(3,.2,73,'lead',{motifId:'theme'})];
const safe=run(clear,'BASS_LEAD');
assert.equal(safe.trace.strategies[1].strategy,'BASS_LEAD');
assert.equal(safe.notes[0].midi,62);
const timing=[note(2.82,.13,61,'arp'),note(2.75,.22,60,'chords'),note(3,.2,73,'lead',{motifId:'theme'})];
assert.equal(run(timing,'RHYTHMIC_BRIDGE').trace.strategies[1].strategy,'RHYTHMIC_BRIDGE');
const deps=['research-evaluation-r0.js','arrangement-perception-r5.js','arrangement-optimization-r6.js','analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js','music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','motif-similarity-r1.js','identity-novelty-r4.js','identity-novelty-r4b.js','tension-r2a.js','tension-r2b.js','expectancy-r3.js','expectancy-r3b.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m7-generation-v01.js'];
ctx.Blob=Blob;
for(const file of deps)vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const {PlotuneHandheld:H,PlotuneM7Generation:G}=ctx.window;
const request={scene:'森を歩く旅人',character:'旅人',world:'森',style:'handheld',gameStyle:'journey',duration:15};
const plans=G.makePlans(G.request(request,42),G.dependenciesFromRoot());
let edits=0;
for(const {plan} of plans){
 const score=H.score({...plan,musicTransitionOptimizationR8:false});
 const {notes,bpm,duration}=score,bar=240/bpm,bars=Math.round(duration/bar);
 const wholeTrackArc=Array.from({length:bars},(_,b)=>({stage:['opening','development','climax','resolution'][Math.min(3,Math.floor((b+.5)/bars*4))]}));
 const original=JSON.stringify(notes),result=R.optimize({notes,bpm,duration,wholeTrackArc});
 assert.equal(JSON.stringify(notes),original,'input is immutable');
 assert.equal(result.notes.length,notes.length,'note count preserved');
 const boundaries=result.trace.strategies.filter(x=>x.changed).map(x=>x.time);
 for(let i=0;i<notes.length;i++){
  const before=notes[i],after=result.notes[i];
  if(JSON.stringify(before)===JSON.stringify(after))continue;
  assert.notEqual(before.voice,'lead','lead preserved');
  assert.ok(boundaries.some(t=>before.t>=t-4*60/bpm&&before.t<t&&after.t>=t-4*60/bpm&&after.t<t+2*60/bpm),'boundary-local');
  for(const key of Object.keys(before).filter(k=>!['t','d','midi'].includes(k)))
   assert.equal(after[key],before[key],`identity ${key}`);
  assert.ok(Number.isInteger(after.midi)&&after.midi>=24&&after.midi<=105,'safe MIDI range');
  edits++;
 }
}
assert.ok(edits>0,'real notes changed');
console.log('PASS R8 harmonic guard and boundary identity: edits='+edits);
