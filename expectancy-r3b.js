/* R3b: opt-in quality-constrained expectancy selector, independent of R2 and R4. */
(function(root){'use strict';
const VERSION='r3b.1';
function choose(choices,base,source,options={}){
 const fallback=reason=>({chosen:base,selected:false,reason,diagnostics:[]});
 if(!root.PlotuneExpectancyR3)return fallback('expectancy evaluator unavailable');
 const target=options.expectancyTarget;
 if(!target||typeof target!=='object')return fallback('expectancy target absent');
 const values=Array.isArray(target.trajectory)?target.trajectory:null;
 const bits=target.targetBits;
 if((!values&&!Number.isFinite(bits))||(values&&(!values.length||values.some(n=>!Number.isFinite(n)||n<0||n>24)))||
  (bits!==undefined&&(!Number.isFinite(bits)||bits<0||bits>24)))return fallback('invalid target');
 const budget=options.expectancyScoreBudget??.25;
 if(!Number.isFinite(budget)||budget<0||budget>2)return fallback('invalid quality budget');
 const eligible=choices.filter(x=>x.score>=choices[0].score-budget);
 const cadence=base.events[base.events.length-1];
 let model;
 try{model=options.expectancyModel??root.PlotuneExpectancyR3.train([source,source,source],
  {source:'current phrase repeated as local prior',style:'local-adaptive',training:'in-memory-current-phrase'});}
 catch(error){return fallback('model unavailable');}
 const diagnostics=[];
 for(const c of eligible){
  const ending=c.events[c.events.length-1];
  if(!!ending.cadence!==!!cadence.cadence)continue;
  try{
   const evalResult=root.PlotuneExpectancyR3.evaluate(c.events,{}, {model});
   const actual=evalResult.surpriseTrajectory;
   if(!actual.length||actual.some(v=>!Number.isFinite(v)))continue;
   const targetAt=i=>values?values[Math.min(values.length-1,Math.floor(i*values.length/actual.length))]:bits;
   const distance=actual.reduce((total,value,i)=>total+Math.abs(value-targetAt(i)),0)/actual.length;
   if(!Number.isFinite(distance))continue;
   diagnostics.push({index:c.index,score:c.score,meanIC:evalResult.metrics.meanIC,
    predictiveEntropy:evalResult.metrics.meanEntropy,distance,
    surpriseTrajectory:actual,reason:'distance to explicit expectancy goal',modelVersion:model.version});
  }catch(error){ /* bad assessment cannot affect the original choice */ }
 }
 if(!diagnostics.length)return fallback('no eligible finite candidates');
 diagnostics.sort((a,b)=>a.distance-b.distance||b.score-a.score||a.index-b.index);
 const match=choices.find(c=>c.index===diagnostics[0].index);
 return {chosen:match,selected:match.index!==base.index,reason:match.index===base.index?
  'legacy candidate best matches expectancy target':'expectancy distance within legacy-quality band',
  diagnostics,model:{version:model.version,metadata:model.metadata}};
}
root.PlotuneExpectancyR3b={VERSION,choose};
})(typeof window!=='undefined'?window:globalThis);
