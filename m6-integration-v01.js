/* M6 integration: conservative, optional score-level repair. */
(function(root){'use strict';
const clone=n=>({...n});
function apply(original,{seed=1,quality=root.PlotuneM6Quality}={}){
 if(!quality||!original||!Array.isArray(original.notes))throw new TypeError('M6 score/quality required');
 const meter=240/original.bpm; // seconds per 4-beat bar
 const duration=original.duration;
 if(!Number.isFinite(meter)||meter<=0)throw new TypeError('M6 invalid meter');
 let notes=original.notes.map(clone);
 const initial=quality.assess({notes,meter,duration});
 const attempts=[];
 const pc=n=>((n%12)+12)%12;
 for(const issue of initial.issues){
  if(!['repetition','voiceCollision'].includes(issue.metric))continue;
  const candidate=quality.repair({notes,meter,duration,issue,seed});
  let accepted=candidate.accepted;
  let reason=candidate.reason;
  if(accepted&&(!Array.isArray(candidate.notes)||candidate.notes.length!==notes.length)){
   accepted=false;reason='candidate note count changed';
  }
  if(accepted){
   const changes=[];
   for(let i=0;i<notes.length;i++){
    if(JSON.stringify(notes[i])!==JSON.stringify(candidate.notes[i]))changes.push(i);
   }
   // Never alter rhythm, volume, register boundaries, or motif-bearing lead notes.
   // Only allow changed counter pitches that remain chord tones; lead repetition repair
   // is diagnostics-only until a motif-safe pitch validator is available.
   if(issue.metric!=='voiceCollision') {accepted=false;reason='lead motif identity is not proven safe';}
   if(accepted&&changes.some(i=>notes[i].t<issue.bar*meter||notes[i].t>=(issue.bar+1)*meter)){
    accepted=false;reason='candidate modified another bar';
   }
   for(const i of changes){
    const before=notes[i],after=candidate.notes[i];
    if(before.t<issue.bar*meter||before.t>=(issue.bar+1)*meter){accepted=false;reason='candidate modified another bar';break;}
    const chordPitches=notes.filter(n=>n.voice==='chords'&&n.t<=before.t&&n.t+n.d>before.t).map(n=>pc(n.midi));
    if(before.voice!=='counter'||after.voice!=='counter'||after.t!==before.t||
       after.d!==before.d||after.volume!==before.volume||
       !Number.isInteger(after.midi)||after.midi<48||after.midi>84||
       !chordPitches.includes(pc(after.midi))){
       accepted=false;reason='candidate violates voice/rhythm/register/chord guard';break;
    }
   }
   if(!changes.length){accepted=false;reason='empty candidate';}
  }
  attempts.push({bar:issue.bar,metric:issue.metric,accepted,reason});
  if(accepted)notes=candidate.notes.map(clone);
 }
 const result={...original,notes};
 return {score:result,report:{enabled:true,initial,final:quality.assess({notes,meter,duration}),attempts,
  accepted:attempts.filter(a=>a.accepted).length}};
}
root.PlotuneM6Integration={apply};
})(typeof window!=='undefined'?window:globalThis);
