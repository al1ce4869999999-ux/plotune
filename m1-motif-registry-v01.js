/* M1-1: immutable motif capture and section reference resolution. */
(function(root){
'use strict';
function register(motifId,events,context={}){
 if(typeof motifId!=='string'||!motifId.trim())throw new TypeError('motifId required');
 if(!Array.isArray(events)||!events.length)throw new TypeError('nonempty motif events required');
 const ordered=events.map((event,i)=>{
  const position=Number(event.position),duration=Number(event.durationUnits),degree=Number(event.degree);
  if(!Number.isFinite(position)||position<0||!Number.isFinite(duration)||duration<=0||
     !Number.isInteger(degree))throw new RangeError('invalid motif event '+i);
  return {position,durationUnits:duration,degree,rest:event.rest===true,accent:event.accent===true};
 });
 for(let i=1;i<ordered.length;i++)
  if(ordered[i].position<ordered[i-1].position)throw new RangeError('motif events out of order');
 const sounded=ordered.filter(e=>!e.rest);
 const pitchIntervals=sounded.slice(1).map((e,i)=>e.degree-sounded[i].degree);
 const rhythmPattern=ordered.map(e=>({offset:e.position,durationUnits:e.durationUnits,rest:e.rest}));
 return Object.freeze({
  motifId,pitchIntervals:Object.freeze(pitchIntervals),
  rhythmPattern:Object.freeze(rhythmPattern.map(e=>Object.freeze(e))),
  accents:Object.freeze(ordered.map(e=>e.accent)),
  harmonicContext:context.harmonicContext??null,
  expressiveRole:context.expressiveRole??null,
  variationHistory:Object.freeze([]),
  events:Object.freeze(ordered.map(e=>Object.freeze(e)))
 });
}
function references(section,motifs){
 if(!section||!Array.isArray(section.motifReferences))return [];
 return section.motifReferences.map(ref=>{
  const id=typeof ref==='string'?ref:ref?.motifId;
  if(typeof id!=='string'||!Object.hasOwn(motifs,id))throw new RangeError('missing motif reference: '+String(id));
  return motifs[id];
 });
}
root.PlotuneMotifRegistry={register,references};
})(window);
