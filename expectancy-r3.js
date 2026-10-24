/* R3a: deterministic read-only empirical expectancy estimator; no bundled trained corpus. */
(function(root){'use strict';
const VERSION='r3a.1',START='^',UNK='<UNK>',BOUNDARY='|';
function pitch(e){return Number.isFinite(e.degree)?e.degree:Number.isFinite(e.pitch)?e.pitch:Number.isFinite(e.midi)?e.midi:null;}
function eventsOf(input){
 const xs=Array.isArray(input)?input:Array.isArray(input?.notes)?input.notes:Array.isArray(input?.score?.notes)?input.score.notes:null;
 if(!xs)throw new TypeError('score notes required');
 let previous=null;
 return xs.map((e,i)=>{
  const p=pitch(e),rest=e.rest===true||p===null;
  const boundary=!!(e.phraseStart||e.phraseBoundary||e.sectionStart||i===0);
  if(boundary)previous=null;
  const interval=rest?'rest':previous===null?'initial':String(p-previous);
  if(!rest)previous=p;
  const duration=Number(e.durationUnits??e.d??e.duration??e.length??1);
  if(!Number.isFinite(duration)||duration<=0)throw new RangeError('invalid duration');
  const rhythm=(rest?'rest:':'note:')+String(Math.round(duration*1000)/1000);
  return {index:i,interval,boundary,rhythm,rest};
 });
}
function symbols(events,axis){return events.map(e=>axis==='interval'?e.interval:axis==='rhythm'?e.rhythm:(e.interval+'@'+e.rhythm));}
function train(corpus=[],metadata={}){
 if(!Array.isArray(corpus))throw new TypeError('corpus must be an array');
 const records=corpus.map(eventsOf),axes={};
 for(const axis of ['interval','rhythm','joint']){
  const vocab=new Set([UNK]),counts=[new Map(),new Map(),new Map()];
  for(const record of records)for(const s of symbols(record,axis))vocab.add(s);
  for(const record of records){
   const seq=symbols(record,axis);let history=[];
   for(let i=0;i<seq.length;i++){
    if(record[i].boundary)history=[];
    const symbol=seq[i];
    for(let order=0;order<=2;order++){
     if(order>history.length)continue;
     const key=history.slice(-order).join('\u001f');
     let row=counts[order].get(key);if(!row){row=new Map();counts[order].set(key,row);}
     row.set(symbol,(row.get(symbol)||0)+1);
    }
    history.push(symbol);
   }
  }
  axes[axis]={vocab:[...vocab].sort(),counts:counts.map(m=>[...m].map(([k,v])=>[k,[...v]]))};
 }
 return {version:VERSION,metadata:{source:metadata.source??'caller-supplied',style:metadata.style??'unspecified',training:'in-memory-corpus',corpusSize:records.length,...metadata},axes};
}
function distribution(model,axis,history){
 const data=model?.axes?.[axis];if(!data)throw new TypeError('invalid expectancy model');
 const vocab=data.vocab,table=data.counts.map(rows=>new Map(rows.map(([k,v])=>[k,new Map(v)])));
 let used=0,row=null;
 for(let order=Math.min(2,history.length);order>=0;order--){
  const key=history.slice(-order).join('\u001f');
  const found=table[order].get(key);
  if(found&&[...found.values()].reduce((a,b)=>a+b,0)>0){row=found;used=order;break;}
 }
 const alpha=1, sum=row?[...row.values()].reduce((a,b)=>a+b,0):0;
 const denom=sum+alpha*vocab.length;
 const probabilities={};for(const s of vocab)probabilities[s]=((row?.get(s)||0)+alpha)/denom;
 return {probabilities,order:used,backoff:history.length>used,denominator:denom};
}
function evaluate(score,plan={},context={}){
 const xs=eventsOf(score),model=context.model??train(context.corpus??[],context.metadata??{source:'none',training:'untrained-uniform'});
 const histories={interval:[],rhythm:[],joint:[]},trace=[],trajectory=[];
 for(const ev of xs){
  if(ev.boundary)for(const axis of Object.keys(histories))histories[axis]=[];
  const result={index:ev.index,boundary:ev.boundary,axes:{}};
  for(const axis of Object.keys(histories)){
   const symbol=axis==='interval'?ev.interval:axis==='rhythm'?ev.rhythm:ev.interval+'@'+ev.rhythm;
   const d=distribution(model,axis,histories[axis]),key=Object.hasOwn(d.probabilities,symbol)?symbol:UNK;
   const probability=d.probabilities[key],ic=-Math.log2(probability);
   const entropy=Object.values(d.probabilities).reduce((a,p)=>a-p*Math.log2(p),0);
   result.axes[axis]={symbol,matched:key,probability,ic,entropy,order:d.order,backoff:d.backoff};
   histories[axis].push(symbol);
  }
  trajectory.push(result.axes.joint.ic);trace.push(result);
 }
 const mean=trajectory.length?trajectory.reduce((a,b)=>a+b,0)/trajectory.length:0;
 const entropy=trace.length?trace.reduce((a,e)=>a+e.axes.joint.entropy,0)/trace.length:0;
 return {version:VERSION,status:'ok',model:{version:model.version,metadata:model.metadata},metrics:{meanIC:mean,meanEntropy:entropy,eventCount:xs.length},surpriseTrajectory:trajectory,trace};
}
root.PlotuneExpectancyR3={VERSION,train,evaluate,eventsOf,distribution};
})(typeof window!=='undefined'?window:globalThis);
