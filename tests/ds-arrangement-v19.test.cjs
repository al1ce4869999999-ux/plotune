const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),window={},ctx={window,Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','handheld-v19.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,H=window.PlotuneHandheld;
const input=(scene,duration=15)=>({title:'ぽんぽん',character:'小さな狸',world:'森',scene,style:'handheld',duration});
function plan(style,scene,variant=false,duration=15){
 const form=input(scene,duration),base=A.plan(form,A.analyze(form)),ap=R.analyze(form);
 return H.prepare(variant?R.attachPlan(base,ap):base,style,ap,variant,scene);
}
const sad='道端でひとりぼっちになり、涙を流した';
const bold='怖くても勇気を出して立ち向かった';
const strange='洞窟の暗闇に怪しい光が揺れた';
for(const style of ['journey','sadness','proud','mystery','battle','village']){
 const a=plan(style,sad),b=plan(style,bold),c=plan(style,strange);
 assert.equal(a.gameStyle,style,'manual style must stay selected');
 assert.equal(b.gameStyle,style);
 assert.equal(c.gameStyle,style);
 assert.equal(a.instrumentChoice.style,'ocarinalament');
 assert.equal(b.instrumentChoice.style,'ocarinacourage');
 assert.equal(c.instrumentChoice.style,'synthmystery');
 assert.ok(a.instrumentChoice.reason.includes('涙')||a.instrumentChoice.reason.includes('ひとりぼっち'));
 assert.ok(H.score(a).notes.some(n=>n.timbre==='ocarina'));
 assert.ok(H.score(c).notes.some(n=>n.timbre==='synthlead'));
 assert.notDeepEqual(
  H.score(a).notes.filter(n=>n.voice==='lead').slice(0,7).map(n=>n.midi),
  H.score(c).notes.filter(n=>n.voice==='lead').slice(0,7).map(n=>n.midi),
  'different scenes should generate different melody shapes');
 assert.equal(H.score(plan(style,sad,true)).details.instrumentSelection.style,'ocarinalament','A/B must preserve scene instrumentation');
}
const sadness=H.score(plan('sadness',sad)),triumph=H.score(plan('retry',bold));
assert.ok(sadness.drums.length<triumph.drums.length,'selected dramatic style still governs rhythm');
assert.ok(sadness.notes.filter(n=>n.voice==='lead').some(n=>n.d>.8),'melancholy melody breathes');
assert.ok(triumph.notes.filter(n=>n.voice==='lead').length>sadness.notes.filter(n=>n.voice==='lead').length,'heroic melody more active');
const legacy=plan('musicbox',sad);
assert.equal(legacy.instrumentChoice,null);
assert.equal(H.score(legacy).details.storyInstrument.family,'musicbox');
const rawScene=plan('journey','草原を歩いている');
assert.ok(rawScene.instrumentChoice?.palette?.family);
assert.equal(H.score(rawScene).details.gameStyle,'journey');
for(const p of [plan('sadness',sad),plan('retry',bold)]){
 const rendered=H.render(p);
 assert.equal(rendered.samples.length,15*22050);
 assert.ok(rendered.samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=1));
 assert.ok(Math.abs(rendered.samples[0]-rendered.samples.at(-1))<.003);
 assert.equal(H.wavBlob(rendered.samples,rendered.sampleRate).size,rendered.samples.length*2+44);
}
const long=H.render(plan('sadness',sad,false,60));
assert.equal(long.samples.length,60*22050);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ui=fs.readFileSync(path.join(root,'app-v13.js'),'utf8');
assert.ok(html.includes('src="handheld-v19.js"'));
assert.ok(ui.includes("g.label.includes('物語を彩る楽器')"),'instrument-only presets should be hidden from new DS chooser');
assert.ok(ui.includes("if(base.instrumentChoice)"),'user can inspect instrument reason');
console.log('PASS v1.9: same DS style + three scenes = different instruments/melody; manual style preserved; 15/60s WAV');
