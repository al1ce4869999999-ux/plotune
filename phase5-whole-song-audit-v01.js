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
  // Only diagnose musical intent when the plan explicitly declares it.
  const leads=rendered.map(s=>Array.isArray(s.notes)?s.notes.filter(n=>n.voice==='lead'&&Number.isFinite(n.pitch)):[]);
  plan.sections.forEach((section,i)=>{
    if(!rendered[i])return;
    const lead=leads[i];
    if(Number.isFinite(section.targetMeanPitch)&&lead.length){
      const mean=lead.reduce((sum,n)=>sum+n.pitch,0)/lead.length;
      if(Math.abs(mean-section.targetMeanPitch)>4)
        findings.push({code:'REGISTER_TARGET_MISMATCH',sectionId:String(section.id??i),severity:'warning',planned:section.targetMeanPitch,actual:mean});
    }
    if(section.motifReference!==undefined && section.motifReference!==null){
      const ref=Number(section.motifReference);
      if(!Number.isInteger(ref)||ref<0||ref>=i||!leads[ref]?.length||!lead.length){
        findings.push({code:'MOTIF_REFERENCE_UNVERIFIABLE',sectionId:String(section.id??i),severity:'warning'});
      }else{
        const fingerprint=ns=>ns.slice(0,5).map((n,j,a)=>j?Math.sign(n.pitch-a[j-1].pitch):0).slice(1);
        const a=fingerprint(leads[ref]),b=fingerprint(lead);
        if(a.length>=3&&b.length>=3&&a.filter((v,k)=>v===b[k]).length<2)
          findings.push({code:'MOTIF_RETURN_DIVERGENCE',sectionId:String(section.id??i),severity:'warning'});
      }
    }
    if(section.cadenceTargetPitch!==undefined){
      const last=lead.at(-1);
      if(last&&Number.isFinite(section.cadenceTargetPitch)&&Math.abs(last.pitch-section.cadenceTargetPitch)>2)
        findings.push({code:'CADENCE_TARGET_MISMATCH',sectionId:String(section.id??i),severity:'warning',planned:section.cadenceTargetPitch,actual:last.pitch});
    }
  });
  return {ok:!findings.some(f=>f.severity==='error'),findings,metrics};
}

/* Adapter for PlotuneHandheld.score(plan), which uses time in seconds,
 * pitch key 'midi', and a duration in seconds. Section boundaries use
 * the same four equal spans as the Phase 4 transition engine.
 */
function auditHandheld(plan,score){
 if(!score||!Array.isArray(score.notes)||!(score.duration>0)||!(score.bpm>0))
  throw new TypeError('Expected a rendered handheld score with notes, duration and bpm');
 const count=4,seconds=score.duration/count,barSeconds=240/score.bpm;
 const sections=Array.from({length:count},(_,i)=>({
  id:'section-'+i,bars:seconds/barSeconds
 }));
 const rendered=sections.map((s,i)=>({
  id:s.id,bars:s.bars,
  notes:score.notes.filter(n=>Number.isFinite(n.t)&&n.t>=i*seconds&&
    (i===count-1?n.t<=score.duration:n.t<(i+1)*seconds)).map(n=>({
     pitch:n.midi,voice:n.voice,t:n.t,d:n.d,volume:n.volume
    }))
 }));
 const report=audit({sections},rendered);
 const leadMetrics=rendered.map(s=>{
  const ns=s.notes.filter(n=>n.voice==='lead'&&Number.isFinite(n.pitch));
  return {sectionId:s.id,leadCount:ns.length,
   register:ns.length?[Math.min(...ns.map(n=>n.pitch)),Math.max(...ns.map(n=>n.pitch))]:null,
   uniquePitches:new Set(ns.map(n=>n.pitch)).size};
 });
 const transitions=score.details?.transitions||[];
 const transitionCount=Array.isArray(transitions)?transitions.length:0;
 const findings=report.findings.slice();
 if(!rendered.some(s=>s.notes.some(n=>n.voice==='lead')))
  findings.push({code:'NO_LEAD_MELODY',severity:'error'});
 if(plan?.musicTransitions===true&&transitionCount===0)
  findings.push({code:'NO_SECTION_TRANSITIONS',severity:'warning'});
 return {ok:!findings.some(f=>f.severity==='error'),findings,
   metrics:report.metrics,leadMetrics,transitionCount,
   song:{duration:score.duration,bpm:score.bpm,sectionCount:count}};
}
const api={audit,auditHandheld};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.PlotuneWholeSongAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this);
