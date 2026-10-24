/* Phase 5: conservative section-local candidate acceptance.
 * A candidate is accepted only if an explicit objective cost falls and
 * events outside the designated time span are byte-identical.
 * No claim of improved listening quality is made.
 */
(function(root){
'use strict';
const stable=x=>JSON.stringify(x);
function reviseSection(score,candidate,{start,end,cost}={}){
 if(!score||!Array.isArray(score.notes)||!candidate||!Array.isArray(candidate.notes))
  throw new TypeError('Scores with note arrays required');
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||
   !Number.isFinite(score.duration)||end>score.duration||typeof cost!=='function')
  throw new TypeError('Valid section boundary and cost function required');
 const inSection=n=>Number.isFinite(n.t)&&n.t>=start&&n.t<end;
 const oldOutside=score.notes.filter(n=>!inSection(n));
 const newOutside=candidate.notes.filter(n=>!inSection(n));
 if(stable(oldOutside)!==stable(newOutside))
  return {accepted:false,reason:'OUTSIDE_SECTION_CHANGED',score};
 if(score.duration!==candidate.duration||score.bpm!==candidate.bpm||
   stable(score.drums||[])!==stable(candidate.drums||[]))
  return {accepted:false,reason:'GLOBAL_SCORE_CHANGED',score};
 const before=cost(score.notes.filter(inSection));
 const after=cost(candidate.notes.filter(inSection));
 if(!Number.isFinite(before)||!Number.isFinite(after))
  return {accepted:false,reason:'INVALID_COST',score};
 if(after>=before)return {accepted:false,reason:'NO_OBJECTIVE_IMPROVEMENT',before,after,score};
 const replacement=candidate.notes.filter(inSection).map(n=>({...n}));
 const notes=score.notes.filter(n=>!inSection(n)).map(n=>({...n})).concat(replacement)
  .sort((a,b)=>a.t-b.t);
 return {accepted:true,reason:'OBJECTIVE_IMPROVED',before,after,
  score:{...score,notes}};
}
const api={reviseSection};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.PlotunePhase5Revision=api;
})(typeof globalThis!=='undefined'?globalThis:this);
