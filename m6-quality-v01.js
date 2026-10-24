/* M6: explainable local quality assessment and bounded repair. Pure, opt-in. */
(function(root){'use strict';
const clone=n=>({...n});
const key=n=>Math.round(n.t*1000)+':'+n.voice+':'+n.midi;
function assess({notes,meter,duration}={}){
 if(!Array.isArray(notes)||!Number.isFinite(meter)||meter<=0||!Number.isFinite(duration)||duration<=0)throw new TypeError('M6 requires notes and valid timing');
 const bars=Math.ceil(duration/meter),issues=[],metrics={repetition:0,unresolvedEnding:0,voiceCollision:0};
 const lead=notes.filter(n=>n.voice==='lead'&&n.volume>0).sort((a,b)=>a.t-b.t);
 const signatures=[];
 for(let b=0;b<bars;b++){
  const phrase=lead.filter(n=>n.t>=b*meter&&n.t<(b+1)*meter);
  const sig=phrase.map(n=>[Math.round((n.t-b*meter)*100)/100,n.midi,Math.round(n.d*100)/100]);
  signatures.push(JSON.stringify(sig));
  if(b>0&&sig.length>=3&&signatures[b]===signatures[b-1]){
   issues.push({bar:b,metric:'repetition',reason:'identical lead phrase in adjacent bars',scope:'lead'});metrics.repetition++;
  }
 }
 const last=lead[lead.length-1];
 if(last&&last.t+last.d<duration-meter*.30){
  issues.push({bar:Math.min(bars-1,Math.floor(last.t/meter)),metric:'unresolvedEnding',reason:'lead ends well before track boundary',scope:'lead'});metrics.unresolvedEnding++;
 }
 const seen=new Set();
 for(const n of notes){
  if(!Number.isFinite(n.t)||!Number.isFinite(n.d)||n.d<=0||n.t<0||n.t+n.d>duration+.001)
   issues.push({bar:Math.max(0,Math.floor((n.t||0)/meter)),metric:'invalidTiming',reason:'note outside playable range',scope:n.voice});
  const k=key(n);
  if(seen.has(k)&&n.voice==='counter'){metrics.voiceCollision++;issues.push({bar:Math.floor(n.t/meter),metric:'voiceCollision',reason:'duplicate counter pitch and onset',scope:'counter'});}
  seen.add(k);
 }
 return {metrics,issues};
}
function repair({notes,meter,duration,issue,seed=1}={}){
 if(!issue||!Number.isInteger(issue.bar)||issue.bar<0||!Number.isFinite(meter)||meter<=0||!Number.isFinite(duration)||duration<=0||!Array.isArray(notes))throw new TypeError('M6 requires a valid local issue');
 const before=assess({notes,meter,duration});
 const start=issue.bar*meter,end=Math.min(duration,start+meter);
 const output=notes.map(clone);let changed=0;
 if(issue.metric==='repetition'){
  const indices=output.map((n,i)=>({n,i})).filter(x=>x.n.voice==='lead'&&x.n.t>=start&&x.n.t<end).map(x=>x.i);
  if(indices.length>=3){
   const mid=indices[Math.floor(indices.length/2)],n=output[mid];
   const delta=((seed>>>0)&1)?2:-2;
   if(n.midi+delta>=48&&n.midi+delta<=84){n.midi+=delta;changed++;}
  }
 }else if(issue.metric==='voiceCollision'){
  const seen=new Set();
  for(const n of output){
   if(n.t<start||n.t>=end||n.voice!=='counter')continue;
   const k=key(n);
   if(seen.has(k)){
    // Re-voice an exact duplicate only onto an already sounding chord tone.
    // Otherwise leave it for manual review; an arbitrary semitone change is unsafe.
    const tones=output.filter(c=>c.voice==='chords'&&c.t<=n.t&&c.t+c.d>n.t)
      .map(c=>c.midi).filter(v=>Number.isInteger(v));
    const options=[...new Set(tones.flatMap(v=>[-12,0,12].map(o=>v+o)))]
      .filter(v=>v>=48&&v<=84&&v!==n.midi&&!seen.has(Math.round(n.t*1000)+':counter:'+v))
      .sort((a,b)=>Math.abs(a-n.midi)-Math.abs(b-n.midi)||a-b);
    if(options.length){n.midi=options[0];changed++;}
   }
   seen.add(key(n));
  }
 }
 const after=assess({notes:output,meter,duration});
 const sameOutside=notes.every((n,i)=>n.t>=start&&n.t<end||JSON.stringify(n)===JSON.stringify(output[i]));
 const oldCount=before.issues.filter(x=>x.bar===issue.bar&&x.metric===issue.metric).length;
 const newCount=after.issues.filter(x=>x.bar===issue.bar&&x.metric===issue.metric).length;
 const accepted=changed>0&&sameOutside&&newCount<oldCount;
 return {notes:accepted?output:notes.map(clone),accepted,changed:accepted?changed:0,bar:issue.bar,before,after:accepted?after:before,reason:accepted?'local metric improved without changing other bars':'candidate rejected: no verified local improvement'};
}
root.PlotuneM6Quality={assess,repair};
})(window);
