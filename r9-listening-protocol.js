/* R9 blinded listening evaluation protocol. No audio mutation and no ambient RNG. */
(function(root){
'use strict';
const CONDITIONS=['baseline','phase','m','phase+m'];
const DIMENSIONS=['difference','preference','naturalness','emotionalComplexity','motifRecognition','variationFreshness','melodyClarity','boundaryConviction','wholeTrackCoherence','relistenInterest'];
const RATINGS=DIMENSIONS.filter(x=>x!=='difference'&&x!=='preference');
function hash32(value){
 let h=2166136261;
 for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
 return h>>>0;
}
function makeManifest({seeds=[42,0,4294967295],durations=[15,30,60],conditions=CONDITIONS}={}){
 if(!Array.isArray(seeds)||!seeds.length||!Array.isArray(durations)||!durations.length||!Array.isArray(conditions)||!conditions.length)throw Error('nonempty experiment axes required');
 if(seeds.some(s=>!Number.isInteger(s)||s<0||s>4294967295)||durations.some(d=>!Number.isInteger(d)||d<=0)||new Set(conditions).size!==conditions.length||conditions.some(c=>!CONDITIONS.includes(c)))throw Error('invalid experiment axis');
 const pairs=[];
 for(const seed of seeds)for(const duration of durations)for(const conditionId of conditions){
  const key=seed+':'+duration+':'+conditionId,swap=(hash32('r9-order:'+key)&1)===1;
  pairs.push({id:'r9-'+seed+'-'+duration+'-'+conditionId,seed,duration,conditionId,
    items:swap?[{slot:'A',researchEnabled:true},{slot:'B',researchEnabled:false}]:
               [{slot:'A',researchEnabled:false},{slot:'B',researchEnabled:true}]});
 }
 return {schema:'plotune.r9.listening-manifest',version:1,blind:true,renderProfile:'identical-for-pair',pairs};
}
function validateRating(r){
 if(!r||!['A','B','tie'].includes(r.preference)||typeof r.difference!=='boolean')return false;
 return RATINGS.every(k=>Array.isArray(r[k])&&r[k].length===2&&r[k].every(v=>Number.isInteger(v)&&v>=1&&v<=5));
}
function validateSubmission(manifest,submission){
 if(!manifest||manifest.schema!=='plotune.r9.listening-manifest'||!submission||!Array.isArray(submission.responses))return false;
 const ids=new Set(manifest.pairs.map(p=>p.id)),seen=new Set();
 for(const response of submission.responses){
  if(!ids.has(response.pairId)||seen.has(response.pairId)||!validateRating(response))return false;
  seen.add(response.pairId);
 }
 return seen.size===ids.size;
}
root.PlotuneR9Listening=Object.freeze({CONDITIONS,DIMENSIONS,makeManifest,validateRating,validateSubmission});
})(typeof window!=='undefined'?window:globalThis);
