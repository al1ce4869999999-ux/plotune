const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),window={},ctx={window,Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','handheld-v17.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,H=window.PlotuneHandheld;
const cases=[
 ['musicbox','悲しいオルゴールが聞こえる。','musicbox'],
 ['starbox','星空のオルゴールが鳴る。','musicbox'],
 ['courageflute','勇気を出して立ち向かう。','flute'],
 ['dawnflute','希望の夜明け。','flute'],
 ['distantbell','遠くの鐘が鳴る。','bell'],
 ['farewellpiano','別れのピアノが聞こえる。','softpiano'],
 ['forestflute','森の笛が鳴る。','flute'],
 ['lullabybox','眠りにつく小さな子。','musicbox'],
 ['resolvebells','決意の旅へ。','flute']
];
assert.equal(Object.keys(H.STYLES).length,39);
assert.equal(H.GROUPS.flatMap(g=>g.ids).length,39);
for(const [id,text,family] of cases){
 const input={title:'ぽんぽん',character:'ちいさなたぬき',world:'森',scene:text,style:'handheld',duration:15};
 const p=A.plan(input,A.analyze(input));const ap=R.analyze(input);
 const score=H.score(H.prepare(p,id,ap,false,text));
 assert.equal(score.details.storyInstrument.family,family);
 assert.ok(score.notes.some(n=>n.voice==='lead'&&n.t===0),'music starts at zero');
 assert.ok(score.notes.some(n=>n.voice==='pad'),'harmonic support');
 assert.ok(score.notes.every(n=>n.d>0&&n.t>=0&&n.t+n.d<=15+.00001));
 assert.ok(score.drums.every(d=>d.t>=0&&d.t<15));
 if(family==='musicbox'||family==='bell'||family==='softpiano'){
  assert.equal(score.drums.length,0,'mysterious textures must not have pop drums');
  assert.equal(score.notes.some(n=>n.voice==='arp'),false,'no bouncing arpeggio');
 }
 if(family==='flute')assert.ok(score.notes.filter(n=>n.voice==='lead').length>=12,'long flute tune');
}
for(const [text,id] of [
 ['切ないオルゴールの音','musicbox'],
 ['勇気を奮い立ち向かう','courageflute'],
 ['遠くの鐘が聞こえる','distantbell'],
 ['森の笛が響いた','forestflute']
])assert.equal(H.chooseStyle(text).style,id);
const make=id=>{const input={title:'ぽんぽん',character:'',world:'',scene:'夕暮れ',style:'handheld',duration:15};
 const p=A.plan(input,A.analyze(input));return H.render(H.prepare(p,id,null,false,'夕暮れ'))};
const a=make('musicbox'),b=make('courageflute'),c=make('distantbell'),d=make('farewellpiano');
for(const r of [a,b,c,d]){
 assert.equal(r.samples.length,15*22050);
 assert.ok(r.samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=1));
 assert.ok(Math.abs(r.samples[0]-r.samples.at(-1))<.003);
 assert.equal(H.wavBlob(r.samples,r.sampleRate).size,r.samples.length*2+44);
}
function relativeDiff(a,b){
 let sum=0;for(let i=0;i<22050;i+=37)sum+=Math.abs(a.samples[i]-b.samples[i]);
 return sum/Math.ceil(22050/37);
}
assert.ok(relativeDiff(a,b)>.004,'musicbox and flute have distinct audio');
assert.ok(relativeDiff(a,c)>.004,'musicbox and bell have distinct audio');
assert.ok(relativeDiff(b,d)>.004,'flute and piano have distinct audio');
console.log('PASS v1.7: 9 story instrument palettes, automatic cues, distinct PCM, loop WAV, no pop drums');
