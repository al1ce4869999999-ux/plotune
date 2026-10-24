/* R1 diagnostic-only motif similarity. No sound-generation or RNG dependency. */
(function(root){'use strict';
const VERSION='r1.0';
const DEFAULTS=Object.freeze({intervalScale:12,rangeScale:12,accentTolerance:0.2,transportScale:1});
const clamp=x=>Math.max(0,Math.min(1,x));
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const round=x=>Math.round(x*1e6)/1e6;
const numeric=x=>typeof x==='number'&&Number.isFinite(x);
function read(source){
 const events=Array.isArray(source)?source:source&&Array.isArray(source.events)?source.events:source&&Array.isArray(source.notes)?source.notes:null;
 if(!events)throw new TypeError('notes/events array required');
 const arr=events.map((e,i)=>{
  const t=e.t??e.position??e.onset;
  const p=e.midi??e.degree??e.pitch;
  const d=e.d??e.durationUnits??e.duration;
  const rest=!!e.rest;
  if(!numeric(t)||!numeric(d)||d<=0||t<0||(!rest&&!numeric(p)))throw new RangeError('invalid motif event '+i);
  const accent=e.accent??e.velocity??e.volume??null;
  if(accent!==null&&!numeric(accent))throw new RangeError('invalid accent '+i);
  return {t,p:rest?null:p,d,rest,accent,anchor:!!e.anchor,bar:e.bar??e.measure??null,index:i};
 });
 arr.sort((a,b)=>a.t-b.t||a.index-b.index);
 return {all:arr,notes:arr.filter(e=>!e.rest)};
}
function compare(a,b,options){
 const cfg={...DEFAULTS,...options};
 for(const k of Object.keys(DEFAULTS))if(!numeric(cfg[k])||cfg[k]<=0)throw new RangeError('invalid option '+k);
 const A=read(a),B=read(b),x=A.notes,y=B.notes;
 const count=Math.max(x.length,y.length);
 if(!count)throw new RangeError('both motifs have no pitched notes');
 // Sequence comparison is explicitly aligned from the first sounded event; fragmentation incurs coverage penalty.
 const coverage= count?Math.min(x.length,y.length)/count:0;
 const n=Math.min(x.length,y.length);
 const dx=x.slice(1).map((e,i)=>e.p-x[i].p),dy=y.slice(1).map((e,i)=>e.p-y[i].p);
 const len=Math.min(dx.length,dy.length);
 const pairCoverage=Math.max(dx.length,dy.length)?len/Math.max(dx.length,dy.length):coverage;
 const exact=(v,w)=>v===w?1:0;
 const pitchGap=(v,w)=>clamp(1-Math.abs(v-w)/cfg.intervalScale);
 const contour=len?mean(dx.slice(0,len).map((v,i)=>exact(Math.sign(v),Math.sign(dy[i]))))*pairCoverage:coverage;
 const interval=len?mean(dx.slice(0,len).map((v,i)=>pitchGap(v,dy[i])))*pairCoverage:coverage;
 const pitchShift=n?y[0].p-x[0].p:0;
 const absolutePitch=n?mean(x.slice(0,n).map((e,i)=>pitchGap(e.p,y[i].p)))*coverage:0;
 const transposedPitch=n?mean(x.slice(0,n).map((e,i)=>pitchGap(e.p+pitchShift,y[i].p)))*coverage:0;
 const norm=v=>{if(v.length<2)return v.map(()=>0);const s=v[v.length-1].t-v[0].t||1;return v.map(e=>(e.t-v[0].t)/s);};
 const tx=norm(x),ty=norm(y);
 const rhythm=n?mean(tx.slice(0,n).map((v,i)=>clamp(1-Math.abs(v-ty[i]))))*coverage:0;
 const absoluteOnset=n?mean(x.slice(0,n).map((e,i)=>clamp(1-Math.abs(e.t-y[i].t)/cfg.transportScale)))*coverage:0;
 const range=x.length&&y.length?clamp(1-Math.abs((Math.max(...x.map(e=>e.p))-Math.min(...x.map(e=>e.p)))-(Math.max(...y.map(e=>e.p))-Math.min(...y.map(e=>e.p))))/cfg.rangeScale)*coverage:0;
 function anchors(notes){const specified=notes.filter(e=>e.anchor);return specified.length?specified:[notes[0],notes[notes.length-1]].filter(Boolean);}
 const ax=anchors(x),ay=anchors(y),an=Math.min(ax.length,ay.length);
 const anchor=an?mean(ax.slice(0,an).map((e,i)=>pitchGap(e.p+pitchShift,ay[i].p)))*an/Math.max(ax.length,ay.length)*coverage:0;
 const accented=x.slice(0,n).map((e,i)=>[e.accent,y[i].accent]).filter(([v,w])=>v!==null&&w!==null);
 const accent=accented.length?mean(accented.map(([v,w])=>clamp(1-Math.abs(v-w)/cfg.accentTolerance)))*coverage:null;
 const timeSpan=notes=>notes.length>1?notes[notes.length-1].t-notes[0].t:1;
 const sx=timeSpan(x)||1,sy=timeSpan(y)||1;
 const transport=n?mean(x.slice(0,n).map((e,i)=>clamp(1-(Math.abs((e.t-x[0].t)/sx-(y[i].t-y[0].t)/sy)+Math.abs((e.p-x[0].p)-(y[i].p-y[0].p))/cfg.intervalScale)/2)))*coverage:0;
 const restPattern=(A.all.length||B.all.length)?mean(Array.from({length:Math.min(A.all.length,B.all.length)},(_,i)=>exact(A.all[i].rest,B.all[i].rest)))*Math.min(A.all.length,B.all.length)/Math.max(A.all.length,B.all.length):0;
 const metrics={coverage,contour,interval,rhythm,anchor,range,accent,transport,absolutePitch,transposedPitch,absoluteOnset,restPattern};
 for(const k of Object.keys(metrics)){if(metrics[k]===null)delete metrics[k];else metrics[k]=round(clamp(metrics[k]));}
 const diagnostics=[
  {code:'ALIGNMENT',message:'First sounded note order; unmatched fragments reduce coverage',matched:n,left:x.length,right:y.length},
  {code:'INVARIANCE',message:'contour/interval/anchor/range/transposedPitch invariant to common transposition; rhythm/transport invariant to uniform tempo scaling; absolutePitch/absoluteOnset retain absolute reference'},
  {code:'ACCENT',message:accent===null?'Accent absent on one or both sides; not scored':'Compare recorded accent amplitudes using configurable tolerance'},
  {code:'REST',message:'Rest positions compared separately from sounded-note alignment'},
  {code:'BOUNDARY',message:'Bar metadata is not a hard alignment boundary; onset remains continuous'},
  {code:'HYPOTHESIS',message:'Scales and thresholds are tunable assumptions, not validated perceptual constants'}
 ];
 return {metrics,diagnostics,configuration:{...cfg},version:VERSION};
}
root.PlotuneMotifSimilarityEvaluator={VERSION,DEFAULTS,compare};
})(typeof window!=='undefined'?window:globalThis);
