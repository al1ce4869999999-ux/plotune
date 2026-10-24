/* R6: deterministic symbolic candidate selection. No random calls or invented timbral data. */
(function(root){'use strict';
const VERSION='r6.0';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const goals={
 opening:{foregroundRole:'lead',blendTarget:.18,densityTarget:'sparse',registerTarget:'separated',continuityTarget:'smooth'},
 development:{foregroundRole:'lead',blendTarget:.35,densityTarget:'medium',registerTarget:'balanced',continuityTarget:'smooth'},
 climax:{foregroundRole:'lead',blendTarget:.55,densityTarget:'dense',registerTarget:'balanced',continuityTarget:'contrast'},
 resolution:{foregroundRole:'lead',blendTarget:.25,densityTarget:'sparse',registerTarget:'separated',continuityTarget:'smooth'}
};
function evaluate(notes,duration,bpm,arc,timbres){
 return root.PlotuneArrangementPerceptionR5.evaluate({notes,duration,bpm},{},{wholeTrackArc:arc,timbres});
}
function optimize(input){
 const {notes,duration,bpm,wholeTrackArc,timbres}=input||{};
 const fallback=(reason)=>({status:'fallback',notes,trace:{version:VERSION,status:'fallback',reason,candidates:[]}});
 if(!Array.isArray(notes)||!Number.isFinite(duration)||duration<=0||!Number.isFinite(bpm)||bpm<=0||notes.length>1400||!root.PlotuneArrangementPerceptionR5?.evaluate)return fallback('INVALID_INPUT_OR_EVALUATOR');
 if(!notes.some(n=>n.voice==='lead'))return fallback('NO_FOREGROUND');
 const meter=240/bpm,bars=Math.max(1,Math.ceil(duration/meter));
 const sections=[];
 for(let b=0;b<bars;b++){
  const name=String(wholeTrackArc?.[b]?.stage||['opening','development','climax','resolution'][Math.min(3,Math.floor(b/bars*4))]);
  const previous=sections[sections.length-1];
  if(previous?.name===name)previous.end=Math.min(duration,(b+1)*meter);
  else sections.push({name,start:b*meter,end:Math.min(duration,(b+1)*meter),goal:goals[name]||goals.development});
 }
 const original=evaluate(notes,duration,bpm,wholeTrackArc,timbres);
 if(original.status==='fallback')return fallback('R5_FALLBACK');
 const kinds=['original','duck','stagger','register','sectional'];
 const candidates=kinds.map(kind=>{
  const result=notes.map(n=>({...n}));
  let edits=0;
  for(const n of result){
   if(!['chords','arp','counter','pad','sparkle'].includes(n.voice))continue;
   const s=sections.find(s=>n.t>=s.start&&n.t<s.end);
   if(!s)continue;
   const lead=notes.find(l=>l.voice==='lead'&&l.t<n.t+n.d&&l.t+l.d>n.t&&Math.abs(l.midi-n.midi)<=7);
   const conflict=!!lead;
   if(kind==='duck'&&conflict){n.volume=Math.max(.001,n.volume*.58);edits++;}
   if(kind==='stagger'&&conflict){
    const move=Math.min(.1,n.d*.2,duration-n.t-n.d);
    if(move>.005){n.t+=move;edits++;}
    n.volume=Math.max(.001,n.volume*.78);
   }
   if(kind==='register'&&conflict&&n.voice!=='counter'){
    const shifted=n.midi-12;
    if(shifted>=36){n.midi=shifted;edits++;}
   }
   if(kind==='sectional'){
    if(s.name==='opening'&&n.voice!=='counter'){n.volume=Math.max(.001,n.volume*.66);edits++;}
    else if(s.name==='climax'&&n.voice==='counter'&&!conflict){n.volume=Math.min(1,n.volume*1.15);edits++;}
    else if(s.name==='resolution'&&conflict){n.volume=Math.max(.001,n.volume*.7);edits++;}
   }
  }
  const assessment=kind==='original'?original:evaluate(result,duration,bpm,wholeTrackArc,timbres);
  const m=assessment.metrics||{},base=original.metrics||{};
  const valid=assessment.status!=='fallback'&&Object.values(result).every(n=>Number.isFinite(n.t)&&Number.isFinite(n.volume)&&Number.isFinite(n.midi)&&n.t>=0&&n.t+n.d<=duration+1e-6);
  const targets=sections.map(s=>({section:s.name,goal:s.goal}));
  const conflictImprovement=(base.roleConflict||0)-(m.roleConflict||0);
  const clarityImprovement=(m.foregroundClarity||0)-(base.foregroundClarity||0);
  const densityDelta=Math.abs((m.noteDensity||0)-(base.noteDensity||0));
  const continuity=(m.instrumentChangeDistance||0);
  const intentionalContrast=sections.some(s=>s.goal.continuityTarget==='contrast');
  const reasons={conflictImprovement,clarityImprovement,densityDelta,continuity,intentionalContrast,editCount:edits};
  const passes=valid&&(kind==='original'||(edits>0&&conflictImprovement>=-.015&&clarityImprovement>=-.015&&densityDelta<.2));
  const cost=(1-clamp(m.foregroundClarity||0,0,1))*2+(m.roleConflict||0)*2+(m.registerOverlap||0)*.35+(intentionalContrast?continuity*.05:continuity*.3)+(kind==='original'?.07:0);
  return {kind,notes:result,metrics:m,reasons,targets,passes,cost:Math.round(cost*1e6)/1e6,edits};
 });
 const eligible=candidates.filter(c=>c.passes).sort((a,b)=>a.cost-b.cost||kinds.indexOf(a.kind)-kinds.indexOf(b.kind));
 const chosen=eligible[0];
 if(!chosen||chosen.kind==='original'||!chosen.edits)return {status:'fallback',notes,trace:{version:VERSION,status:'fallback',reason:chosen?'BASELINE_PREFERRED':'QUALITY_GATE',selected:'original',candidates:candidates.map(({kind,metrics,reasons,targets,passes,cost})=>({kind,metrics,reasons,targets,passes,cost}))}};
 return {status:'selected',notes:chosen.notes,trace:{version:VERSION,status:'selected',selected:chosen.kind,goals:sections,source:'R5 symbolic proxies',candidates:candidates.map(({kind,metrics,reasons,targets,passes,cost})=>({kind,metrics,reasons,targets,passes,cost}))}};
}
root.PlotuneArrangementOptimizationR6={VERSION,optimize};
})(typeof window!=='undefined'?window:globalThis);
