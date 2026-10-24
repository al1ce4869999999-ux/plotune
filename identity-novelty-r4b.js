/* R4b: opt-in ranked selection of existing M2 candidates; no generation/RNG. UNEXECUTED. */
(function(root){'use strict';
const VERSION='r4b.1';
function choose(choices,legacy,source,options={}){
 const fallback=reason=>({chosen:legacy,selected:false,reason,diagnostics:[],fallback:reason});
 if(!root.PlotuneIdentityNoveltyR4)return fallback('R4a evaluator unavailable');
 if(!root.PlotuneMotifSimilarityEvaluator)return fallback('R1 evaluator unavailable');
 const role=options.sectionRoleR4??'variation';
 const budget=options.identityNoveltyScoreBudget??.25;
 if(!Number.isFinite(budget)||budget<0||budget>2)return fallback('invalid quality budget');
 const origin=options.originMotifR4??source;
 const candidates=choices.filter(c=>Number.isFinite(c.score)&&c.score>=choices[0].score-budget);
 const diagnostics=[];
 for(const candidate of candidates){
  if(candidate.events.at(-1)?.cadence!==legacy.events.at(-1)?.cadence)continue;
  try{
   const evaluation=root.PlotuneIdentityNoveltyR4.assess(origin,candidate.events,{role,motifId:options.originMotifIdR4??null});
   if(!Number.isFinite(evaluation.identity)||!Number.isFinite(evaluation.novelty))continue;
   diagnostics.push({index:candidate.index,score:candidate.score,evaluation,
    distance:evaluation.identityDistance+evaluation.noveltyDistance,
    trace:{originMotifId:evaluation.motifId,role,operations:evaluation.operations,
     retained:evaluation.retained,changed:evaluation.changed,identity:evaluation.identity,novelty:evaluation.novelty,
     r1:evaluation.r1,r3:options.r3AssessmentR4??null}});
  }catch(_error){/* malformed candidate is never selected */}
 }
 if(!diagnostics.length)return fallback('no measurable eligible candidate');
 const eligible=diagnostics.filter(x=>x.evaluation.withinTarget);
 if(!eligible.length)return { ...fallback('no candidate inside identity and novelty bands'),diagnostics };
 // Satisfy both independent bands before distance and quality ordering.
 eligible.sort((a,b)=>b.score-a.score||a.index-b.index);
 const decision=choices.find(c=>c.index===eligible[0].index);
 return {chosen:decision,selected:decision.index!==legacy.index,reason:'eligible identity and novelty bands, best retained quality',
  diagnostics,trace:eligible[0].trace,fallback:null};
}
root.PlotuneIdentityNoveltyR4b={VERSION,choose};
})(typeof window!=='undefined'?window:globalThis);
