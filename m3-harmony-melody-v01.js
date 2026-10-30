/* M3: deterministic joint chord/phrase planning. Opt-in, no direct renderer mutation. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mod=x=>(x%7+7)%7;
const triad=[0,2,4];
const distance=(a,b)=>{const d=Math.abs(mod(a)-mod(b));return Math.min(d,7-d)};
function phraseFit(events,chord,tension){
 let sum=0,weight=0;
 for(const e of events){
  if(e.rest)continue;
  const strong=e.position%4<.6?2.5:e.position%2<.5?1.5:1;
  const closest=Math.min(...triad.map(d=>distance(e.degree+chord,chord+d)));
  const passing=closest===1&&strong<2;
  sum+=strong*(closest===0?1.2:passing?.2:-.9*closest)*(1-.3*tension);
  weight+=strong;
 }
 return weight?sum/weight:-3;
}
function voiceLeading(chord,prev){
 if(prev==null)return 0;
 const from=triad.map(d=>prev+d),to=triad.map(d=>chord+d);
 return to.reduce((sum,n)=>sum+Math.min(...from.map(p=>distance(n,p))),0)/3;
}
function refine(events,chord,tension,close){
 return events.map((e,i)=>{
  const out={...e};
  if(e.rest)return out;
  // Strong beats are guided to harmony; weak beats retain passing motion.
  const accented=e.position%4<.6;
  if(accented&&tension<.78&&distance(e.degree,0)>0){
   const choices=triad.map(x=>x+7*Math.floor(e.degree/7)).flatMap(x=>[x-7,x,x+7]).filter(x=>x>=0&&x<=8);
   if(choices.length)out.degree=choices.reduce((a,b)=>Math.abs(b-e.degree)<Math.abs(a-e.degree)?b:a);
  }
  if(close&&i===events.length-1&&!out.rest){out.degree=0;out.cadence=true;}
  return out;
 });
}
function plan(phrases,options={}){
 if(!Array.isArray(phrases)||!phrases.length||phrases.some(p=>!Array.isArray(p)||!p.length))
  throw new TypeError('phrase bars required');
 const original=Array.isArray(options.progression)&&options.progression.length?options.progression:[0,4,5,3];
 const tension=clamp(Number(options.tension)||0,0,1);
 const chords=[],events=[],decisions=[];
 const pool=[0,1,2,3,4,5,6];
 for(let b=0;b<phrases.length;b++){
  const previous=b?chords[b-1]:null;
  const isCadence=b===phrases.length-1;
  const expected=mod(original[b%original.length]);
  const candidates=isCadence?[0]:pool;
  const graded=candidates.map(chord=>{
   const adapted=refine(phrases[b],chord,tension,isCadence);
   const fit=phraseFit(adapted,chord,tension);
   const motion=voiceLeading(chord,previous);
   // Prefer contextual progression rather than an identical chord every bar.
   const repeat=previous===chord&&b>0?.46:0;
   const home=chord===expected?.62:0;
   const cadencePrep=b===phrases.length-2&&chord===4?.38:0;
   const score=fit*1.5-motion*.19-repeat+home+cadencePrep;
   return {chord,events:adapted,score,fit,motion};
  }).sort((a,b)=>b.score-a.score||a.chord-b.chord);
  const chosen=graded[0];
  chords.push(chosen.chord);events.push(chosen.events);
  decisions.push({bar:b,chord:chosen.chord,score:chosen.score,fit:chosen.fit,previous});
 }
 return {chords,phrases:events,decisions};
}

// H2: evaluate sounding scale degrees without interpreting motif degree as chord-relative.
function h2Classify(events,chord,options={}){
 const notes=events.map((e,i)=>{
  if(e.rest)return {role:null,collision:false,chordTone:false,intentional:false};
  // H1 localScaleDegree is authoritative; legacy degree is a local-key degree,
  // never a chord-relative offset. MIDI alone cannot infer a key degree.
  const degree=e.localScaleDegree??e.degree;
  if(!Number.isInteger(degree))return {role:null,collision:false,chordTone:false,intentional:false};
  const chordTone=triad.some(d=>mod(degree)===mod(chord+d));
  if(chordTone)return {role:null,collision:false,chordTone:true,intentional:false};
  const prev=events.slice(0,i).reverse().find(n=>!n.rest);
  const next=events.slice(i+1).find(n=>!n.rest);
  const pd=prev?.localScaleDegree??prev?.degree;
  const nd=next?.localScaleDegree??next?.degree;
  const stepIn=Number.isInteger(pd)&&Math.abs(degree-pd)===1;
  const stepOut=Number.isInteger(nd)&&Math.abs(nd-degree)===1;
  const weak=(e.position%4)>=.6;
  const prevChordTone=Number.isInteger(pd)&&triad.some(d=>mod(pd)===mod(chord+d));
  const nextChordTone=Number.isInteger(nd)&&triad.some(d=>mod(nd)===mod(chord+d));
  let role=null;
  if(weak&&stepIn&&stepOut&&prevChordTone&&nextChordTone&&Math.sign(degree-pd)===Math.sign(nd-degree))role='passing';
  else if(weak&&stepIn&&stepOut&&prevChordTone&&nextChordTone&&pd===nd)role='neighbor';
  else if(!weak&&e.prepared===true&&stepOut&&nextChordTone&&nd<degree)role='suspension';
  else if(!weak&&stepOut&&nextChordTone&&e.resolves===true)role='appoggiatura';
  else if(weak&&e.nextChordDegree!=null&&mod(degree)===mod(e.nextChordDegree))role='anticipation';
  const intentional=e.intentionalDissonance===true||e.nonChordToneRole==='intentional';
  const collision=!weak&&!role&&!intentional;
  return {role,collision,chordTone:false,intentional};
 });
 return {notes,collisions:notes.filter(n=>n.collision).length};
}
function planH2(phrases,options={}){
 if(!Array.isArray(phrases)||!phrases.length||phrases.some(p=>!Array.isArray(p)||!p.length))
  throw new TypeError('phrase bars required');
 const original=Array.isArray(options.progression)&&options.progression.length?options.progression:[0,4,5,3];
 const chords=[],decisions=[];
 for(let b=0;b<phrases.length;b++){
  const expected=mod(original[b%original.length]),previous=chords[b-1]??null;
  const ranked=[0,1,2,3,4,5,6].map(chord=>{
   const diagnostic=h2Classify(phrases[b],chord);
   const fit=phrases[b].reduce((sum,e,i)=>sum+(e.rest?0:diagnostic.notes[i].chordTone?1:diagnostic.notes[i].role?.25:diagnostic.notes[i].intentional?0:-.5),0);
   const score=fit-diagnostic.collisions*1.5-voiceLeading(chord,previous)*.19+
     (chord===expected?.62:0)-(chord===previous?.46:0);
   return {chord,score,diagnostic};
  }).sort((a,b)=>b.score-a.score||a.chord-b.chord);
  chords.push(ranked[0].chord);
  decisions.push({bar:b,chord:ranked[0].chord,score:ranked[0].score,diagnostic:ranked[0].diagnostic});
 }
 return {chords,phrases:phrases.map(p=>p.map(e=>({...e}))),decisions};
}

/* H3: bounded multi-bar beam search; scale degrees stay in the global H1 frame.
 * keyOffset is a diatonic degree offset, not a MIDI semitone or a motif rewrite.
 * Modulation is restricted to phrase boundaries with preparation and confirmation.
 */
function planH3(phrases,options={}){
 if(!Array.isArray(phrases)||!phrases.length||phrases.some(p=>!Array.isArray(p)||!p.length))
  throw new TypeError('phrase bars required');
 const progression=Array.isArray(options.progression)&&options.progression.length?options.progression:[0,4,5,3];
 const width=Number.isInteger(options.beamWidth)?clamp(options.beamWidth,1,24):12;
 const original=JSON.stringify(phrases);
 const evidence=(bar,key)=>{
  const notes=phrases[bar].filter(e=>!e.rest&&Number.isInteger(e.localScaleDegree??e.degree));
  if(!notes.length)return 0;
  const target=[key,key+2,key+4].map(mod);
  return notes.reduce((s,e)=>{
   const d=mod(e.localScaleDegree??e.degree);
   return s+(target.includes(d)?1:0);
  },0)/notes.length;
 };
 let beam=[{score:0,chords:[],regions:[],diagnostics:[],key:0,phase:'home',age:0,region:0,previous:null,tension:0}];
 const beamSizes=[];
 for(let b=0;b<phrases.length;b++){
  const next=[];
  const final=b===phrases.length-1;
  const sectionBoundary=b>0&&b%4===0;
  for(const state of beam){
   const choices=[{key:state.key,phase:state.phase,region:state.region,age:state.age+1,reason:'retain'}];
   // Prepare a dominant-related key at a structural boundary; stay long enough to establish it.
   if(sectionBoundary&&state.key===0&&state.age>=3&&b+4<phrases.length&&
      evidence(b,4)>=.45&&evidence(b+1,4)>=.35){
    choices.push({key:4,phase:'transition',region:state.region+1,age:1,reason:'dominant-pivot'});
   }
   if(sectionBoundary&&state.key===4&&state.age>=4&&b+2<phrases.length&&
      evidence(b,0)>=.45){
    choices.push({key:0,phase:'return',region:state.region+1,age:1,reason:'tonic-return'});
   }
   for(const choice of choices){
    const establishing=choice.phase==='transition'||choice.phase==='return';
    const phase=establishing&&choice.age>=2?'established':choice.phase;
    for(let local=0;local<7;local++){
     const chord=mod(local+choice.key);
     const diagnostic=h2Classify(phrases[b],chord);
     const fit=phrases[b].reduce((sum,e,i)=>sum+(e.rest?0:diagnostic.notes[i].chordTone?1:
       diagnostic.notes[i].role?.25:diagnostic.notes[i].intentional?0:-.5),0);
     const previous=state.previous;
     const motion=voiceLeading(chord,previous);
     const repeat=previous===chord?.40:0;
     const expected=mod(progression[b%progression.length]);
     const cadence=final?(choice.key===0&&local===0?2.2:-2):0;
     const preparation=b%4===3&&local===4?.65:0;
     const tension=(local===4||local===6)?1:local===0?0:.5;
     const resolution=state.tension>tension?.35:0;
     const harmonicRhythm=(previous!==null&&previous!==chord?.10:0);
     const modulation=establishing&&choice.age===1?-1.1:0;
     const pitchEvidence=choice.key===0?0:evidence(b,choice.key)*.5-.20;
     const stepScore=fit-diagnostic.collisions*1.5-motion*.19-repeat+
       (chord===expected?.62:0)+cadence+preparation+resolution+harmonicRhythm+
       modulation+pitchEvidence;
     next.push({score:state.score+stepScore,chords:state.chords.concat(chord),
       regions:state.regions.concat({bar:b,regionId:choice.region,keyOffset:choice.key,
         localChordDegree:local,globalChordDegree:chord,phase,
         reason:choice.reason}),
       diagnostics:state.diagnostics.concat({bar:b,score:stepScore,fit,voiceLeading:motion,
         collisions:diagnostic.collisions,nonChord:diagnostic.notes,
         transition:choice.reason,tension}),key:choice.key,phase,
       age:choice.age,region:choice.region,previous:chord,tension});
    }
   }
  }
  // Explicit deterministic tie-break; avoid unstable equal-score ordering.
  next.sort((a,b)=>b.score-a.score||a.chords.join(',').localeCompare(b.chords.join(','))||
    a.regions.map(r=>r.keyOffset).join(',').localeCompare(b.regions.map(r=>r.keyOffset).join(',')));
  beam=next.slice(0,width);
  beamSizes.push(beam.length);
 }
 const best=beam[0];
 if(JSON.stringify(phrases)!==original)throw new Error('H3 modified source phrases');
 return {chords:best.chords,phrases:phrases.map(p=>p.map(e=>({...e}))),
  regions:best.regions,decisions:best.diagnostics,score:best.score,
  search:{beamWidth:width,beamSizes}};
}

root.PlotuneM3Harmony={plan,phraseFit,voiceLeading,planH2,h2Classify,planH3};
})(window);
