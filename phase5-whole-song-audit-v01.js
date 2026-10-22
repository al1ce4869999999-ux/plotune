/* Phase 5: deterministic, read-only whole-song structure audit.
 * Score-facing adapter must explicitly supply section boundaries and note events.
 * This module never mutates the plan or rendered score.
 */
(function(root){
'use strict';
function audit(plan, rendered) {
  if (!plan || !Array.isArray(plan.sections) || !Array.isArray(rendered)) {
    throw new TypeError('Expected plan.sections and rendered section array');
  }
  const findings=[], metrics=[];
  const ids=new Set();
  plan.sections.forEach((section,index)=>{
    const id=String(section.id ?? index);
    if(ids.has(id)) findings.push({code:'DUPLICATE_SECTION_ID',sectionId:id,severity:'error'});
    ids.add(id);
    const actual=rendered.find(s=>String(s.id ?? rendered.indexOf(s))===id);
    if(!actual) {
      findings.push({code:'MISSING_SECTION',sectionId:id,severity:'error'});
      return;
    }
    const plannedBars=Number(section.bars ?? section.durationBars);
    const actualBars=Number(actual.bars ?? actual.durationBars);
    if(Number.isFinite(plannedBars)&&Number.isFinite(actualBars)&&plannedBars!==actualBars) {
      findings.push({code:'SECTION_LENGTH_MISMATCH',sectionId:id,severity:'error',planned:plannedBars,actual:actualBars});
    }
    const notes=Array.isArray(actual.notes)?actual.notes:[];
    const pitched=notes.filter(n=>Number.isFinite(n.pitch));
    const averagePitch=pitched.length?pitched.reduce((v,n)=>v+n.pitch,0)/pitched.length:null;
    const density=Number.isFinite(actualBars)&&actualBars>0?notes.length/actualBars:null;
    metrics.push({sectionId:id,noteCount:notes.length,density,averagePitch});
    if(Number.isFinite(section.targetDensity)&&density!==null&&Math.abs(density-section.targetDensity)>Math.max(1,section.targetDensity*.35)){
      findings.push({code:'DENSITY_TARGET_MISMATCH',sectionId:id,severity:'warning',planned:section.targetDensity,actual:density});
    }
  });
  rendered.forEach((s,index)=>{
    const id=String(s.id ?? index);
    if(!ids.has(id))findings.push({code:'UNPLANNED_SECTION',sectionId:id,severity:'warning'});
  });
  return {ok:!findings.some(f=>f.severity==='error'),findings,metrics};
}
const api={audit};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.PlotuneWholeSongAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this);
