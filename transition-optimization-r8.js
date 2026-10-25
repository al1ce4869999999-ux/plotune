/* R8: deterministic boundary-local realization of Phase 4 intentions. */
(function(root){'use strict';
const VERSION='r8.1',STRATEGIES=['COMMON_TONE','MOTIF_PREVIEW','RHYTHMIC_BRIDGE','BASS_LEAD','TEXTURE_DOVETAIL','CADENCE_BREATH','SUSPENSION','HARD_CUT'];
const finite=n=>Number.isFinite(n), round=x=>Math.round(x*1e6)/1e6;
function optimize(input){
 const {notes,duration,bpm,wholeTrackArc,transitionPlans=[]}=input||{};
 const diagnostic=root.PlotuneTransitionR7?.evaluate({notes,duration,bpm,wholeTrackArc});
 const trace={version:VERSION,status:'fallback',reason:'NO_ELIGIBLE_BOUNDARY',strategies:[],diagnosticStatus:diagnostic?.status||'unavailable'};
 if(!Array.isArray(notes)||diagnostic?.status!=='ok'||!finite(bpm)||bpm<=0)
  return {notes,trace:{...trace,reason:'R7_UNAVAILABLE'}};
 const result=notes.map(n=>({...n})),beat=60/bpm;
 let changed=0;
 const valid=n=>finite(n.t)&&finite(n.d)&&n.d>0&&finite(n.midi);
 for(const boundary of diagnostic.transitions){
  const t=boundary.time,original=boundary.plan;
  const explicit=Array.isArray(transitionPlans)?transitionPlans.find(p=>p&&Math.abs(p.time-t)<.00001):null;
  const plan={...original,...(explicit||{})};
  // A strong contrast is an intentional boundary; do not blur it, even under an override.
  if(original.continuityTarget==='contrast'||plan.continuityTarget==='contrast'||plan.strategy==='HARD_CUT'){
   trace.strategies.push({time:t,strategy:'HARD_CUT',changed:0,candidates:[],reason:'intentional contrast retained'});continue;
  }
  const left=result.map((n,i)=>({n,i})).filter(x=>valid(x.n)&&x.n.t<t&&x.n.t+x.n.d>t-2*beat&&x.n.t>=t-4*beat);
  const right=result.map((n,i)=>({n,i})).filter(x=>valid(x.n)&&x.n.t>=t&&x.n.t<t+2*beat);
  const candidates=[];
  const add=(strategy,x,patch,reason,penalty)=>{
   if(!x||!patch||!STRATEGIES.includes(strategy))return;
   const after={...x.n,...patch};
   if(!(after.d>=.035&&after.t>=0&&after.t+after.d<=duration+.000001&&after.t<t+2*beat))return;
   if(after.t===x.n.t&&after.d===x.n.d&&after.midi===x.n.midi)return;
   // Protect a voice from accidental new simultaneous overlaps and cross-boundary collisions.
   if(result.some((other,j)=>j!==x.i&&other.voice===after.voice&&valid(other)&&
      Math.max(after.t,other.t)<Math.min(after.t+after.d,other.t+other.d)-.001 &&
      !(Math.max(x.n.t,other.t)<Math.min(x.n.t+x.n.d,other.t+other.d)-.001)))return;
   candidates.push({strategy,index:x.i,patch,reason,penalty});
  };
  const last=role=>left.filter(x=>!role||role.includes(x.n.voice)).sort((a,b)=>(b.n.t+b.n.d)-(a.n.t+a.n.d))[0];
  const first=role=>right.filter(x=>!role||role.includes(x.n.voice)).sort((a,b)=>a.n.t-b.n.t)[0];
  const nonlead=last(['bass','pad','arp','counter','chords','sparkle']);
  // COMMON_TONE: preserve a stable pitch class from the following harmony in a sustained support voice.
  const bass=last(['bass','pad']),future=first(['bass','pad','chords']);
  if(bass&&future&&Math.abs(bass.n.midi-future.n.midi)<=12){
   const semitone=((future.n.midi-bass.n.midi)%12+12)%12;
   const move=semitone>6?semitone-12:semitone;
   if(move&&Math.abs(move)<=2)add('COMMON_TONE',bass,{midi:bass.n.midi+move},'shared pitch class at boundary',.32+Math.abs(move)*.08);
  }
  // MOTIF_PREVIEW: adapt existing counter voice to the upcoming lead pitch class; never duplicate the lead.
  const counter=last(['counter','sparkle']),nextLead=first(['lead']);
  if(counter&&nextLead){
   const diff=((nextLead.n.midi-counter.n.midi)%12+12)%12,move=diff>6?diff-12:diff;
   if(move&&Math.abs(move)<=3)add('MOTIF_PREVIEW',counter,{midi:counter.n.midi+move},'counter voice anticipates melodic pitch class',.58+Math.abs(move)*.05);
  }
  // RHYTHMIC_BRIDGE: shift an existing accompaniment onset toward the next subdivision.
  const arp=last(['arp','sparkle','counter','bass']);
  if(arp){const target=t-beat/2,delta=target-arp.n.t;
   if(Math.abs(delta)>.005&&Math.abs(delta)<=beat)
    add('RHYTHMIC_BRIDGE',arp,{t:round(target),d:round(Math.min(arp.n.d,Math.max(.04,t-target-beat/16)))},'existing onset bridges pulse',.43);
  }
  // BASS_LEAD: the bass approaches the following bass pitch with a small diatonic-sized step.
  const oldBass=last(['bass']),newBass=first(['bass']);
  if(oldBass&&newBass){const diff=newBass.n.midi-oldBass.n.midi,move=Math.sign(diff)*Math.min(2,Math.abs(diff));
   if(move)add('BASS_LEAD',oldBass,{midi:oldBass.n.midi+move},'bass approaches next section',.45+Math.abs(move)*.04);
  }
  // TEXTURE_DOVETAIL: extend a pad into the next section only when the voice has room.
  const pad=last(['pad','chords','counter']),padNext=pad?first([pad.n.voice]):null;
  if(pad&&!padNext&&pad.n.t+pad.n.d<t+beat/4){
   const end=Math.min(duration,t+beat/4),d=round(end-pad.n.t);
   if(d>pad.n.d&&d-pad.n.d<=beat)add('TEXTURE_DOVETAIL',pad,{d},'support texture handed across boundary',.52);
  }
  // CADENCE_BREATH: small phrase-end release, with an actual pre-boundary note fallback.
  const cadence=nonlead||last();
  if(cadence){
   const end=cadence.n.t+cadence.n.d;
   const trim=Math.min(beat/6,cadence.n.d*.20);
   if(end>t-beat&&end<=t+2*beat&&cadence.n.d-trim>=.035)
    add('CADENCE_BREATH',cadence,{d:round(cadence.n.d-trim)},'local release before smooth section',.25);
  }
  // SUSPENSION: hold an existing support note into the following beat where no same voice enters.
  // Try all eligible support voices: the latest note is often blocked by a
  // following onset while another voice can safely sustain through the boundary.
  for(const holding of left.filter(x=>['pad','chords','bass','counter'].includes(x.n.voice))){
   const end=holding.n.t+holding.n.d;
   if(end<t-beat/2||end>t+beat/3)continue;
   const target=Math.max(end+beat/8,t+beat/6);
   const d=round(target-holding.n.t);
   if(d>holding.n.d&&d-holding.n.d<=beat/2)
    add('SUSPENSION',holding,{d},'support voice sustains across section entry',.59);
  }
  const preferred=STRATEGIES.includes(plan.strategy)?plan.strategy:null;
  const scored=candidates.map(c=>({...c,score:c.penalty+
   (preferred?(c.strategy===preferred?-2:2):0)+
   (plan.closureStrength>.65&&c.strategy==='CADENCE_BREATH'?-0.15:0)}));
  scored.sort((a,b)=>a.score-b.score||STRATEGIES.indexOf(a.strategy)-STRATEGIES.indexOf(b.strategy)||a.index-b.index);
  const winner=scored[0];
  if(winner){
   Object.assign(result[winner.index],winner.patch);changed++;
   trace.strategies.push({time:t,strategy:winner.strategy,changed:1,index:winner.index,
    candidates:scored.map(c=>({strategy:c.strategy,score:round(c.score)})),reason:winner.reason});
  }else trace.strategies.push({time:t,strategy:'UNCHANGED',changed:0,candidates:[],reason:'no safe local candidate'});
 }
 trace.status=changed?'selected':'unchanged';trace.changedNotes=changed;
 return {notes:changed?result:notes,trace};
}
root.PlotuneTransitionR8={VERSION,STRATEGIES,optimize};
})(typeof window!=='undefined'?window:globalThis);
