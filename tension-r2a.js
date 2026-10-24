/* R2a diagnostic-only multicomponent tension: no generation hooks or RNG. */
(function(root){'use strict';
const VERSION='r2a.1';
const COMPONENTS=Object.freeze(['tonal','expectancy','rhythmic','density','timbral','dynamic']);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const clamp=x=>Math.max(0,Math.min(1,x));
const round=x=>Math.round(x*1e6)/1e6;
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
function plan(source,overrides){
 const sections=source&&source.emotionPlan&&Array.isArray(source.emotionPlan.sections)?source.emotionPlan.sections:source&&Array.isArray(source.sections)?source.sections:[];
 if(!Array.isArray(sections))throw new TypeError('sections required');
 if(overrides!=null&&(typeof overrides!=='object'||Array.isArray(overrides)))throw new TypeError('invalid overrides');
 const targets=overrides||{};
 for(const [name,values] of Object.entries(targets)){
  if(!COMPONENTS.includes(name)||!Array.isArray(values)||values.length!==sections.length||values.some(v=>!finite(v)||v<0||v>1))throw new RangeError('invalid tension component '+name);
 }
 // Missing dimensions remain unknown, not inferred from emotion or old single tension.
 return {version:VERSION,schema:'plotune.tension-plan',emotionTrajectory:source&&source.emotionPlan?source.emotionPlan:null,
  legacyTensionTarget:source&&finite(source.tensionTarget)?source.tensionTarget:null,
  sections:sections.map((s,i)=>({name:String(s.name??i),start:s.start??null,end:s.end??null,
   target:Object.fromEntries(COMPONENTS.map(k=>[k,targets[k]?targets[k][i]:null]))})),
  diagnostics:[{code:'INDEPENDENT_AXES',message:'Emotion and tension are independent. Missing targets are unknown; legacy tension preserved without remapping.'}]};
}
function evaluate(score,tensionPlan){
 const events=Array.isArray(score)?score:score&&Array.isArray(score.notes)?score.notes:score&&Array.isArray(score.events)?score.events:null;
 if(!events)throw new TypeError('score notes/events required');
 const notes=events.filter(e=>!e.rest).map((e,i)=>{
  const t=e.t??e.position??e.onset,d=e.d??e.durationUnits??e.duration,p=e.midi??e.degree??e.pitch;
  if(!finite(t)||t<0||!finite(d)||d<=0||!finite(p))throw new RangeError('invalid note '+i);
  return {t,d,p,v:e.velocity??e.accent??null,instrument:e.instrument??e.voice??null};
 }).sort((a,b)=>a.t-b.t);
 const diagnostics=[{code:'PROXY_NOT_PERCEPTION',message:'These are uncalibrated symbolic proxies, not listener-rated tension or targets.'}];
 if(tensionPlan!=null&&tensionPlan.schema!=='plotune.tension-plan')throw new TypeError('invalid tensionPlan');
 if(!notes.length)return {version:VERSION,metrics:{},diagnostics:[...diagnostics,{code:'NO_NOTES',message:'No pitched notes to evaluate'}]};
 const intervals=notes.slice(1).map((n,i)=>Math.abs(n.p-notes[i].p));
 const gaps=notes.slice(1).map((n,i)=>n.t-notes[i].t).filter(x=>x>0);
 const duration=Math.max(...notes.map(n=>n.t+n.d))-Math.min(...notes.map(n=>n.t));
 const values={};
 // Tonal: chromatic-class occupancy is NOT a key-aware dissonance estimate.
 const pitchClasses=new Set(notes.map(n=>((Math.round(n.p)%12)+12)%12));
 values.tonal=round(clamp(pitchClasses.size/12));
 diagnostics.push({code:'TONAL_PROXY',message:'Pitch-class diversity only; no inferred key or harmonic dissonance'});
 // Expectancy: interval leap size is NOT a probabilistic surprise model (R3).
 if(intervals.length)values.expectancy=round(clamp(mean(intervals)/12));
 diagnostics.push({code:'EXPECTANCY_PROXY',message:'Mean melodic leap proxy only; probabilistic expectancy reserved for R3'});
 // Rhythmic: variation of nonzero inter-onset intervals.
 if(gaps.length>1){const avg=mean(gaps),cv=Math.sqrt(mean(gaps.map(g=>(g-avg)**2)))/(avg||1);values.rhythmic=round(clamp(cv));}
 else diagnostics.push({code:'RHYTHMIC_UNKNOWN',message:'Insufficient onset intervals'});
 values.density=round(clamp(notes.length/Math.max(duration,1)/8));
 diagnostics.push({code:'DENSITY_PROXY',message:'Note onsets per symbolic time unit; normalization divisor 8 is uncalibrated'});
 const instruments=notes.map(n=>n.instrument).filter(v=>typeof v==='string'&&v.length);
 if(instruments.length===notes.length)values.timbral=round(clamp(new Set(instruments).size/8));
 else diagnostics.push({code:'TIMBRAL_UNKNOWN',message:'Instrument IDs missing; timbral tension cannot be inferred from pitches'});
 const dynamics=notes.map(n=>n.v).filter(finite);
 if(dynamics.length===notes.length)values.dynamic=round(clamp(Math.max(...dynamics)-Math.min(...dynamics)));
 else diagnostics.push({code:'DYNAMIC_UNKNOWN',message:'Dynamics absent; no estimated expression assigned'});
 return {version:VERSION,metrics:values,diagnostics};
}
root.PlotuneTensionR2a={VERSION,COMPONENTS,plan,evaluate};
})(typeof window!=='undefined'?window:globalThis);
