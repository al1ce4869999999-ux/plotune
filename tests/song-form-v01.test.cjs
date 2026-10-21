const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','song-form-v01.js'),'utf8'),{window});const plan=window.PlotuneSongForm.plan;
for(const [seconds,expected] of [[10,['intro','A','returnA']],[30,['intro','A','B','returnA']],[60,['intro','A','Aprime','B','returnA']]]){
 const a=plan({duration:seconds,title:'test'}),b=plan({duration:seconds,title:'test'});
 assert.equal(JSON.stringify(a),JSON.stringify(b),'deterministic');
 assert.equal(JSON.stringify(a.sections.map(x=>x.id)),JSON.stringify(expected));
 assert.equal(a.sections[0].start,0);assert.equal(a.sections.at(-1).end,seconds);
 for(let i=0;i<a.sections.length;i++){const s=a.sections[i];assert.ok(s.duration>0);assert.ok(s.tensionStart>=0&&s.tensionEnd<=1);assert.ok(s.reason);if(i)assert.equal(s.start,a.sections[i-1].end);}
 assert.equal(a.diagnostics.audioGenerated,false);
}
for(const duration of [0,-1,NaN,Infinity])assert.throws(()=>plan({duration}),{name:'RangeError',message:'duration must be positive and finite'});
console.log('PASS phase1 song form: duration, continuity, tension, diagnostics, determinism');

/* Integration regression: planned sections must alter actual handheld score events. */
const context={window,Blob,console};
for(const filename of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','handheld-v21.js']){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',filename),'utf8'),context,{filename});
}
const input={title:'form-integration',character:'',world:'',scene:'森を歩く',style:'handheld',duration:60};
const analysis=window.PlotuneAnalysis.analyze(input);
const basePlan=window.PlotuneAnalysis.plan(input,analysis);
const prepared=window.PlotuneHandheld.prepare(basePlan,'journey',null,false,input.scene);
const form=plan({duration:60,title:input.title});
const score=window.PlotuneHandheld.score({...prepared,songForm:form});
const fallback=window.PlotuneHandheld.score(prepared);
const sequence=score.details.wholeTrackArc.map(bar=>bar.section);
assert.equal(JSON.stringify([...new Set(sequence)]),JSON.stringify(['intro','A','Aprime','B','returnA']),'real score must follow sections');
assert.ok(score.notes.some(n=>n.voice==='lead'),'form must retain audible lead notes');
const intro=form.sections[0];
assert.ok(!score.notes.some(n=>n.voice==='counter'&&n.t<intro.end-0.01),'intro counterpoint should stay silent');
const a=score.notes.filter(n=>n.voice==='lead').map(n=>[n.t,n.midi,n.volume]);
const b=fallback.notes.filter(n=>n.voice==='lead').map(n=>[n.t,n.midi,n.volume]);
assert.notEqual(JSON.stringify(a),JSON.stringify(b),'form must change note events, not only metadata');
assert.ok(score.details.wholeTrackArc.some(bar=>bar.section==='B'&&bar.register===3),'B raises register');
assert.ok(score.details.wholeTrackArc.some(bar=>bar.section==='returnA'&&bar.register===0),'reprise returns to theme register');
console.log('PASS phase1 integration: sections drive handheld note events and instrument entrances');

