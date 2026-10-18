/* Plotune v0.3 Resonare-inspired appraisal and A/B regression tests.
 * No API, npm, browser or external dependencies.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),window={};
const context={window,Blob,console};
for(const file of ['analyzer.js','resonare.js','composer.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,C=window.PlotuneComposer;
const base={title:'たぬきの里',character:'ぽんぽんは人間に褒められたい。掃除を上手にやりたい。',world:'のどかな里',style:'chip',duration:15};
function full(scene,rest={}){
 const input={...base,scene,...rest};
 const analysis=A.analyze(input),plan=A.plan(input,analysis,0),appraisal=R.analyze(input);
 return {input,plan,appraisal,enhanced:R.attachPlan(plan,appraisal)};
}
const case1=full('ぽんぽんはうまく掃除しようとした。ところがほうきが畳に引っかかって転んだ。もう一度挑戦し、今度は上手にできた。');
assert.equal(case1.appraisal.goal.id,'recognition','goal of recognition should derive from profile');
assert.ok(case1.appraisal.goal.evidence.length>0);
assert.ok(case1.appraisal.events.some(e=>e.cue==='stumble'),'setback needs a stumble cue');
assert.ok(case1.appraisal.events.some(e=>e.cue==='recovery'||e.cue==='success'),'success needs a rising cue');
for(const e of case1.appraisal.events){
 for(const key of ['deltaPhi','deltaPsi','resonance','surprise','tension','outcome']){
  assert.ok(Number.isFinite(e[key]),key+' must be finite');
 }
 assert.ok(e.resonance>=0&&e.resonance<=1);
 assert.ok(e.deltaPsi>=0&&e.deltaPsi<=1);
 assert.ok(e.tension>=0&&e.tension<=1);
 assert.equal(e.blindSpot,0,'blind spot cannot be hallucinated');
}
const unknown=R.analyze({character:'',world:'',scene:'黄色い葉が一枚落ちた。'});
assert.equal(unknown.goal.id,'unknown','no goal may be invented');
assert.equal(unknown.goal.confidence,'low');
assert.ok(unknown.uncertainty);
const hidden=R.analyze({character:'',world:'',scene:'本当は気づかなかった。'});
assert.ok(hidden.events.some(e=>e.blindSpot>0),'explicit ignorance can affect B');
const other=full(case1.input.scene,{character:'怖がりで安全に逃げることが大切。'});
assert.equal(other.appraisal.goal.id,'safety','character goal should change appraisal');
assert.equal(case1.plan.mode,case1.enhanced.mode,'only appraisal gestures change in A/B');
assert.equal(case1.plan.bpm,case1.enhanced.bpm,'A/B must share BPM');
assert.equal(case1.plan.characterSeed,case1.enhanced.characterSeed,'theme must be stable');
assert.ok(!case1.plan.resonare,'baseline unchanged');
assert.ok(case1.enhanced.resonare.events.length>0);
const dry=C.render(case1.plan),wet=C.render(case1.enhanced);
assert.deepEqual(Array.from(dry.details.theme),Array.from(wet.details.theme));
assert.deepEqual(Array.from(dry.details.theme),Array.from(C.render(case1.plan).details.theme),'deterministic melody');
assert.equal(dry.samples.length,wet.samples.length);
let diff=0,nonzero=0,peak=0;
for(let i=0;i<wet.samples.length;i++){
 const value=wet.samples[i];
 assert.ok(Number.isFinite(value),'samples must be finite');
 peak=Math.max(peak,Math.abs(value));
 if(Math.abs(dry.samples[i]-value)>1e-7)diff++;
 if(value!==0)nonzero++;
}
assert.ok(nonzero>1000&&peak>0&&peak<=1,'valid audio');
assert.ok(diff>500,'A/B needs audible signal changes');
assert.ok(wet.details.cues.includes('stumble'),'stumble should reach score');
assert.equal(C.wavBlob(wet.samples,wet.sampleRate).size,44+wet.samples.length*2);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const assets=html.includes('src="app-v13.js"')
 ? ['analyzer.js','resonare-v08.js','composer-v04.js','loop-arranger-v09.js','band-v09.js','band-piano-v14.js','comparison-v13.js','handheld-v10.js','zeta-export-v12.js','app-v13.js']
 : html.includes('src="app-v12.js"')
 ? ['analyzer.js','resonare-v08.js','composer-v04.js','loop-arranger-v09.js','band-v09.js','comparison-v10.js','handheld-v10.js','zeta-export-v12.js','app-v12.js']
 : html.includes('src="app-v10.js"')
 ? ['analyzer.js','resonare-v08.js','composer-v04.js','loop-arranger-v09.js','band-v09.js','comparison-v10.js','handheld-v10.js','app-v10.js']
 : html.includes('src="app-v09.js"')
 ? ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','composer-v04.js','band-v09.js','comparison-v08.js','app-v09.js']
 : html.includes('src="app-v08.js"')
 ? ['analyzer.js','resonare-v08.js','composer-v04.js','band-v08.js','comparison-v08.js','app-v08.js']
 : html.includes('src="app-v07.js"')
 ? ['analyzer.js','resonare.js','composer-v04.js','band-v07.js','comparison-v06.js','app-v07.js']
 : html.includes('src="app-v062.js"')
 ? ['analyzer.js','resonare.js','composer-v04.js','band-v05.js','comparison-v06.js','app-v062.js']
 : html.includes('src="app-v06.js"')
 ? ['analyzer.js','resonare.js','composer-v04.js','band-v05.js','comparison-v06.js','app-v06.js']
 : html.includes('src="app-v05.js"')
 ? ['analyzer.js','resonare.js','composer-v04.js','band-v05.js','app-v05.js']
 : html.includes('src="app-v04.js"')
 ? ['analyzer.js','resonare.js','composer-v04.js','app-v04.js']
 : ['analyzer.js','resonare.js','composer.js','app-v03.js'];
for(const asset of assets)assert.ok(html.includes('src="'+asset+'"'),'missing script '+asset);
for(const id of ['engine','compare','classicPlay','resonarePlay'])assert.ok(html.includes('id="'+id+'"'),'missing control '+id);
console.log('PASS: goal grounding, no mind-reading, B, Δφ/Δψ/R, event cues, stable motif, A/B PCM, WAV, assets');
