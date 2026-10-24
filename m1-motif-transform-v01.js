/* M1-2: pure, bounded, independently selectable motif transformations. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function transform(motif,kind,options={}){
 if(!motif||!Array.isArray(motif.events)||!motif.events.length)throw new TypeError('motif events required');
 const events=motif.events.map(e=>({...e}));
 const sounded=events.filter(e=>!e.rest);
 const anchor=sounded[0]?.degree??0;
 const factor=options.factor===undefined?2:Number(options.factor);
 switch(kind){
  case 'inversion':for(const e of sounded)e.degree=clamp(anchor-(e.degree-anchor),0,8);break;
  case 'augmentation':
  case 'diminution':{
   const scale=kind==='augmentation'?factor:1/factor;
   if(!Number.isFinite(scale)||scale<=0)throw new RangeError('positive factor required');
   for(const e of events){e.position=+(e.position*scale).toFixed(4);e.durationUnits=+(e.durationUnits*scale).toFixed(4);}
   break;
  }
  case 'transposition':{
   const steps=Number(options.steps??1);
   if(!Number.isInteger(steps))throw new RangeError('integer steps required');
   for(const e of sounded)e.degree=clamp(e.degree+steps,0,8);
   break;
  }
  case 'fragmentation':{
   const length=Number(options.length??Math.ceil(events.length/2));
   if(!Number.isInteger(length)||length<1)throw new RangeError('positive integer length required');
   events.splice(Math.min(length,events.length));
   break;
  }
  case 'rhythmic-shift':{
   const delta=Number(options.offset??0.5);
   if(!Number.isFinite(delta)||delta<0)throw new RangeError('nonnegative offset required');
   for(const e of events)e.position=+(e.position+delta).toFixed(4);
   break;
  }
  default:throw new RangeError('unknown transformation: '+kind);
 }
 return {motifId:motif.motifId,sourceMotifId:motif.motifId,transform:kind,
  events,variationHistory:[...(motif.variationHistory||[]),{kind,options:{...options}}]};
}
root.PlotuneMotifTransform={transform};
})(window);
