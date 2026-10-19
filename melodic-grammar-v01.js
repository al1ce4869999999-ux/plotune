/* Plotune melodic grammar v0.1: seeded, weighted transitions, no fixed contour.
 * Character cues influence behavior; world constrains mode/scale; scene alters phrasing.
 * Personality associations are creative hypotheses, not validated psychological classifiers. */
(function(root){'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function hash(text){let x=2166136261;for(const c of String(text||'')){x^=c.codePointAt(0);x=Math.imul(x,16777619)}return x>>>0}
function rng(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function has(node,v){return Array.isArray(node?.value)?node.value.includes(v):node?.value===v}
function normalize(weights){const s=weights.reduce((a,b)=>a+b,0);return weights.map(x=>x/s)}
function sample(options,weights,rand){const p=normalize(weights),r=rand();let sum=0;for(let i=0;i<options.length;i++){sum+=p[i];if(r<sum)return options[i]}return options[options.length-1]}
function grammar(structure,expression,seed=1){
 const c=structure?.character||{},w=structure?.world||{},s=structure?.scene||{},m=expression?.motif||{};
 const curiosity=has(c.attention,'curious')?1:0;
 const persistent=has(c.values,'competitive')?1:0;
 const calm=has(c.stableTraits,'timid')||has(c.decision,'careful')?1:0;
 const motion=has(c.motion,'bouncy')||has(c.stableTraits,'lively')?1:0;
 const bounce=clamp(Math.max(m.bounce||0,motion*.65));
 const hesitation=clamp(Math.max(m.hesitation||0,calm*.58));
 const identity=hash((c.themeIdentity?.value||'')+'|'+seed);
 const choices=[-4,-3,-2,-1,0,1,2,3,4];
 const weights=choices.map(v=>{
   const a=Math.abs(v);
   let weight=a===0?1.1:a===1?2.8:a===2?1.6:a===3?.65:.3;
   if(a>=3)weight*=1+bounce*3.0;
   if(a===1)weight*=1+hesitation*.8;
   if(a===0)weight*=1+hesitation*.9+persistent*.3;
   if(v>0)weight*=1+curiosity*.32;
   return weight;
 });
 const world={mode:has(w.magicSystem,'magic')?'modal':has(w.period,'edo')?'pentatonic':'diatonic',
   space:expression?.space?.place||'unspecified'};
 return {identity,choices,weights,bounce,hesitation,curiosity,persistent,world,
   noteDensity:clamp(.64+bounce*.24-hesitation*.34,.25,.95),
   phraseLength:Math.round(clamp(6+bounce*1.7-hesitation*2.8,3,9))};
}
function phrase(g,bar,count=8){
 const r=rng((g.identity^Math.imul(bar+1,0x9e3779b9))>>>0);
 const result=[];let degree=2+Math.floor(r()*3),direction=1;
 for(let i=0;i<count;i++){
   // Long-form direction alternates by section; local direction responds to previous step.
   const section=bar%4,trend=section===0?1:section===1?-1:section===2?1:-1;
   const opts=g.choices.filter(d=>degree+d>=0&&degree+d<=8);
   const weights=opts.map(d=>{
     let weight=g.weights[g.choices.indexOf(d)];
     if(d!==0&&Math.sign(d)===trend)weight*=1.33;
     if(d!==0&&Math.sign(d)!==direction)weight*=1+g.curiosity*.5;
     if(i===count-1&&d<0)weight*=1.4;
     return weight;
   });
   const step=sample(opts,weights,r);
   degree+=step;if(step!==0)direction=Math.sign(step);
   const rest=r()>g.noteDensity;
   const length=g.hesitation>.4&&r()>.55?2.8:g.bounce>.45&&r()>.45?.75:1.4;
   result.push({degree,rest,durationUnits:length,step});
 }
 return result;
}
// Three independent musical layers: motivic identity, phrase rhythm, tonal direction.
// Each layer is deterministic for the same seed, character and scene. Instrument identity
// is deliberately absent: articulation and envelopes belong to the renderer.
function compose(options={}){
 const seed=options.seed||1,g=grammar(options.structure,options.expression,seed);
 const mood=String(options.mood||'').toLowerCase();
 const sorrow=/sad|loss|farewell|lament|grief|lonely|sigh|musicbox/.test(mood);
 const hopeful=/courage|hero|triumph|hope|retry|victory/.test(mood);
 const sparse=/sparse|lullaby|sleep/.test(mood);
 const density=clamp(Number.isFinite(options.density)?options.density:g.noteDensity,.18,.96);
 const bars=Math.max(1,Math.floor(options.bars||1)),slots=Math.max(4,Math.floor(options.slots||16));
 const count=Math.max(3,Math.min(slots,12,Math.round(options.notesPerBar||(sparse?4:sorrow?5:hopeful?8:6))));
 // Identity is tied to the character, while phrase archetype and emotional inflection
 // are influenced by the scene/style without hardcoding an instrument's contour.
 const identityRng=rng(g.identity^0x51f15e17);
 const motifSteps=Array.from({length:Math.min(count,6)},(_,i)=>{
  const candidates=i===0?[-2,-1,0,1,2]:[-3,-2,-1,0,1,2,3];
  const weights=candidates.map(n=>g.weights[g.choices.indexOf(n)]*(i>0&&i%3===0&&n===0?1.4:1));
  return sample(candidates,weights,identityRng);
 });
 const tonicDegree=2+Math.floor(identityRng()*3);
 const rhythmTemplates=[
  [3,1,2,3,1,2,4,2],
  [2,2,1,3,2,1,3,2],
  [1,3,1,2,3,1,2,3],
  [2,1,2,2,1,3,2,3]
 ];
 const archetype=hash(mood+'|'+g.world.mode)%rhythmTemplates.length;
 const structure=['statement','variation','answer','resolution'];
 const out=[];
 for(let b=0;b<bars;b++){
  const section=b%4,rand=rng(g.identity^Math.imul(b+1,0x9e3779b9)^hash(mood));
  const template=rhythmTemplates[(archetype+(section===2?2:section===3?1:0))%rhythmTemplates.length];
  // Allocate positive integer grid lengths using a rhythmic cell, rather than
  // placing attacks at equal intervals. One attack per cell, no collisions.
  let weights=Array.from({length:count},(_,i)=>template[(i+section)%template.length]);
  if(sorrow||sparse)weights=weights.map((n,i)=>i===count-1?n*1.8:n);
  if(hopeful)weights=weights.map((n,i)=>i%3===0?n*.75:n);
  const boundaries=[0];let remaining=slots;
  for(let i=0;i<count;i++){
    if(i===count-1){boundaries.push(slots);break}
    const weightSum=weights.slice(i).reduce((a,v)=>a+v,0);
    const width=Math.max(1,Math.min(remaining-(count-i-1),Math.round(remaining*weights[i]/weightSum)));
    boundaries.push(boundaries[boundaries.length-1]+width);
    remaining-=width;
  }
  let degree=tonicDegree,prev=degree;
  const items=[];
  for(let i=0;i<count;i++){
   const offset=boundaries[i],space=boundaries[i+1]-offset;
   // Statement -> recognisable variation -> contrasting answer -> resolution.
   const motif=motifSteps[i%motifSteps.length];
   const step=section===0?motif:
     section===1?(i%3===1?-motif:motif):
     section===2?(i%2===0?-motif:motif+Math.sign(motif||1)):
     (i>count-3?-1:motif);
   degree=clamp(degree+step,0,8);
   if(section===2&&i===Math.floor(count/2))degree=clamp(degree+(hopeful?2:1),0,8);
   if(sorrow&&i>count-3)degree=clamp(degree-1,0,8);
   if(hopeful&&section===2&&i===count-2)degree=clamp(degree+1,0,8);
   // Half cadence on the answer; final cadence settles on scale degree zero.
   if(section===3&&i===count-2)degree=Math.min(3,degree);
   if(section===3&&i===count-1)degree=0;
   const ending=i===count-1;
   const restChance=(1-density)*(sparse?1.25:1)+(section===2&&i===count-2?.09:0);
   const rest=!ending&&i>0&&rand()<clamp(restChance,.02,.72);
   const articulation=sorrow?1.10:hopeful?.83:sparse?1.08:.94;
   const durationUnits=Math.max(.3,Math.min(slots-offset,space*articulation*(ending?1.13:1)));
   items.push({offset,durationUnits,degree,rest,step:degree-prev,
     motifIndex:i%motifSteps.length,phraseRole:structure[section],cadence:ending&&section===3});
   prev=degree;
  }
  out.push(items);
 }
 return {version:'2',seed,bars:out,slots,mood,motif:motifSteps,phraseForm:structure,
  generation:{rhythm:'weighted-cells',development:'motif-variation-answer-resolution',direction:'cadential'}};
}
root.PlotuneMelodicGrammar={grammar,phrase,compose};
})(window);