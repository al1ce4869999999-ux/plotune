/* M7 repeated-trial aggregation. Descriptive only; never infer improvement from missing ratings. */
(function(root){'use strict';
const IDS=['baseline','phase','m','phase-m'];
const KEYS=['motif','development','emotion','coherence','preference'];
function aggregate(trials){
 if(!Array.isArray(trials)||!trials.length)throw new TypeError('nonempty trials required');
 const seen=new Set(),rows=[];
 for(const t of trials){
  const record=t?.evaluation,diagnostics=t?.diagnostics;
  if(record?.schema!=='plotune.m7.listening.v1'||diagnostics?.schema!=='plotune.m7.diagnostics.v1'||
     record.seed!==diagnostics.seed||!IDS.every(id=>record.ratings?.[id]&&diagnostics.metrics?.[id]))
   throw new TypeError('matched listening and objective records required');
  const trialId=String(t.trialId??record.seed);
  if(!trialId.trim())throw new RangeError('trial identifier required');
  if(seen.has(trialId))throw new RangeError('duplicate trial identifier');
  seen.add(trialId);
  rows.push({trialId,seed:record.seed,ratings:record.ratings,metrics:diagnostics.metrics});
 }
 const summary=Object.fromEntries(IDS.map(id=>[id,Object.fromEntries(KEYS.map(key=>{
  const values=rows.map(row=>row.ratings[id][key]).filter(v=>Number.isInteger(v)&&v>=1&&v<=5);
  return [key,{count:values.length,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null}];
 }))]));
 // A disagreement is observable only for paired and non-null comparisons.
 const disagreements=[];
 for(const row of rows)for(const id of IDS.filter(x=>x!=='baseline')){
  const a=row.ratings.baseline.preference,b=row.ratings[id].preference;
  const x=row.metrics.baseline.noteCount,y=row.metrics[id].noteCount;
  if(Number.isInteger(a)&&a>=1&&a<=5&&Number.isInteger(b)&&b>=1&&b<=5&&Number.isFinite(x)&&Number.isFinite(y)){
   const preference=Math.sign(b-a),count=Math.sign(y-x);
   if(preference&&count&&preference!==count)
    disagreements.push({trialId:row.trialId,conditionId:id,preferenceDelta:b-a,noteCountDelta:y-x,
     caveat:'Note count is descriptive, not a musical quality metric'});
  }
 }
 return {schema:'plotune.m7.aggregate.v1',trialCount:rows.length,summary,disagreements,
  caveat:'No rating means no subjective conclusion; descriptive metrics do not measure musical quality'};
}
root.PlotuneM7Aggregate={IDS,KEYS,aggregate};
})(typeof window!=='undefined'?window:globalThis);
