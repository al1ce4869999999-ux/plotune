/* Motif transformation layer: seeded form-aware phrase variants. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function build(plan,compose,g,density){
 const first=compose(g,0,{density});
 const contrast=compose(g,7,{density:clamp(density*.85,.22,.95)});
 const phrases=[];
 for(let bar=0;bar<plan.sections.reduce((n,s)=>n+s.bars,0);bar++){
  const section=plan.sections.find(s=>bar>=s.startBar&&bar<s.startBar+s.bars);
  const local=bar-section.startBar;
  const source=section.function==='contrast'?contrast:first;
  const generated=compose(g,bar,{density:clamp(density*(.75+section.densityTarget[local]*.5),.22,.95)});
  const events=generated.map((e,i)=>{
   const m=source[i%source.length],relation=section.relation;
   const degree=relation==='contrast'?e.degree:relation==='return'||relation==='repeat'?m.degree:
    clamp(m.degree+(i%4===0?1:0),0,8);
   const position=relation==='return'||relation==='repeat'?m.position:e.position;
   return {...e,position,degree,rest:relation==='return'||relation==='repeat'?m.rest:e.rest,
    durationUnits:Math.min(relation==='return'||relation==='repeat'?m.durationUnits:e.durationUnits,16-position)};
  }).sort((a,b)=>a.position-b.position);
  if(events.length&&local===section.bars-1&&section.cadence==='authentic'){
   const last=events[events.length-1];last.degree=0;last.rest=false;last.cadence=true;
  }
  phrases.push(events);
 }
 return {phrases,motifs:{'motif-A':first,'motif-B':contrast}};
}
root.PlotuneMotifPlanner={build};
})(typeof window!=='undefined'?window:globalThis);
