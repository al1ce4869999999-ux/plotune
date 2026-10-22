/* M1-1: immutable motif registry; independent of legacy phrase generation. */
(function(root){
'use strict';
const clone=value=>JSON.parse(JSON.stringify(value));
function register(id,events,context={}){
 if(typeof id!=='string'||!id.trim())throw new TypeError('motifId required');
 if(!Array.isArray(events)||!events.length)throw new TypeError('nonempty motif events required');
 const normalized=events.map((n,i)=>{
  const degree=Number(n.degree),position=Number(n.position),durationUnits=Number(n.durationUnits);
  if(!Number.isFinite(degree)||!Number.isFinite(position)||!Number.isFinite(durationUnits)||position<0||durationUnits<=0)
   throw new RangeError('invalid motif event '+i);
  return {degree,position,durationUnits,rest:n.rest===true,accent:n.accent===true};
 });
 for(let i=1;i<normalized.length;i++)if(normalized[i].position<normalized[i-1].position)
  throw new RangeError('motif events must be ordered');
 return {
  motifId:id,pitchIntervals:normalized.slice(1).map((event,i)=>event.degree-normalized[i].degree),
  rhythmPattern:normalized.map(n=>({position:n.position,durationUnits:n.durationUnits,rest:n.rest})),
  accents:normalized.map(n=>n.accent),harmonicContext:clone(context),
  events:normalized,variationHistory:[]
 };
}
function recall(motif,sectionId){
 if(!motif||!Array.isArray(motif.events))throw new TypeError('registered motif required');
 return {...clone(motif),variationHistory:[...clone(motif.variationHistory||[]),
  {sectionId:String(sectionId),operation:'recall',reason:'section motif reference'}]};
}
function transpose(motif,semitones,sectionId){
 if(!Number.isInteger(semitones))throw new TypeError('integer transposition required');
 const next=recall(motif,sectionId);
 next.events=next.events.map(n=>({...n,degree:n.degree+semitones}));
 next.variationHistory[next.variationHistory.length-1]={sectionId:String(sectionId),operation:'transpose',
  amount:semitones,reason:'motif variation'};
 return next;
}
root.PlotuneMotifMemory={register,recall,transpose};
})(window);
