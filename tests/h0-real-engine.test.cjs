const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{},Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js']){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
}
const H=context.window.PlotuneHandheld;
const plan={gameStyle:'journey',duration:15,seed:42,musicDevelopment:true,musicHarmony:true,musicVoices:true,musicPerformance:true,musicTransitions:true};
const plain=H.score(plan),traced=H.score({...plan,h0Trace:true});
assert.equal(JSON.stringify(plain.notes),JSON.stringify(traced.notes));
assert.equal(JSON.stringify(plain.harmony),JSON.stringify(traced.harmony));
assert.equal(JSON.stringify(plain.drums),JSON.stringify(traced.drums));
assert.equal(JSON.stringify(plain.details.transitions),JSON.stringify(traced.details.transitions));
assert.equal(JSON.stringify(traced),JSON.stringify(H.score({...plan,h0Trace:true})));
for(const stage of ['preM4','postM4','postM5','postTransition'])assert(Array.isArray(traced.details.h0Stages[stage]));
for(const stage of ['beforeM2','afterM2','afterM3'])assert(Array.isArray(traced.details.h0Phrases[stage]));
const diagnostics=require('../h0-diagnostics-v01.js');
const phrase=diagnostics.comparePhrases(traced.details.h0Phrases,42);
const stages=diagnostics.compareStages(traced.details.h0Stages,42);
assert(phrase.events.length>0);
assert(stages.events.length>0);
console.log('PASS H0 real-engine trace and note/harmony/drum preservation');
