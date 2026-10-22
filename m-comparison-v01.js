/* M0-2: comparison-condition contract; no renderer or UI changes. */
(function(root){
'use strict';
const FIELDS=['seed','characterSeed','genre','mode','bpm','duration','root','progression'];
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function conditions(plan){
 if(!plan||!Number.isInteger(plan.seed)||!Number.isInteger(plan.characterSeed))throw new TypeError('Comparison requires integer seeds');
 const out={};
 for(const key of FIELDS)out[key]=key==='progression'?Array.isArray(plan[key])?[...plan[key]]:null:plan[key]??null;
 return out;
}
function compare(base,candidate){
 const a=conditions(base),b=conditions(candidate);
 const changed=FIELDS.filter(key=>!same(a[key],b[key]));
 return {compatible:changed.length===0,changed,baseline:a,candidate:b};
}
function modes(plan){
 const base={...plan,emotionComposition:false};
 delete base.musicDevelopment;
 return {
  baseline:base,
  phaseOnly:{...base,emotionComposition:true},
  mOnly:{...base,musicDevelopment:true},
  combined:{...base,emotionComposition:true,musicDevelopment:true}
 };
}
root.PlotuneMComparison={conditions,compare,modes,FIELDS:[...FIELDS]};
})(window);
