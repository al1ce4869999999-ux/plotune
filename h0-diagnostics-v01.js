/* H0 read-only score diagnostics; never modifies score or draws from the RNG. */
(function(root){
'use strict';
const CONDITIONS=['Baseline','Phase','M','Phase+M'];
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const snapshot=n=>n?{midi:finite(n.midi)?n.midi:null,onset:finite(n.t)?n.t:null,duration:finite(n.d)?n.d:null,velocity:finite(n.volume)?n.volume:null,voice:n.voice||null}:null;
function diagnose(cases,seed,{windowBars=2}={}){
 if(!Number.isInteger(seed)||seed<0)throw new TypeError('invalid seed');
 if(!cases||typeof cases!=='object')throw new TypeError('cases required');
 const events=[],summary={};const bounded=Math.max(1,Math.min(8,Number.isInteger(windowBars)?windowBars:2));
 for(const condition of CONDITIONS){
  const score=cases[condition]?.score;
  if(!score||!Array.isArray(score.notes)){summary[condition]={status:'unconfirmed',reason:'SCORE_UNAVAILABLE'};continue;}
  const meter=finite(score.meter)&&score.meter>0?score.meter:finite(score.duration)&&score.duration>0?score.duration/4:null;
  const notes=score.notes.filter(n=>n&&finite(n.t)&&finite(n.d)&&n.d>0&&finite(n.midi)).map(snapshot);
  const boundaries=new Set();
  for(const b of score.details?.transitions||[]){
   const t=finite(b?.boundary)?b.boundary:finite(b?.t)?b.t:null;
   if(t!==null)boundaries.add(t);
  }
  const noteByVoice=new Map();
  for(const n of notes){if(!noteByVoice.has(n.voice))noteByVoice.set(n.voice,[]);noteByVoice.get(n.voice).push(n);}
  for(const list of noteByVoice.values())list.sort((a,b)=>a.onset-b.onset||a.midi-b.midi);
  let generated=0;
  for(const boundary of [...boundaries].sort((a,b)=>a-b)){
   const section=finite(meter)?Math.floor(boundary/meter):null;
   for(const [voice,list] of noteByVoice){
    const near=list.filter(n=>Math.abs(n.onset-boundary)<=bounded*(meter||1));
    let prev=null;
    for(const n of near){
     const leap=prev===null?null:n.midi-prev.midi;
     const repeated=prev!==null&&n.midi===prev.midi;
     const suspect=leap!==null&&Math.abs(leap)>=12?'LARGE_LEAP':repeated?'REPEATED_PITCH':'unconfirmed';
     events.push({seed,condition,section,bar:meter===null?null:Math.floor(n.onset/meter),timestamp:n.onset,voice,sourceStage:'final-score',originalNote:null,transformedNote:n,activeChord:null,suspectedProblem:suspect,evidence:{boundary,intervalSemitones:leap,repeat:repeated},confidence:suspect==='unconfirmed'?'unconfirmed':'low'});
     generated++;prev=n;
    }
   }
  }
  summary[condition]={status:'observed',noteCount:notes.length,boundaryCount:boundaries.size,eventCount:generated,voices:[...noteByVoice.keys()].sort(),limitations:['STAGE_PROVENANCE_UNAVAILABLE','HARMONY_CONTEXT_NOT_LINKED']};
 }
 return {schema:'plotune.h0.diagnostic',version:1,seed,conditions:CONDITIONS,summary,events};
}
const api={CONDITIONS,diagnose};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.PlotuneH0Diagnostics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
