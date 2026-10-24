/* R7 Phase 4: score-only transition intentions and symbolic diagnostics. */
(function(root){'use strict';
const VERSION='r7.0', clamp=(v)=>Math.max(0,Math.min(1,v));
const roles=['lead','counter','chords','arp','bass','pad','sparkle'];
function boundaryPlan(from,to,duration,bpm){
 const hard=to==='climax'&&from!=='climax', returnMotif=to==='resolution';
 return {fromSection:from,toSection:to,boundarySalienceTarget:hard?.85:returnMotif?.52:.38,
  closureStrength:returnMotif?.8:hard?.18:.45,continuityTarget:hard?'contrast':'smooth',
  surpriseTarget:hard?.8:returnMotif?.2:.35,preservedFeatures:returnMotif?['lead','motif-identity']:hard?['harmonic-context']:['lead','pulse'],
  changedFeatures:hard?['density','foreground-background','register']:returnMotif?['density','dynamics']:['texture'],
  previewChannels:hard?[]:['lead','bass'],breathWindow:hard?0:Math.min(.25,60/bpm/2),
  source:'stage-heuristic (symbolic; not measured intent)'};
}
function evaluate(input){
 const {notes,duration,bpm,wholeTrackArc}=input||{};
 const fallback=reason=>({version:VERSION,status:'fallback',kind:'symbolic-proxy',reason,transitions:[],diagnostics:[reason]});
 if(!Array.isArray(notes)||!(duration>0)||!(bpm>0)||!Number.isFinite(duration)||!Number.isFinite(bpm))return fallback('INVALID_SCORE');
 if(!Array.isArray(wholeTrackArc)||!wholeTrackArc.length)return fallback('MISSING_WHOLE_TRACK_ARC');
 const barLength=240/bpm,bars=Math.max(1,Math.ceil(duration/barLength));
 const stages=wholeTrackArc.slice(0,bars).map(x=>typeof x?.stage==='string'?x.stage:null);
 if(stages.some(x=>!x)||stages.length!==bars)return fallback('INCOMPLETE_WHOLE_TRACK_ARC');
 const transitions=[];
 for(let b=1;b<stages.length;b++){
  if(stages[b]===stages[b-1])continue;
  const t=b*barLength,plan=boundaryPlan(stages[b-1],stages[b],duration,bpm);
  const left=notes.filter(n=>Number.isFinite(n.t)&&Number.isFinite(n.d)&&n.d>0&&n.t<t&&n.t+n.d>t-barLength);
  const right=notes.filter(n=>Number.isFinite(n.t)&&Number.isFinite(n.d)&&n.d>0&&n.t>=t&&n.t<t+barLength);
  const active=ns=>new Set(ns.map(n=>n.voice).filter(x=>roles.includes(x)));
  const a=active(left),c=active(right),union=new Set([...a,...c]);
  const shared=[...a].filter(x=>c.has(x)),enter=[...c].filter(x=>!a.has(x)),exit=[...a].filter(x=>!c.has(x));
  const change=union.size?1-shared.length/union.size:0;
  const densityA=left.length/barLength,densityB=right.length/barLength;
  const densityDelta=Math.abs(densityB-densityA)/Math.max(1,densityA,densityB);
  const across=notes.filter(n=>Number.isFinite(n.t)&&Number.isFinite(n.d)&&n.t<t&&n.t+n.d>t);
  const discontinuity=clamp(change*.65+densityDelta*.35);
  const observedSalience=clamp(discontinuity*.85+(across.length?0:.15));
  const targetError=Math.abs(plan.boundarySalienceTarget-observedSalience);
  const intentionalContrast=plan.continuityTarget==='contrast';
  transitions.push({bar:b+1,time:t,plan,observed:{entrances:enter,exits:exit,sharedVoices:shared,
   densityBefore:densityA,densityAfter:densityB,densityDelta,voiceChange:change,
   crossBoundaryNotes:across.length,boundarySalience:observedSalience},
   diagnostics:{intentionalContrast,unnaturalBreak:!intentionalContrast&&discontinuity>.7,
    targetError,continuityCost:intentionalContrast?Math.abs(discontinuity-.75):discontinuity,
    closureMeasured:false,previewMeasured:false,surpriseMeasured:false},
   limitations:['Voice labels do not uniquely identify instruments','No spectral masking, harmonic cadence, motif preview or listening quality measured']});
 }
 return {version:VERSION,status:'ok',kind:'symbolic-proxy',source:'wholeTrackArc',transitions,
  diagnostics:transitions.length?[]:['NO_STAGE_CHANGE'],limits:['R7 diagnostic only; notes and PCM unchanged','Transition targets are heuristic until Phase 4 intention metadata is available']};
}
root.PlotuneTransitionR7={VERSION,evaluate};
})(typeof window!=='undefined'?window:globalThis);
