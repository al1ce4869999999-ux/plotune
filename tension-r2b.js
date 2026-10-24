/* R2b shadow assessment: score existing M2/M3 candidate options without selecting or altering them. */
(function(root){'use strict';
const COMPONENTS=['tonal','expectancy','rhythmic','density','timbral','dynamic'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=n=>Math.max(0,Math.min(1,n));
const round=n=>Math.round(n*1e6)/1e6;
function assess(metrics,target){
 if(!metrics||typeof metrics!=='object'||!target||typeof target!=='object')throw new TypeError('metrics and target required');
 let weighted=0,count=0;
 const components={};
 for(const key of COMPONENTS){
  const actual=metrics[key],desired=target[key];
  if(desired!==null&&desired!==undefined&&(!finite(desired)||desired<0||desired>1))throw new RangeError('invalid target '+key);
  if(actual!==undefined&&actual!==null&&(!finite(actual)||actual<0||actual>1))throw new RangeError('invalid measurement '+key);
  if(finite(desired)&&finite(actual)){
   const distance=round(Math.abs(desired-actual));
   components[key]={status:'measured',actual,desired,distance};weighted+=distance;count++;
  }else components[key]={status:'unknown',actual:finite(actual)?actual:null,desired:finite(desired)?desired:null};
 }
 return {version:'r2b.shadow.1',mode:'shadow-only',distance:count?round(weighted/count):null,measuredCount:count,components,
  diagnostics:[{code:'NO_SELECTION',message:'Shadow candidate assessment only; R4 owns candidate selection'},
   {code:'UNCALIBRATED',message:'R2a symbolic proxies have not been perceptually calibrated'}]};
}
function fromPhrase(events){
 if(!Array.isArray(events))throw new TypeError('phrase events required');
 let t=0;
 const notes=events.map(e=>{if(!e||!finite(e.position)||!finite(e.durationUnits)||!finite(e.degree))throw new RangeError('invalid phrase event');
 return {t:e.position,d:e.durationUnits,midi:e.degree,rest:!!e.rest};});
 if(!root.PlotuneTensionR2a)throw new Error('R2a evaluator missing');
 return root.PlotuneTensionR2a.evaluate({notes}).metrics;
}
function fromHarmony(phrases){
 if(!Array.isArray(phrases))throw new TypeError('phrases required');
 const notes=[];
 for(let b=0;b<phrases.length;b++){
  if(!Array.isArray(phrases[b]))throw new TypeError('phrase bar required');
  for(const e of phrases[b]){if(!e||!finite(e.position)||!finite(e.durationUnits)||!finite(e.degree))throw new RangeError('invalid harmony event');
   notes.push({t:b*16+e.position,d:e.durationUnits,midi:e.degree,rest:!!e.rest});}
 }
 if(!root.PlotuneTensionR2a)throw new Error('R2a evaluator missing');
 return root.PlotuneTensionR2a.evaluate({notes}).metrics;
}
function phrase(events,target){return assess(fromPhrase(events),target);}
function harmony(phrases,target){return assess(fromHarmony(phrases),target);}
root.PlotuneTensionR2b={VERSION:'r2b.shadow.1',assess,phrase,harmony};
})(typeof window!=='undefined'?window:globalThis);
