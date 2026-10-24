/* R8: bounded, deterministic transition edits. No random state or added notes. */
(function(root){'use strict';
const VERSION='r8.0';
function optimize(input){
 const {notes,duration,bpm,wholeTrackArc}=input||{};
 const diagnostic=root.PlotuneTransitionR7?.evaluate({notes,duration,bpm,wholeTrackArc});
 const trace={version:VERSION,status:'fallback',reason:'NO_ELIGIBLE_BOUNDARY',strategies:[],diagnosticStatus:diagnostic?.status||'unavailable'};
 if(!Array.isArray(notes)||diagnostic?.status!=='ok')return {notes,trace:{...trace,reason:'R7_UNAVAILABLE'}};
 const output=notes.map(n=>({...n}));let changed=0;
 for(const boundary of diagnostic.transitions){
  const {time:t,plan}=boundary;
  if(plan.continuityTarget==='contrast'){
   trace.strategies.push({time:t,strategy:'HARD_CUT',changed:0,reason:'preserve intended contrast'});
   continue;
  }
  const beat=60/bpm,window=Math.min(beat*2,.5);
  const candidates=[];
  // CADENCE_BREATH: shorten a non-lead note that crosses the boundary; never add events.
  for(let i=0;i<output.length;i++){
   const n=output[i];if(!Number.isFinite(n.t)||!Number.isFinite(n.d)||n.d<=0)continue;
   if(n.voice==='lead'||n.t>=t||n.t+n.d<=t||n.t<t-window)continue;
   const d=Math.max(beat/8,t-n.t-beat/8);
   if(d<n.d-.00001)candidates.push({i,d,strategy:'CADENCE_BREATH',cost:Math.abs(n.d-d)});
  }
  // Select least intrusive candidate; preserve motif and harmony pitches.
  candidates.sort((a,b)=>a.cost-b.cost||a.i-b.i);
  const selected=candidates[0];
  if(selected){output[selected.i].d=selected.d;changed++;
   trace.strategies.push({time:t,strategy:selected.strategy,changed:1,index:selected.i,reason:'bounded release before smooth boundary'});
  }else trace.strategies.push({time:t,strategy:'UNCHANGED',changed:0,reason:'no safe local edit'});
 }
 trace.status=changed?'selected':'unchanged';trace.changedNotes=changed;
 return {notes:changed?output:notes,trace};
}
root.PlotuneTransitionR8={VERSION,optimize};
})(typeof window!=='undefined'?window:globalThis);
