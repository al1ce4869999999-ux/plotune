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
  const meter=finite(score.meter)&&score.meter>0?score.meter:finite(score.duration)&&score.duration>0&&Number.isInteger(score.details?.loopBars)&&score.details.loopBars>0?score.duration/score.details.loopBars:null;
  const notes=score.notes.filter(n=>n&&finite(n.t)&&finite(n.d)&&n.d>0&&finite(n.midi)).map(snapshot);
  const boundaries=new Set();
  for(const b of score.details?.transitions||[]){
   const t=finite(b?.boundary)?b.boundary:finite(b?.t)?b.t:null;
   if(t!==null)boundaries.add(t);
  }
  if(finite(score.duration)&&score.duration>0){for(let k=1;k<4;k++)boundaries.add(score.duration*k/4);}
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
     events.push({seed,condition,section,bar:meter===null?null:Math.floor(n.onset/meter),timestamp:n.onset,voice,sourceStage:'final-score',originalNote:null,transformedNote:n,activeChord:Array.isArray(score.harmony)?(score.harmony.filter(h=>finite(h?.t)&&h.t<=n.onset).at(-1)?.chord??null):null,suspectedProblem:suspect,evidence:{boundary,intervalSemitones:leap,repeat:repeated},confidence:suspect==='unconfirmed'?'unconfirmed':'low'});
     generated++;prev=n;
    }
   }
  }
  summary[condition]={status:'observed',noteCount:notes.length,boundaryCount:boundaries.size,eventCount:generated,voices:[...noteByVoice.keys()].sort(),limitations:['STAGE_PROVENANCE_UNAVAILABLE','CHORD_PITCH_CLASSES_UNAVAILABLE']};
 }
 return {schema:'plotune.h0.diagnostic',version:1,seed,conditions:CONDITIONS,summary,events};
}
function ablate(engine,entry,seed){
 if(!engine||typeof engine.score!=='function'||!entry?.plan||!entry?.score)throw new TypeError('M condition entry and engine required');
 const flagNames={M2:'musicDevelopment',M3:'musicHarmony',M4:'musicVoices',M5:'musicPerformance'};
 const variants={};
 const original=entry.score.notes||[];
 for(const [stage,flag] of Object.entries(flagNames)){
  const plan={...entry.plan,[flag]:false};
  const score=engine.score(plan);
  const notes=Array.isArray(score?.notes)?score.notes:[];
  const fingerprint=n=>[n.voice,n.t,n.d,n.midi,n.volume].join('|');
  const unchanged=original.length===notes.length&&original.every((n,i)=>fingerprint(n)===fingerprint(notes[i]));
  variants[stage]={disabledFlag:flag,unchanged,baseCount:original.length,variantCount:notes.length,
   firstDifference:unchanged?null:(()=>{const limit=Math.max(original.length,notes.length);for(let i=0;i<limit;i++)if(!original[i]||!notes[i]||fingerprint(original[i])!==fingerprint(notes[i]))return {index:i,originalNote:snapshot(original[i]),transformedNote:snapshot(notes[i])};return null;})(),
   inference:'unconfirmed'};
 }
 return {schema:'plotune.h0.ablation',version:1,seed,condition:'M',variants};
}
// Align unchanged notes first, then conservatively match by voice and onset.
function alignNotes(before,after){
 const usedBefore=new Set(),usedAfter=new Set(),pairs=[];
 const key=n=>JSON.stringify(snapshot(n)),buckets=new Map();
 before.forEach((n,i)=>{const k=key(n);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(i);});
 after.forEach((n,j)=>{const q=buckets.get(key(n));if(q?.length){const i=q.shift();usedBefore.add(i);usedAfter.add(j);}});
 const candidates=[];
 before.forEach((a,i)=>{
  if(usedBefore.has(i)||!finite(a?.t))return;
  after.forEach((b,j)=>{
   if(usedAfter.has(j)||!finite(b?.t)||a.voice!==b.voice)return;
   const delta=Math.abs(a.t-b.t),tolerance=Math.max(.08,Math.min(.5,Math.min(a.d||.5,b.d||.5)));
   if(delta>tolerance)return;
   candidates.push({i,j,cost:delta*100+Math.abs((a.midi??0)-(b.midi??0))*.05});
  });
 });
 candidates.sort((a,b)=>a.cost-b.cost||a.i-b.i||a.j-b.j);
 for(const {i,j} of candidates){if(usedBefore.has(i)||usedAfter.has(j))continue;usedBefore.add(i);usedAfter.add(j);pairs.push({i,j});}
 before.forEach((_,i)=>{if(!usedBefore.has(i))pairs.push({i,j:null});});
 after.forEach((_,j)=>{if(!usedAfter.has(j))pairs.push({i:null,j});});
 return pairs.sort((a,b)=>(a.j??Infinity)-(b.j??Infinity)||(a.i??Infinity)-(b.i??Infinity));
}
function compareStages(stages,seed,condition='M'){
 if(!Number.isInteger(seed)||seed<0)throw new TypeError('invalid seed');
 if(!stages||typeof stages!=='object')throw new TypeError('stages required');
 const order=['preM4','postM4','postM5','postTransition'],events=[];
 for(let i=1;i<order.length;i++){
  const previous=stages[order[i-1]],current=stages[order[i]];
  if(!Array.isArray(previous)||!Array.isArray(current))continue;
  const identityAvailable=previous.every(n=>typeof n?.h0Id==='string')&&current.every(n=>typeof n?.h0Id==='string');
  let matches;
  if(identityAvailable){
   const beforeById=new Map(previous.map((n,i)=>[n.h0Id,i]));
   const afterById=new Map(current.map((n,j)=>[n.h0Id,j]));
   matches=[...beforeById].map(([id,i])=>({i,j:afterById.has(id)?afterById.get(id):null}));
   current.forEach((n,j)=>{if(!beforeById.has(n.h0Id))matches.push({i:null,j});});
  }else matches=alignNotes(previous,current);
  for(const {i:beforeIndex,j:afterIndex} of matches){
   const a=beforeIndex===null?null:snapshot(previous[beforeIndex]),b=afterIndex===null?null:snapshot(current[afterIndex]);
   if(JSON.stringify(a)===JSON.stringify(b))continue;
   events.push({seed,condition,section:null,bar:null,timestamp:b?.onset??a?.onset??null,voice:b?.voice??a?.voice??null,
    sourceStage:order[i],originalNote:a,transformedNote:b,activeChord:null,
    suspectedProblem:'unconfirmed',evidence:{beforeIndex,afterIndex,
     noteId:identityAvailable?(beforeIndex===null?current[afterIndex].h0Id:previous[beforeIndex].h0Id):null,
     parentId:identityAvailable&&afterIndex!==null?current[afterIndex].h0ParentId||null:null,
     comparison:beforeIndex===null?'inserted-note':afterIndex===null?'removed-note':identityAvailable?'persistent-note-id':'voice-and-onset-heuristic',
     noteCountBefore:previous.length,noteCountAfter:current.length},confidence:identityAvailable?'high':'unconfirmed'});
  }
 }
 return {schema:'plotune.h0.stage-diff',version:1,seed,condition,events,
  limitations:['FALLBACK_HEURISTIC_WHEN_IDS_ABSENT','NO_CAUSAL_ATTRIBUTION']};
}
function comparePhrases(phraseTrace,seed,condition='M'){
 if(!Number.isInteger(seed)||seed<0)throw new TypeError('invalid seed');
 const events=[];
 if(!phraseTrace||typeof phraseTrace!=='object')return {schema:'plotune.h0.phrase-diff',version:1,seed,condition,events};
 for(const [beforeKey,afterKey,stage] of [['beforeM2','afterM2','M2'],['afterM2','afterM3','M3']]){
  const before=phraseTrace[beforeKey],after=phraseTrace[afterKey];
  if(!Array.isArray(before)||!Array.isArray(after))continue;
  for(let bar=0;bar<Math.max(before.length,after.length);bar++){
   const a=before[bar]||[],b=after[bar]||[];
   for(let index=0;index<Math.max(a.length,b.length);index++){
    if(JSON.stringify(a[index]??null)===JSON.stringify(b[index]??null))continue;
    events.push({seed,condition,section:null,bar,timestamp:null,voice:'lead',sourceStage:stage,
     originalNote:a[index]??null,transformedNote:b[index]??null,activeChord:null,
     suspectedProblem:'unconfirmed',evidence:{eventIndex:index,representation:'phrase-event-not-midi'},confidence:'unconfirmed'});
   }
  }
 }
 return {schema:'plotune.h0.phrase-diff',version:1,seed,condition,events,
  limitations:['PHRASE_EVENTS_NOT_RENDERED_NOTES','INDEX_MATCHING_NOT_NOTE_IDENTITY']};
}
const api={CONDITIONS,diagnose,ablate,compareStages,comparePhrases};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.PlotuneH0Diagnostics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
