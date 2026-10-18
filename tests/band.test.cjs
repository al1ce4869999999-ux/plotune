/* Plotune v0.5 band: score/form/style/PCM regression. No API or npm. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),window={};
for(const file of ['analyzer.js','resonare.js','band-v05.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window,Blob,console},{filename:file});
}
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,B=window.PlotuneBand;
const input={title:'三人のバンド',character:'彼は褒めてもらいたくて練習を続けている。',
 world:'小さなライブハウス',scene:'ステージで自信満々に演奏を始めた。しかしコードを間違えて失敗した。もう一度挑戦し、ついに上手にできた。',duration:15,style:'band'};
const base=A.plan(input,A.analyze(input)),appraisal=R.analyze(input);
assert.ok(appraisal.events.some(e=>e.cue==='stumble'),'appraisal must include a setback');
const modes=['indie','rock','punk','ballad'];
for(const style of modes){
 const dry=B.adaptPlan(base,style);
 const wet=B.adaptPlan(R.attachPlan(base,appraisal),style);
 assert.equal(dry.genre,'band');assert.equal(wet.genre,'band');
 assert.equal(dry.bpm,wet.bpm);
 const baseline=B.score(dry),score=B.score(wet);
 assert.deepEqual(Array.from(score.details.instruments),['guitar','bass','drums']);
 assert.deepEqual(Array.from(score.details.theme),Array.from(baseline.details.theme),'keep stable character riff');
 assert.equal(score.details.roles.drums,score.percussion.length);
 assert.ok(score.details.roles.guitar>10&&score.details.roles.bass>4);
 assert.ok(score.details.roles.drums>4,'drums are present');
 assert.ok(score.notes.every(n=>['guitar','bass'].includes(n.instrument)),
  'no extra melodic performers in three-piece');
 assert.ok(score.percussion.some(x=>x.kind==='kick')&&score.percussion.some(x=>x.kind==='snare'));
 assert.ok(score.percussion.some(x=>x.kind==='hat'));
 assert.ok(score.notes.filter(n=>n.instrument==='guitar').some(n=>n.role==='chord'));
 assert.ok(score.notes.some(n=>n.instrument==='bass'));
 assert.ok(score.details.breaks>0,'resonare causes band-wide rests');
 assert.ok(score.details.shiftedChords>0,'narrative changes band harmony');
 assert.equal(baseline.details.breaks,0,'baseline has no story-triggered rests');
 assert.ok(score.notes.every(n=>n.t>=0&&n.d>0&&n.t+n.d<=input.duration+.001));
 assert.ok(score.percussion.every(n=>n.t>=0&&n.t<input.duration));
 assert.ok(score.details.sections.includes('Chorus'),'chorus arrangement should be present');
 const v=B.render(wet),v0=B.render(dry);
 assert.equal(v.samples.length,v0.samples.length);
 assert.ok(v.samples.length>=330000);
 let max=0,energy=0,diff=0,count=0;
 for(let i=0;i<v.samples.length;i+=193){
  const s=v.samples[i],t=v0.samples[i];
  assert.ok(Number.isFinite(s)&&Math.abs(s)<=1.001,'bounded finite PCM');
  max=Math.max(max,Math.abs(s));energy+=Math.abs(s);
  diff+=Math.abs(s-t);count++;
 }
 assert.ok(max>.1&&energy/count>.005,'non-silent band');
 assert.ok(diff/count>.001,'A/B structural audio change '+style);
 assert.equal(B.wavBlob(v.samples,v.sampleRate).size,44+v.samples.length*2);
}
assert.ok(B.STYLES.punk.bpm>B.STYLES.rock.bpm);
assert.ok(B.STYLES.rock.bpm>B.STYLES.ballad.bpm);
const quietInput={...input,scene:'窓辺で風が揺れる。'};
const quiet=B.adaptPlan(R.attachPlan(A.plan(quietInput,A.analyze(quietInput)),R.analyze(quietInput)),'ballad');
assert.equal(B.score(quiet).details.breaks,0,'no fabricated stumbles for neutral scene');
const long={...B.adaptPlan(base,'indie'),duration:60};
const arrangement=B.score(long);
assert.ok(arrangement.notes.length<3000,'limit number of notes for iPhone');
assert.ok(arrangement.percussion.length<1500,'limit drum count for iPhone');
console.log('PASS band-v05: four styles, guitar/bass/drums only, 4 sections, reaction, WAV, bounded PCM');
