/* M0-3: Phase-to-M composition contract. Side-effect-free and opt-in. */
(function(root){
'use strict';
function copy(value){return value===undefined?null:JSON.parse(JSON.stringify(value));}
function section(section,index){
 if(!section||typeof section!=='object')throw new TypeError('section must be an object');
 const sectionId=String(section.sectionId||section.id||'section-'+(index+1));
 const start=Number(section.start),end=Number(section.end);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>1||start>=end)
  throw new RangeError('invalid section boundaries: '+sectionId);
 return {
  sectionId,role:String(section.role||section.name||'unspecified'),
  start,end,
  emotionTarget:copy(section.emotionTarget||section.target||null),
  tensionTarget:Number.isFinite(section.tensionTarget)?section.tensionTarget:null,
  motifReferences:Array.isArray(section.motifReferences)?copy(section.motifReferences):[],
  cadenceTarget:section.cadenceTarget??null,
  voiceRoles:Array.isArray(section.voiceRoles)?copy(section.voiceRoles):[],
  arrangementTarget:copy(section.arrangementTarget||null)
 };
}
function create(plan,settings={}){
 if(!plan||!Number.isInteger(plan.seed))throw new TypeError('composition plan requires integer seed');
 const enabled=settings.musicDevelopment===true;
 const source=Array.isArray(settings.sections)?settings.sections:
  Array.isArray(plan.emotionPlan?.sections)?plan.emotionPlan.sections:plan.sections||[];
 const sections=source.map(section);
 for(let i=1;i<sections.length;i++){
  if(sections[i].start<sections[i-1].end-1e-9)throw new RangeError('overlapping sections');
 }
 return {
  schema:'plotune.composition-contract',version:1,
  enabled,seed:plan.seed,characterSeed:plan.characterSeed??null,
  instrumentSet:copy(settings.instrumentSet??plan.genre??null),
  sections,globalEmotionTrajectory:copy(plan.emotionPlan?.global||null)
 };
}
root.PlotuneMContract={create};
})(window);
