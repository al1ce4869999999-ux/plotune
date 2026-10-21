const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),window={},context={window,Blob,console};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','handheld-v18.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,H=window.PlotuneHandheld;
const newIds=['ocarinalament','ocarinacourage','synthmystery','synthhope','harpnight','kalimbadaily','marimbapranks','stringsmemory','celestadream'];
assert.equal(Object.keys(H.STYLES).length,48);
assert.equal(H.GROUPS.flatMap(g=>g.ids).length,48);
for(const id of newIds){
 assert.ok(H.STYLES[id]);assert.ok(H.STORY_INSTRUMENTS[id]);
 assert.ok(['ocarina','synthlead','harp','kalimba','marimba','strings','celesta'].includes(H.STORY_INSTRUMENTS[id].family));
}
const scenes=[
 ['ぽんぽんは誰も来ない道で泣きながら待っていた','ocarinalament'],
 ['ぽんぽんは怖くても勇気を出して立ち上がった','ocarinacourage'],
 ['ぽんぽんは夜の洞窟で怪しい光を見つけた','synthmystery'],
 ['夜が明け、新しい朝が来た','synthhope'],
 ['月夜の星を見上げた','harpnight'],
 ['いつもの道をお散歩しておやつを食べた','kalimbadaily'],
 ['ぽんぽんはいたずらをして慌てて転んだ','marimbapranks'],
 ['遠い記憶を思い返した','stringsmemory'],
 ['魔法の星屑がきらめいた','celestadream']
];
function form(scene,duration=15){return{title:'ぽんぽん',character:'人間に褒めてもらいたい',world:'たぬきの里',scene,style:'handheld',duration}};
for(const [scene,expected] of scenes){
 const input=form(scene),p=A.plan(input,A.analyze(input)),ap=R.analyze(input);
 const first=H.prepare(p,'auto',ap,false,scene),second=H.prepare(R.attachPlan(p,ap),'auto',ap,true,scene);
 assert.equal(first.instrumentChoice.style,expected,scene);
 assert.equal(first.instrumentChoice.confidence,'grounded');
 assert.ok(first.instrumentChoice.reason.includes('場面'));
 assert.equal(second.instrumentChoice.style,expected,'A/B must retain instrumentation');
 const s=H.score(first);
 assert.equal(s.details.instrumentSelection.style,expected);
 assert.equal(s.details.storyInstrument.family,H.STORY_INSTRUMENTS[expected].family);
 assert.ok(s.notes.some(n=>n.voice==='lead'&&n.t===0&&n.timbre===H.STORY_INSTRUMENTS[expected].family));
 assert.ok(s.notes.some(n=>n.voice==='pad'&&n.timbre===H.STORY_INSTRUMENTS[expected].padTone));
 assert.ok(s.notes.every(n=>n.t>=0&&n.d>0&&n.t+n.d<=15+.001));
 assert.ok(s.drums.every(n=>n.t>=0&&n.t<15));
 if(['ocarinalament','harpnight','stringsmemory','celestadream'].includes(expected))
  assert.equal(s.drums.length,0,'quiet scene must not get pop percussion');
 if(['ocarinacourage','synthhope'].includes(expected))
  assert.ok(s.drums.length>0,'courage must keep a heartbeat');
}
const input=form('窓辺に花がある'),plan=A.plan(input,A.analyze(input));
const neutral=H.prepare(plan,'auto',null,false,input.scene);
assert.equal(neutral.instrumentChoice.confidence,'fallback');
assert.ok(!neutral.instrumentChoice.reason.includes('泣'));
const manual=H.prepare(plan,'musicbox',null,false,input.scene);
assert.equal(manual.instrumentChoice,null,'manual selection must not be overridden');
assert.equal(H.score(manual).details.storyInstrument.family,'musicbox');
function track(scene,duration=15){const x=form(scene,duration),p=A.plan(x,A.analyze(x));return H.render(H.prepare(p,'auto',R.analyze(x),false,scene));}
const ocarina=track(scenes[0][0]),synth=track(scenes[2][0]),harp=track(scenes[4][0]),marimba=track(scenes[6][0]);
for(const x of [ocarina,synth,harp,marimba]){
 assert.equal(x.samples.length,15*22050);
 assert.ok(x.samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=1));
 assert.ok(Math.abs(x.samples[0]-x.samples.at(-1))<.003);
 assert.equal(H.wavBlob(x.samples,x.sampleRate).size,x.samples.length*2+44);
}
function diff(a,b){let sum=0,n=0;for(let i=0;i<22050;i+=97){sum+=Math.abs(a.samples[i]-b.samples[i]);n++}return sum/n}
assert.ok(diff(ocarina,synth)>.003,'synth and ocarina must be audibly different in PCM');
assert.ok(diff(ocarina,harp)>.003,'plucked harp and ocarina differ');
assert.ok(diff(synth,marimba)>.003,'synth and marimba differ');
const sixty=track(scenes[1][0],60);
assert.equal(sixty.samples.length,60*22050);
assert.ok(Math.abs(sixty.samples.at(-1)-sixty.samples[0])<.003);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/(src="[^"]+?\.js)\?[^" ]+(?=")/g,'$1');
assert.ok(html.includes('src="handheld-v18.js"')||html.includes('src="handheld-v19.js"')||(html.includes('src="handheld-v20.js"')||html.includes('src="handheld-v21.js"')));
console.log('PASS v1.8: 48 presets, 9 scene-select cases, manual overrides, 8+ new timbres, PCM, Zeta WAV loops');
