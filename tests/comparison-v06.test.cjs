/* Plotune v0.6 pure analysis checks. No browser / network needed. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const folder=path.resolve(__dirname,'..');
const window={};
for(const file of ['analyzer.js','resonare.js','band-v05.js','comparison-v06.js']){
 vm.runInNewContext(fs.readFileSync(path.join(folder,file),'utf8'),{window,console,Blob},{filename:file});
}
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,B=window.PlotuneBand,C=window.PlotuneCompare;
let t=C.windowAt(.5,30);
assert.deepEqual({start:t.start,end:t.end,center:t.center},{start:10,end:20,center:15});
t=C.windowAt(0,15);assert.deepEqual({start:t.start,end:t.end},{start:0,end:10});
t=C.windowAt(1,15);assert.deepEqual({start:t.start,end:t.end},{start:5,end:15});
t=C.windowAt(.9,6);assert.deepEqual({start:t.start,end:t.end},{start:0,end:6});
const make=(values,notes=[],percussion=[])=>({
 samples:Float32Array.from(values),sampleRate:10,
 score:{duration:values.length/10,genre:'band',notes,percussion},
 details:{genre:'band',rests:[]}
});
const silence=Array(120).fill(.12);
const identical=make(silence,[{t:4,midi:60,instrument:'guitar',articulation:'open',role:'chord',v:.2}]);
const changed=make(silence.slice(),[{t:4,midi:64,instrument:'guitar',articulation:'open',role:'chord',v:.2}]);
const same=C.signalDifference(identical,changed,2,6);
assert.equal(same.relative,0);
const roles=C.roleChanges(identical,changed,2,6);
assert.equal(roles.guitar.changed,2,'one replaced note should yield two unmatched events');
assert.equal(roles.bass.changed,0);
assert.equal(roles.drums.changed,0);
const event={events:[{cue:'stumble',position:.4,text:'ほうきでつまずいた。'}]};
let details=C.buildEvents(identical,changed,event);
assert.equal(details.length,1);
assert.equal(details[0].status,'要改善（機械的な差が小さい）');
assert.equal(details[0].roles.guitar.changed,2);
assert.equal(C.buildEvents(identical,changed,{events:[{cue:'neutral',position:.5}]}).length,0);
const changedAudio=make(silence.map((x,i)=>i>=30&&i<=70?-.12:x));
const audible=C.signalDifference(identical,changedAudio,3,7);
assert.ok(audible.relative>.4,'should detect substantial waveform change');
details=C.buildEvents(identical,changedAudio,event);
assert.equal(details[0].status,'信号・楽譜に差あり（聴感未判定）');
const input={
 title:'ぽんぽんの作戦',character:'褒められたいので掃除する。',
 world:'里',style:'band',duration:15,
 scene:'ぽんぽんは得意げに掃除を始めた。ところがほうきで転んだ。もう一度挑戦して上手にできた。'
};
const base=A.plan(input,A.analyze(input)),appraisal=R.analyze(input);
const dry=B.adaptPlan(base,'indie'),wet=B.adaptPlan(R.attachPlan(base,appraisal),'indie');
const dryTrack=B.render(dry),wetTrack=B.render(wet);
const realEvents=C.buildEvents(dryTrack,wetTrack,appraisal);
assert.ok(realEvents.length>=1);
assert.ok(realEvents.every(e=>e.window.end<=15&&e.window.start>=0));
assert.ok(realEvents.some(e=>Object.hasOwn(e.roles,'guitar')&&Object.hasOwn(e.roles,'drums')));
for(let i=1;i<realEvents.length;i++)
 assert.ok(realEvents[i-1].audio.relative>=realEvents[i].audio.relative);
const combined=realEvents.reduce((n,e)=>n+e.scoreDelta,0);
assert.ok(combined>0,'real band arrangement should modify guitar/bass/drum parts');
console.log('PASS v0.6: cue selection, 10-second windows, per-instrument differences, conservative diagnostics, band integration');
