const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),window={},ctx={window,Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','handheld-v20.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,H=window.PlotuneHandheld;
function build(scene,style='sadness',duration=15,reactive=false){
 const form={title:'ぽんぽん',character:'人間に褒められたい',world:'森',scene,style:'handheld',duration};
 const p=A.plan(form,A.analyze(form)),ap=R.analyze(form);
 return H.prepare(reactive?R.attachPlan(p,ap):p,style,ap,reactive,scene);
}
for(const scene of ['ぽんぽんは泣き崩れ、誰も来ない道で待ち続けた','最後のお別れ。涙があふれた','しょんぼりとうつむく']){
 const p=build(scene),s=H.score(p),arc=s.details.emotionalArc;
 assert.equal(arc.type,'grief');
 assert.equal(arc.stages.length,4);
 assert.deepEqual(Array.from(arc.stages,x=>x.name),['抑える','期待が高まる','崩れる','余韻']);
 assert.equal(arc.stages[0].start,0);assert.equal(arc.stages.at(-1).end,1);
 for(let i=0;i<3;i++)assert.ok(arc.stages[i].end<=arc.stages[i+1].start);
 assert.ok(s.notes.some(n=>n.arcMarker==='unresolved'));
 assert.ok(s.notes.some(n=>n.arcMarker==='suspension'));
 const drop=s.notes.filter(n=>n.arcMarker==='falling-bass');
 assert.equal(drop.length,4);
 assert.ok(drop.every((n,i)=>i===0||n.midi<drop[i-1].midi),'falling bass must descend');
 assert.ok(s.notes.some(n=>n.arcMarker==='afterglow'));
 assert.ok(s.notes.every(n=>n.t>=0&&n.d>0&&n.t+n.d<=15+.001));
 const first=s.notes.filter(n=>n.voice==='lead'&&n.arcStage==='抑える');
 const rising=s.notes.filter(n=>n.voice==='lead'&&n.arcStage==='期待が高まる');
 const aftermath=s.notes.filter(n=>n.voice==='lead'&&n.arcStage==='余韻');
 assert.ok(first.length&&rising.length&&aftermath.length);
 const mean=n=>n.reduce((v,x)=>v+x.volume,0)/n.length;
 assert.ok(mean(aftermath)<mean(rising)*.7,'tail must be quieter than climax');
 assert.equal(H.score(build(scene,'sadness',15,true)).details.emotionalArc.type,'grief');
}
const calm=build('ぽんぽんは元気に遊んで笑顔になった','joy');
assert.equal(calm.emotionalArc,null,'happy scenes should not become sad');
assert.equal(H.score(calm).details.emotionalArc,null);
const road=build('ぽんぽんは泣いていた','journey');
assert.equal(road.gameStyle,'journey');
assert.equal(H.score(road).details.emotionalArc.type,'grief','manual adventure selection must still understand tears');
const manually=build('ただの朝の日課','sadness');
assert.equal(H.score(manually).details.emotionalArc.type,'grief','manual sorrowful music gets the arc');
for(const duration of [15,30,60]){
 const plan=build('ぽんぽんは泣き崩れた','sadness',duration);
 const s=H.score(plan),audio=H.render(plan);
 assert.ok(s.notes.every(n=>n.t>=0&&n.d>0&&n.t+n.d<=duration+.001));
 assert.ok(s.drums.every(n=>n.t>=0&&n.t<duration));
 assert.equal(audio.samples.length,duration*22050);
 assert.ok(audio.samples.every(n=>Number.isFinite(n)&&Math.abs(n)<=1));
 assert.ok(Math.abs(audio.samples.at(-1)-audio.samples[0])<.003);
 assert.equal(H.wavBlob(audio.samples,audio.sampleRate).size,duration*22050*2+44);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('src="handheld-v20.js"'));
console.log('PASS v2.0: grief arc stages, dynamic melody, suspended dissonance, bass collapse, 15/30/60 PCM + WAV');
