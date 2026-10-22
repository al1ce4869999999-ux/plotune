/* M1-3: deterministic, non-mutating section motif realization and trace. */
(function(root){
'use strict';
function realize(sections,motifs,options={}){
 if(!Array.isArray(sections))throw new TypeError('sections required');
 const registry=root.PlotuneMotifRegistry,engine=root.PlotuneMotifTransform;
 if(!registry?.references||!engine?.transform)throw new Error('motif dependencies missing');
 const variations=[],trace=[];
 const rules=options.rules||{};
 for(const section of sections){
  const originals=registry.references(section,motifs);
  for(const motif of originals){
   const rule=rules[section.sectionId]||{kind:'transposition',options:{steps:0}};
   const rendered=engine.transform(motif,rule.kind,rule.options||{});
   const record={sectionId:section.sectionId,motifId:motif.motifId,operation:rule.kind,
     sourceMotifId:rendered.sourceMotifId,eventCount:rendered.events.length};
   variations.push({sectionId:section.sectionId,motifId:motif.motifId,events:rendered.events.map(e=>({...e}))});
   trace.push(record);
  }
 }
 return {variations,trace};
}
root.PlotuneMotifSectionHistory={realize};
})(window);
