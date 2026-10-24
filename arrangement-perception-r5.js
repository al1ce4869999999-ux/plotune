/* R5 symbolic arrangement diagnostics only: never alters notes, render or RNG. */
(function(root){'use strict';
const VERSION='r5.1';
const round=n=>Math.round(n*1e6)/1e6;
const clamp=n=>Math.max(0,Math.min(1,n));
const roles={lead:'foreground',counter:'foreground',chords:'support',arp:'support',bass:'bass',pad:'support',sparkle:'ornament',drums:'percussion'};
function evaluate(score,plan={},context={}){
 const duration=Number(score?.duration),notes=score?.notes;
 if(!Array.isArray(notes)||!Number.isFinite(duration)||duration<=0)
  return {version:VERSION,status:'fallback',kind:'symbolic-proxy',metrics:{},windows:[],diagnostics:[{code:'INVALID_SCORE',reason:'finite positive duration and notes required'}]};
 const valid=[],invalid=[];
 for(let i=0;i<notes.length;i++){
  const n=notes[i];
  if(!n||![n.t,n.d,n.midi,n.volume].every(v=>typeof v==='number'&&Number.isFinite(v))||n.d<=0||n.t<0||n.t>=duration||typeof n.voice!=='string'){
   invalid.push(i);continue;
  }
  if(n.volume>0)valid.push({...n,d:Math.min(n.d,duration-n.t),index:i,role:n.role||roles[n.voice]||'unknown'});
 }
 const meter=Number(context.meter)|| (Number.isFinite(score.bpm)&&score.bpm>0?240/score.bpm:Math.min(4,duration));
 const bars=Math.max(1,Math.ceil(duration/meter));
 const arc=['opening','development','climax','resolution'];
 const windows=[];
 const sample=(start,end,unit,section)=>{
  const involved=valid.filter(n=>n.t<end&&n.t+n.d>start);
  const attacks=involved.filter(n=>n.t>=start&&n.t<end);
  const voices=[...new Set(involved.map(n=>n.voice))].sort();
  const foreground=involved.filter(n=>n.role==='foreground'||n.voice==='lead');
  let overlap=0,simultaneous=0,conflict=0,pairs=0,blended=0;
  const evidence=[];
  for(let i=0;i<involved.length;i++)for(let j=i+1;j<involved.length;j++){
   const a=involved[i],b=involved[j];
   if(a.voice===b.voice)continue;
   const concurrent=Math.max(0,Math.min(a.t+a.d,b.t+b.d,end)-Math.max(a.t,b.t,start));
   if(concurrent<=0)continue;
   pairs++;
   const register=Math.abs(a.midi-b.midi)<=7;
   const onset=Math.abs(a.t-b.t)<=.035;
   if(register)overlap++;
   if(onset)simultaneous++;
   const dominant=(a.voice==='lead'||b.voice==='lead'||a.role==='foreground'||b.role==='foreground');
   const nearVolume=Math.abs(a.volume-b.volume)<=Math.max(.025,Math.max(a.volume,b.volume)*.35);
   if(register&&dominant&&nearVolume)conflict++;
   if(register&&onset&&nearVolume)blended++;
   if(evidence.length<12&&(register||onset))evidence.push({indices:[a.index,b.index],voices:[a.voice,b.voice],semitones:Math.abs(a.midi-b.midi),overlapSeconds:round(concurrent),sameOnset:onset,similarVolume:nearVolume});
  }
  const segments=[start,end,...involved.flatMap(n=>[Math.max(start,n.t),Math.min(end,n.t+n.d)])].sort((a,b)=>a-b);
  let weightedVoices=0;
  for(let i=1;i<segments.length;i++){const at=(segments[i-1]+segments[i])/2;const active=new Set(involved.filter(n=>n.t<=at&&n.t+n.d>at).map(n=>n.voice));weightedVoices+=active.size*(segments[i]-segments[i-1]);}
  const density=attacks.length/(end-start);
  const features={events:involved.length,attacks:attacks.length,voices,foregroundVoices:[...new Set(foreground.map(n=>n.voice))].sort(),invalidNotes:invalid.length};
  const metrics={registerOverlap:round(pairs?overlap/pairs:0),simultaneousOnset:round(pairs?simultaneous/pairs:0),activeVoiceCount:round(weightedVoices/(end-start)),noteDensity:round(density),roleConflict:round(pairs?conflict/pairs:0),foregroundClarity:round(foreground.length?clamp(1-conflict/Math.max(1,foreground.length)):0),blendFit:round(pairs?blended/pairs:0),instrumentChangeDistance:0};
  return {unit,start:round(start),end:round(end),section,metrics,features,evidence,unavailable:[...(foreground.length?[]:['FOREGROUND_ABSENT']), 'SPECTRAL_MASKING_NOT_MEASURED','TIMBRE_FUSION_NOT_MEASURED']};
 };
 for(let b=0;b<bars;b++){const start=b*meter,end=Math.min(duration,(b+1)*meter);windows.push(sample(start,end,'bar',arc[Math.min(3,Math.floor((b+.5)/bars*4))]));}
 const sectionWindows=arc.map((section,i)=>sample(duration*i/4,duration*(i+1)/4,'section',section));
 const whole=sample(0,duration,'song','whole');
 const distance=(a,b)=>{const s=new Set(a.features.voices),t=new Set(b.features.voices);return round(new Set([...s,...t]).size? [...new Set([...s,...t])].filter(v=>s.has(v)!==t.has(v)).length/new Set([...s,...t]).size:0);};
 for(let i=1;i<windows.length;i++)windows[i].metrics.instrumentChangeDistance=distance(windows[i-1],windows[i]);
 for(let i=1;i<sectionWindows.length;i++)sectionWindows[i].metrics.instrumentChangeDistance=distance(sectionWindows[i-1],sectionWindows[i]);
 whole.metrics.instrumentChangeDistance=round(sectionWindows.slice(1).reduce((a,w)=>a+w.metrics.instrumentChangeDistance,0)/3);
 const entrances=windows.map((w,i)=>({bar:i+1,entered:i?[...w.features.voices].filter(v=>!windows[i-1].features.voices.includes(v)):w.features.voices,exited:i?windows[i-1].features.voices.filter(v=>!w.features.voices.includes(v)):[],foreground:w.features.foregroundVoices}));
 return {version:VERSION,status:invalid.length?'partial':'ok',kind:'symbolic-proxy',metrics:whole.metrics,windows,sections:sectionWindows,whole,entrances,diagnostics:invalid.map(index=>({code:'INVALID_NOTE',index})),limits:['Foreground clarity and blend fit are symbolic proxies, not listening judgments','No spectral masking or acoustic timbre similarity inferred'],featureFlag:'musicArrangementPerceptionR5'};
}
root.PlotuneArrangementPerceptionR5={VERSION,evaluate};
})(typeof window!=='undefined'?window:globalThis);
