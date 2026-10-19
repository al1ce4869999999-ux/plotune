const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const out=path.join(__dirname,'..','listening-samples');fs.mkdirSync(out,{recursive:true});
const window={},context={window,Blob,console,Float32Array,Uint8Array,DataView,ArrayBuffer};
vm.createContext(context);
for(const name of ['melodic-grammar-v01.js','composer-v04.js','handheld-v21.js']){
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
}
const normal=window.PlotuneComposerV4,game=window.PlotuneHandheld;
const base={seed:486,characterSeed:1729,bpm:90,duration:15,mode:'minor',root:60,genre:'piano'};
const examples=[
 {name:'01-normal-piano',engine:normal,plan:{...base},description:'通常曲／ピアノ'},
 {name:'02-sad-musicbox',engine:game,plan:game.prepare({...base},'musicbox',null,false,'悲しい別れ','悲しい別れ'),description:'オルゴール'},
 {name:'03-courage-flute',engine:game,plan:game.prepare({...base},'courageflute',null,false,'勇気を出して一歩進む','勇気を出して一歩進む'),description:'笛'},
 {name:'04-character',engine:game,plan:game.prepare({...base},'journey',null,false,'ぽんぽんは一人で林を歩いている','ぽんぽんは小さくて好奇心旺盛。林で一歩踏み出す'),description:'キャラクター曲'}
];
const result=[];
(async()=>{for(const x of examples){
 const score=x.engine===normal?normal.buildScore(x.plan):game.score(x.plan);
 const audio=x.engine.render(x.plan);const wav=x.engine.wavBlob(audio.samples,audio.sampleRate);
 const pcm=audio.samples;let peak=0,sum=0,nonzero=0,invalid=0;
 for(const sample of pcm){if(!Number.isFinite(sample))invalid++;else {peak=Math.max(peak,Math.abs(sample));sum+=sample*sample;if(Math.abs(sample)>1e-5)nonzero++;}}
 const lead=score.notes.filter(n=>n.role==='lead').sort((a,b)=>a.t-b.t);
 const melodicIntervals=lead.slice(1).map((n,i)=>n.midi-lead[i].midi);
 const report={name:x.name,description:x.description,leadNotes:lead.length,uniquePitches:new Set(lead.map(n=>n.midi)).size,
 intervals:melodicIntervals.slice(0,25),starts:lead.slice(0,16).map(n=>+n.t.toFixed(3)),peak:+peak.toFixed(5),
 rms:+Math.sqrt(sum/pcm.length).toFixed(5),nonzeroFraction:+(nonzero/pcm.length).toFixed(3),invalid,
 duration:score.duration,instrument:lead[0]?.timbre||lead[0]?.voice,bytes:wav.size};
 if(!lead.length||invalid||!nonzero||peak>1.00001)throw Error('Audio sanity failed: '+x.name);
 fs.writeFileSync(path.join(out,x.name+'.wav'),Buffer.from(await wav.arrayBuffer()));
 result.push(report);
}
fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));})().catch(e=>{console.error(e);process.exitCode=1});
