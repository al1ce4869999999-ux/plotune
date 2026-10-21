/* Hierarchical composition planning v1. Pure, deterministic planning; legacy audio remains unchanged. */
(function(root){'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function hash(v){let h=2166136261;for(const c of String(v)){h^=c.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0;}
function formPlanner(input={}){
 const beats=Math.max(1,Math.min(12,Math.floor(input.beats||4)));
 const bars=Math.max(2,Math.min(128,Math.floor(input.bars||16)));
 const seed=(Number(input.seed)>>>0)||1;
 const patterns=bars<=8?['statement','variation']:bars<=24?['statement','variation','contrast','reprise']:['intro','statement','variation','contrast','reprise','outro'];
 const weights=patterns.map(p=>p==='statement'||p==='reprise'?2:p==='intro'||p==='outro'?1:1.5);
 const total=weights.reduce((a,b)=>a+b,0);
 const lengths=weights.map(w=>Math.max(1,Math.floor(bars*w/total)));
 while(lengths.reduce((a,b)=>a+b,0)<bars)lengths[lengths.indexOf(Math.min(...lengths))]++;
 while(lengths.reduce((a,b)=>a+b,0)>bars){const i=lengths.indexOf(Math.max(...lengths));if(lengths[i]<=1)break;lengths[i]--;}
 let start=0;
 const sections=patterns.map((fn,i)=>{const n=lengths[i],section={
  id:'section-'+i,startBar:start,bars:n,function:fn,
  motifRef:fn==='contrast'?'motif-B':'motif-A',
  relation:fn==='statement'?'repeat':fn==='contrast'?'contrast':fn==='reprise'?'return':'vary',
  cadence:i===patterns.length-1?'authentic':fn==='contrast'?'half':'none',
  tensionTarget:[],densityTarget:[]
 };start+=n;return section;});
 return {version:1,seed,meter:{beats,subdivision:Math.max(1,Math.floor(input.subdivision||4))},
  tempo:clamp(Number(input.tempo)||100,30,240),key:{tonic:((Math.floor(input.tonic||0)%12)+12)%12,scale:Array.isArray(input.scale)?input.scale.slice():[0,2,4,5,7,9,11]},
  instrumentation:Array.isArray(input.instrumentation)?input.instrumentation.slice():[],sections,motifs:{},phrases:[],diagnostics:[]};
}
function tensionPlanner(plan){
 const energy={intro:.18,statement:.38,variation:.54,contrast:.66,climax:.9,reprise:.48,outro:.16};
 for(const section of plan.sections){
  const base=energy[section.function]??.4;
  section.tensionTarget=Array.from({length:section.bars},(_,i)=>{
   const p=section.bars===1?1:i/(section.bars-1);
   const cadenceDrop=section.cadence==='authentic'&&i===section.bars-1?.3:0;
   return +clamp(base+.12*p-cadenceDrop).toFixed(3);
  });
  section.densityTarget=section.tensionTarget.map(t=>+clamp(.18+.7*t).toFixed(3));
  plan.diagnostics.push({stage:'TensionPlanner',location:section.id,candidates:1,chosen:section.cadence,scores:{target:section.tensionTarget[section.tensionTarget.length-1]},reason:'Section function and cadence determine target tension'});
 }
 return plan;
}
function create(input){const p=tensionPlanner(formPlanner(input));p.diagnostics.unshift({stage:'FormPlanner',location:'whole',candidates:1,chosen:p.sections.map(s=>s.function).join('-'),scores:{bars:p.sections.reduce((n,s)=>n+s.bars,0)},reason:'Duration-dependent hierarchical form'});return p;}
root.PlotuneCompositionPlan={create,formPlanner,tensionPlanner,hash};
})(typeof window!=='undefined'?window:globalThis);
