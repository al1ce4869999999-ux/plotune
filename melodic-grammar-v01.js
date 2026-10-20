/* Plotune melodic grammar v0.2: phrase-first timing, rests, duration and cadence.
 * Deterministic and dependency-free. Personality-to-music mapping remains a creative hypothesis.
 */
(function(root){'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function hash(text){let x=2166136261;for(const c of String(text||'')){x^=c.codePointAt(0);x=Math.imul(x,16777619)}return x>>>0}
function rng(seed){let x=(seed>>>0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function has(node,v){return Array.isArray(node?.value)?node.value.includes(v):node?.value===v}
function sample(options,weights,rand){const total=weights.reduce((a,b)=>a+b,0),r=rand()*total;let sum=0;for(let i=0;i<options.length;i++){sum+=weights[i];if(r<sum)return options[i]}return options[options.length-1]}
function grammar(structure,expression,seed=1){
 const c=structure?.character||{},w=structure?.world||{},m=expression?.motif||{};
 const curiosity=has(c.attention,'curious')?1:0,persistent=has(c.values,'competitive')?1:0;
 const calm=has(c.stableTraits,'timid')||has(c.decision,'careful')?1:0;
 const motion=has(c.motion,'bouncy')||has(c.stableTraits,'lively')?1:0;
 const bounce=clamp(Math.max(m.bounce||0,motion*.65)),hesitation=clamp(Math.max(m.hesitation||0,calm*.58));
 const identity=hash((c.themeIdentity?.value||'')+'|'+seed);
 const choices=[-4,-3,-2,-1,0,1,2,3,4];
 const weights=choices.map(v=>{const a=Math.abs(v);let wt=a===0?1.1:a===1?2.8:a===2?1.6:a===3?.65:.3;
  if(a>=3)wt*=1+bounce*3;if(a===1)wt*=1+hesitation*.8;if(a===0)wt*=1+hesitation*.9+persistent*.3;
  if(v>0)wt*=1+curiosity*.32;return wt});
 return {identity,choices,weights,bounce,hesitation,curiosity,persistent,
  world:{mode:has(w.magicSystem,'magic')?'modal':has(w.period,'edo')?'pentatonic':'diatonic',space:expression?.space?.place||'unspecified'},
  noteDensity:clamp(.64+bounce*.24-hesitation*.34,.25,.95),
  phraseLength:Math.round(clamp(6+bounce*1.7-hesitation*2.8,3,9))};
}
// A musical question/answer cycle of four bars: opening, response, development, resolution.
// Rhythm is selected first as bounded events, not inherited from fixed note slots.
function phrase(g,bar,count=8){
 const r=rng((g.identity^Math.imul(bar+1,0x9e3779b9))>>>0);
 const role=['opening','answer','development','resolution'][bar%4];
 const cadence=role==='resolution'?'authentic':role==='answer'?'half':'open';
 const cells=[];
 let cursor=0;
 const fast=g.bounce>.45,slow=g.hesitation>.40;
 while(cursor<16){
  const remaining=16-cursor;
  const choices=slow?[2,3,4,6]:fast?[1,1.5,2,3]:[1.5,2,3,4];
  const span=Math.min(remaining,choices[Math.floor(r()*choices.length)]);
  // Terminal arrival is reserved for the cadence, not replaced by chance.
  const terminal=cursor+span>=16;
  const rest=!terminal && r()>(g.noteDensity+(role==='development'?.06:0));
  cells.push({p:cursor,span,rest});
  cursor+=span;
 }
 if(cells.length===1){cells[0].span=12;cells.push({p:12,span:4,rest:false})}
 const final=cells[cells.length-1];
 final.rest=false;
 // Reserve audible space before the answer or the final resolution.
 if(cells.length>2 && (role==='answer'||role==='resolution')){
  const before=cells[cells.length-2];before.rest=true;
 }
 const result=[];
 let pitch=2+Math.floor(r()*3),direction=1;
 for(let i=0;i<cells.length;i++){
  const cell=cells[i],last=i===cells.length-1;
  const trend=role==='opening'||role==='development'?1:-1;
  const opts=g.choices.filter(d=>pitch+d>=0&&pitch+d<=8);
  const weights=opts.map(d=>{let wt=g.weights[g.choices.indexOf(d)];
    if(d!==0&&Math.sign(d)===trend)wt*=1.33;
    if(d!==0&&Math.sign(d)!==direction)wt*=1+g.curiosity*.5;
    return wt});
  const delta=sample(opts,weights,r);pitch+=delta;
  if(delta!==0)direction=Math.sign(delta);
  if(last){
   // V is an open question; tonic is a full stop; other endings stay unresolved.
   pitch=cadence==='authentic'?0:cadence==='half'?4:Math.min(6,Math.max(1,pitch));
  }
  const durationUnits=last?cell.span*.92:Math.min(cell.span*.90,slow?3.5:fast?1.75:2.75);
  result.push({degree:pitch,rest:cell.rest,positionUnits:cell.p,durationUnits,step:delta,
   cadence:last?cadence:null,role});
 }
 return result;
}
root.PlotuneMelodicGrammar={grammar,phrase};
})(window);
