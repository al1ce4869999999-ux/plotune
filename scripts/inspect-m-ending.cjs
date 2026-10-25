// M-series ending diagnostics. Run from repository root: node scripts/inspect-m-ending.cjs
// Diagnostic only: score notes are not a substitute for listening to rendered PCM.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{},Blob,console};
for(const name of [
 'analyzer.js','resonare-v08.js','loop-arranger-v09.js',
 'motif-planner-v01.js','melodic-grammar-v01.js',
 'm2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','handheld-v21.js'
]){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
}
const A=context.window.PlotuneAnalysis;
const H=context.window.PlotuneHandheld;
const input={title:'harmonic movement',character:'小さな旅人',world:'森',
 scene:'森を進み、最後に帰る',style:'handheld',duration:30};
const plan=A.plan(input,A.analyze(input));
const variants=[
 {name:'baseline',flags:{}},
 {name:'M3',flags:{musicHarmony:true,musicDevelopment:true,motifDevelopment:true}},
 {name:'M3+M4',flags:{musicHarmony:true,musicDevelopment:true,motifDevelopment:true,musicVoices:true}},
 {name:'M3+M4+M5',flags:{musicHarmony:true,musicDevelopment:true,motifDevelopment:true,musicVoices:true,musicPerformance:true}}
];
for(const preset of ['journey','musicbox','forestflute']){
 for(const variant of variants){
  const score=H.score({...H.prepare(plan,preset,null,false,input.scene),...variant.flags});
  const start=Math.max(0,score.duration-4);
  const tail=score.notes.filter(n=>n.t+n.d>start).sort((a,b)=>a.t-b.t||a.midi-b.midi);
  const lastLead=score.notes.filter(n=>n.voice==='lead').sort((a,b)=>a.t-b.t).at(-1);
  console.log(JSON.stringify({
   preset,variant:variant.name,duration:score.duration,
   tailWindow:[start,score.duration],
   lastLead:lastLead?{t:lastLead.t,d:lastLead.d,midi:lastLead.midi}:null,
   tail:tail.map(n=>({
    t:+n.t.toFixed(4),d:+n.d.toFixed(4),
    midi:n.midi,voice:n.voice,timbre:n.timbre||null,
    transitionMarker:n.transitionMarker||null
   }))
  }));
 }
}
