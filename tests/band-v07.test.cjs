/* v0.7 regression: actual narrative cues must change audible band structure.
   A/B must remain sample-identical if the story supplies no cue.
*/
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),window={},context={window,Blob,console};
for(const file of ['analyzer.js','resonare.js','band-v07.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,B=window.PlotuneBand;
function pair(scene){
 const input={title:'ぽんぽん',character:'ぽんぽんは人間に褒められたい。掃除を上手にやりたい。',
 world:'たぬきの里',style:'band',duration:15,scene};
 const base=A.plan(input,A.analyze(input)),appraisal=R.analyze(input);
 const normal=B.adaptPlan(base,'indie'),reactive=B.adaptPlan(R.attachPlan(base,appraisal),'indie');
 return {appraisal,normal,reactive,a:B.score(normal),b:B.score(reactive)};
}
const story=pair('ぽんぽんは褒めてもらおうと掃除を始めた。ところが、ほうきが畳に引っかかって転んだ。もう一度挑戦する。最後には上手にできた。');
assert.ok(story.appraisal.events.some(e=>e.cue==='stumble'));
assert.ok(story.appraisal.events.some(e=>e.cue==='recovery'||e.cue==='success'));
assert.deepEqual(Array.from(story.a.details.theme),Array.from(story.b.details.theme));
assert.ok(story.b.details.breaks>=1,'a real event creates ensemble silence');
assert.ok(story.b.rests.some(r=>r.end-r.start>=.3),'a noticeable stop replaces old 0.2s cue');
assert.ok(story.b.details.shiftedChords>=3,'reharmonize whole phrases');
assert.ok(story.b.details.cueHits>=2,'musical response to more than one event');
const group=(score,name)=>score.notes.filter(x=>x.instrument===name).map(n=>
 [Math.round(n.t*100),n.midi,Math.round(n.d*100)].join('-'));
const distinct=(left,right)=>{
 const a=new Set(left),b=new Set(right);
 return [...a].filter(x=>!b.has(x)).length+[...b].filter(x=>!a.has(x)).length;
};
assert.ok(distinct(group(story.a,'guitar'),group(story.b,'guitar'))>=15,
 'guitar part must undergo a substantial change');
assert.ok(distinct(group(story.a,'bass'),group(story.b,'bass'))>=6,
 'bass part changes with expectation outcomes');
const audioA=B.render(story.normal),audioB=B.render(story.reactive);
assert.equal(audioA.samples.length,audioB.samples.length);
let average=0,cnt=0,peak=0;
for(let i=0;i<audioA.samples.length;i+=101){
 const a=audioA.samples[i],b=audioB.samples[i];
 average+=Math.abs(a-b);cnt++;peak=Math.max(peak,Math.abs(b));
 assert.ok(Number.isFinite(b)&&Math.abs(b)<=1);
}
average/=cnt;
assert.ok(average>.012,'reactive score must be measurably different');
assert.ok(peak>.15);
const neutral=pair('窓辺で風が揺れている。誰も話さず景色を見ていた。');
assert.equal(neutral.b.details.cueHits,0);
assert.equal(neutral.b.details.breaks,0);
assert.equal(neutral.b.details.shiftedChords,0);
const neutralA=B.render(neutral.normal),neutralB=B.render(neutral.reactive);
assert.deepEqual(Array.from(neutralA.samples),Array.from(neutralB.samples),
 'no grounded event → do not fabricate musical changes or PRNG differences');
const turn=pair('静かな部屋にいた。でも、外で音がした。');
assert.ok(turn.appraisal.events.some(e=>e.cue==='turn'));
assert.ok(turn.b.details.shiftedChords>0,'scene turn changes harmony for a phrase');
const result=R.analyze({character:'',world:'',scene:'しかし、'});
const plan=A.plan({title:'t',character:'',world:'',scene:'しかし、',style:'band',duration:15},A.analyze({scene:'しかし、'}));
const enhanced=B.adaptPlan(R.attachPlan(plan,result),'indie');
const low=B.score(enhanced);
const modified={...enhanced,resonare:{...enhanced.resonare,
 events:enhanced.resonare.events.map(e=>({...e,deltaPsi:1,tension:1}))}};
const high=B.score(modified);
assert.ok(high.rests[0].end-high.rests[0].start>low.rests[0].end-low.rests[0].start,
 'numeric state change and tension must influence real silence duration');
assert.deepEqual(Array.from(B.score(story.normal).details.theme),Array.from(story.a.details.theme));
for(const seconds of [15,30,60]){
 const s=B.score({...story.reactive,duration:seconds});
 assert.ok(s.notes.every(n=>n.t>=0&&n.d>0&&n.t+n.d<=seconds+.001));
 assert.ok(s.percussion.length<1800);
}
console.log('PASS v0.7 band: multi-bar narrative contrast, both instruments, Δψ, grounded neutral, deterministic audio');
