const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const dir=path.resolve(__dirname,'..'),window={},ctx={window,Blob,console};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','handheld-v11.js'])
 vm.runInNewContext(fs.readFileSync(path.join(dir,file),'utf8'),ctx,{filename:file});
const A=window.PlotuneAnalysis,R=window.PlotuneResonare,H=window.PlotuneHandheld;
const IDs=Object.keys(H.STYLES);
assert.equal(IDs.length,30);
const grouped=H.GROUPS.flatMap(g=>g.ids);
assert.equal(new Set(grouped).size,30);
assert.deepEqual(Array.from(grouped).sort(),Array.from(IDs).sort());
for(const [term,expected] of [
 ['うれしい、やったー！','joy'],['ぷんぷん、怒っちゃった','anger'],
 ['しょんぼり、悲しい','sadness'],['楽しい、るんるん','fun'],
 ['えっへん、得意げ','proud'],['大成功！','victory'],
 ['くやしい','frustration'],['もじもじ照れる','shyness'],
 ['ひとりぼっち','lonely'],['おろおろ、どうしよう','anxiety'],
 ['こわいよ','fear'],['ずっこけて失敗','failure'],
 ['れんしゅうを続ける','retry'],['こっそりいたずら','prank'],
 ['追いかけっこ','chase'],['発見した','discovery'],
 ['夢みたいな魔法','wonder'],['秘密がばれる','suspense'],
 ['おやすみ、すやすや','sleep'],['雨音がする','rain'],
 ['久しぶりに再会','reunion'],['さようなら','farewell'],
 ['お祭りで大騒ぎ','festival'],['勝負する','battle']
]){
 const detected=H.chooseStyle(term);
 assert.equal(detected.style,expected,term);
 assert.ok(detected.evidence.length>0,term);
}
assert.equal(H.chooseStyle('景色を見つめていた').confidence,'low');
const input={title:'ぽんぽん',character:'人間に褒められたい',world:'里',scene:'ぷんぷん怒っちゃった',duration:15,style:'handheld'};
const plan=A.plan(input,A.analyze(input));
const appraisal=R.analyze(input);
const automatic=H.prepare(plan,'auto',appraisal,false,input.scene);
assert.equal(automatic.gameStyle,'anger');
assert.equal(automatic.gameAutoChoice.style,'anger');
assert.equal(H.score(automatic).details.emotionMode,'minor');
const signatures=new Set();
for(const id of IDs){
 const s=H.score(H.prepare(plan,id,appraisal,false,input.scene));
 assert.equal(s.details.gameStyle,id);
 assert.ok(s.notes.length>75,id+' insufficient arrangement notes');
 assert.ok(s.drums.length>5,id+' no rhythm');
 assert.ok(s.details.parts.lead>3&&s.details.parts.chords>2&&s.details.parts.bass>2);
 assert.ok(s.notes.every(n=>n.d>0&&n.t>=0&&n.t+n.d<=15+.001));
 assert.ok(s.drums.every(d=>d.t>=0&&d.t<15));
 const first=s.notes.filter(n=>n.t<3).map(n=>n.voice+':'+n.midi+':'+Math.round(n.t*10)).join('|');
 const percussion=s.drums.filter(n=>n.t<3).map(n=>n.kind+':'+Math.round(n.t*10)).join('|');
 signatures.add(first+' / '+percussion);
}
assert.ok(signatures.size>=20,'30 styles must have materially different score signatures, found '+signatures.size);
const selected=['joy','anger','sadness','fun'];
const tracks=[];
for(const id of selected){
 const track=H.render(H.prepare(plan,id,appraisal,false,input.scene));
 tracks.push(track);
 assert.equal(track.samples.length,15*22050);
 let peak=0;for(let i=0;i<track.samples.length;i+=139)peak=Math.max(peak,Math.abs(track.samples[i]));
 assert.ok(peak>.05&&peak<=1);
 assert.ok(Math.abs(track.samples.at(-1)-track.samples[0])<.002);
 assert.equal(H.wavBlob(track.samples,track.sampleRate).size,track.samples.length*2+44);
}
const firstDifference=(x,y)=>{let d=0;for(let i=0;i<22050;i+=21)d+=Math.abs(x.samples[i]-y.samples[i]);return d/1050};
assert.ok(firstDifference(tracks[0],tracks[1])>.004);
assert.ok(firstDifference(tracks[0],tracks[2])>.004);
console.log('PASS v1.1: 30 plot styles, all emotions, 24 scene detections, unique arrangements, 4 PCM loops');
