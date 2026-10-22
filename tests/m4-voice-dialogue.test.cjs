const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{},Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js',
 'motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js',
 'm3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','handheld-v21.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
}
const M=context.window.PlotuneM4Voices,H=context.window.PlotuneHandheld,A=context.window.PlotuneAnalysis;
const lead=[],harmony=[],wholeTrackArc=[],bars=16;
for(let b=0;b<bars;b++){
 harmony.push({t:b*16,chord:[0,4,5,3][b%4]});
 wholeTrackArc.push({bar:b+1,stage:b<4?'opening':b<8?'development':b<13?'climax':'resolution'});
 for(let i=0;i<5;i++)lead.push({t:b*16+i*3,d:2.6,midi:72+[0,2,5,4,7][i]+b%3,
  volume:.12,voice:'lead',role:'lead'});
}
const original=[...lead,{t:12,d:1,midi:64,voice:'counter',role:'counter',volume:.04},
 {t:0,d:15,midi:48,voice:'pad',role:'pad',volume:.03}];
const snapshot=JSON.stringify(original),args={notes:original,harmony,duration:bars*16,
 meter:16,step:1,seed:20261022,wholeTrackArc,tonic:60,scale:[0,2,4,5,7,9,11]};
const result=M.arrange(args),again=M.arrange(args);
assert.equal(JSON.stringify(result),JSON.stringify(again),'same seed / same score');
assert.equal(JSON.stringify(original),snapshot,'pure: original notes untouched');
assert.ok(result.responseCount>=2,'phrase replies are actually created');
assert.ok(result.responses.every(r=>r.stage!=='opening'&&r.bar>0&&r.bar<bars-1),'dramatic arc and boundaries');
assert.ok(result.responses.some((r,i)=>i&&r.bar-result.responses[i-1].bar>=2),'nonconstant entrances');
assert.equal(result.notes.filter(n=>n.voice==='counter').length,result.responses.reduce((s,r)=>s+r.notes.length,0),'fixed legacy counter replaced');
for(const reply of result.responses){
 assert.ok(reply.source.length>=2,'motif inherited from audible melody');
 const sounding=result.notes.filter(n=>n.voice==='lead');
 assert.ok(sounding.every(n=>n.t>=reply.until||n.t+n.d<=reply.from+.00001),'leave real lead silence for the reply');
 assert.ok(reply.notes.every(n=>n.t>=reply.from&&n.t+n.d<=reply.until+.00001&&n.midi>=46&&n.midi<=83),'counter range/time bounds');
}
assert.notEqual(JSON.stringify(result.responses),JSON.stringify(M.arrange({...args,seed:9}).responses),'seed varies orchestration');
assert.throws(()=>M.arrange({notes:[],duration:0,meter:1,step:1}),/valid timing/);

const input={title:'M4 audible voice exchange',character:'静かな旅人',world:'森',scene:'森の道を歩き、最後に帰る',style:'handheld',duration:30};
const p=A.plan(input,A.analyze(input));
for(const preset of ['journey','musicbox','forestflute']){
 const prepared=H.prepare(p,preset,null,false,input.scene);
 const shared={...prepared,motifDevelopment:true,musicDevelopment:true,musicHarmony:true};
 const off=H.score(shared),on=H.score({...shared,musicVoices:true}),replay=H.score({...shared,musicVoices:true});
 assert.equal(JSON.stringify(on.notes),JSON.stringify(replay.notes),'M4 seed stability '+preset);
 assert.equal(JSON.stringify(on.harmony),JSON.stringify(off.harmony),'M3 harmony unchanged '+preset);
 assert.ok(on.details.voiceDialogue?.responseCount>0,'real score has replies '+preset);
 assert.notEqual(JSON.stringify(on.notes),JSON.stringify(off.notes),'M4 affects playable note events '+preset);
 assert.ok(on.notes.some(n=>n.voice==='counter'),'counter sounds in actual preset '+preset);
 assert.ok(on.notes.every(n=>n.t>=0&&n.d>0&&n.t+n.d<=on.duration+.001&&Number.isFinite(n.midi)),'duration bounds '+preset);
 assert.equal(JSON.stringify(H.score(shared).notes),JSON.stringify(off.notes),'M4 OFF remains legacy '+preset);
}
const same={...H.prepare(p,'journey',null,false,input.scene),motifDevelopment:true,musicDevelopment:true,musicHarmony:true};
const offAudio=H.render(same),onAudio=H.render({...same,musicVoices:true});
assert.equal(offAudio.samples.length,onAudio.samples.length,'equal PCM lengths');
let difference=0;
for(let i=0;i<offAudio.samples.length;i+=199)difference+=Math.abs(offAudio.samples[i]-onAudio.samples[i]);
assert.ok(difference>1,'PCM actually changes, not just metadata');
const html=fs.readFileSync(path.join(root,'impression-lab.html'),'utf8');
assert.match(html,/value="m4"/,'M4 selectable');
assert.match(html,/tracks\.A=buildM4\(\$\('characterA'\)\.value,false\)/,'same character OFF');
assert.match(html,/tracks\.B=buildM4\(\$\('characterA'\)\.value,true\)/,'same character ON');
assert.match(html,/musicDevelopment:true,musicHarmony:true,musicVoices/,'M1-M3 shared in both comparison paths');
for(const file of ['index.html','impression-lab.html'])
 assert.match(fs.readFileSync(path.join(root,file),'utf8'),/m4-voice-dialogue-v01\.js/,'active M4 asset '+file);
console.log('PASS M4 phrase-aware dialogue, imitation, overlap, presets, PCM, equal-input A/B, seed, OFF');
