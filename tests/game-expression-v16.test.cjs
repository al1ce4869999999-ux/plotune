const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),window={},context={window,Blob,console};
for(const f of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','handheld-v16.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,H=window.PlotuneHandheld;
function scene(text){
 const form={title:'ぽんぽん',character:'人間に褒められたい',world:'里',scene:text,style:'handheld',duration:15};
 const p=A.plan(form,A.analyze(form)),ap=R.analyze(form);
 const picked=H.chooseStyle(text);
 return {picked,base:H.score(H.prepare(p,'auto',ap,false,text)),
         active:H.score(H.prepare(R.attachPlan(p,ap),'auto',ap,true,text)),p,ap};
}
for(const [text,style] of [
 ['ぽんぽんがしくしく泣いている。','sadness'],
 ['しょんぼりして目に涙をためた。','sadness'],
 ['誰も来ない。ひとりで待ち続ける。','lonely'],
 ['遠ざかっていく背中が見えなくなった。','farewell'],
 ['大声でぷんぷん怒った。','anger'],
 ['うれしい！やったー！','joy'],
 ['たのしい、わくわく。','fun'],
 ['こわい、びくびく。','fear']
]){
 assert.equal(H.chooseStyle(text).style,style,text);
}
const sad=scene('しょんぼり、ぽんぽんはしくしく泣いた。');
const bright=scene('ぽんぽんはうれしい！やったー！');
const angry=scene('ぷんぷん、激怒している。');
function count(s,v){return s.notes.filter(n=>n.voice===v).length}
assert.equal(sad.base.details.emotionMode,'minor');
assert.equal(sad.base.details.emotionalProfile,'melancholy');
assert.ok(sad.base.bpm<bright.base.bpm,'slower than upbeat music');
assert.equal(count(sad.base,'arp'),0,'sad score has no bouncy arpeggio');
assert.equal(count(sad.base,'sparkle'),0,'sad score does not twinkle');
assert.ok(count(sad.base,'lead')<count(bright.base,'lead')*.50,'sparse lead phrasing');
assert.ok(sad.base.drums.length<bright.base.drums.length*.55,'sparse percussion');
assert.ok(sad.base.notes.filter(x=>x.voice==='lead').some(x=>x.d>1.4),'long melodic notes');
assert.ok(sad.base.notes.filter(x=>x.voice==='chords').some(x=>x.d>1.5),'sustained harmony');
assert.equal(sad.active.details.emotionalProfile,'melancholy');
assert.deepEqual(sad.base.harmony.map(x=>x.chord),sad.active.harmony.map(x=>x.chord),
 'Resonare should not overwrite minor melancholy harmony');
assert.equal(bright.base.details.emotionalProfile,null,'retain cheerful original');
assert.ok(bright.base.drums.length>angry.base.drums.length*.55,'different percussive densities');
for(const k of ['sadness','lonely','farewell','rain','fear','anxiety']){
 const input={title:'t',character:'',world:'',scene:'場面',style:'handheld',duration:15};
 const plan=A.plan(input,A.analyze(input));
 const s=H.score(H.prepare(plan,k,null,false,'場面'));
 assert.ok(s.notes.length>5&&s.drums.length>=5,k+' must stay audible');
 assert.ok(s.notes.every(n=>n.d>0&&n.t+n.d<=15+.001));
 assert.ok(s.drums.every(n=>n.t>=0&&n.t<15));
}
const base=H.prepare(sad.p,'sadness',sad.ap,false);
const audio=H.render(base);
assert.equal(audio.samples.length,15*22050);
assert.ok(audio.samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=1));
assert.ok(Math.abs(audio.samples[0]-audio.samples.at(-1))<.003);
assert.equal(H.wavBlob(audio.samples,audio.sampleRate).size,audio.samples.length*2+44);
console.log('PASS v1.6: real sorrowful score phrasing, no pop rhythm, six mood families, stable loop and WAV');
