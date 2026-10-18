/* Plotune procedural score renderer v2 — self-contained Web Audio/WAV, zero API calls */
(function(root){
'use strict';
const SR=22050, TAU=Math.PI*2;
const SCALES={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10]};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function rng(seed){let s=(seed>>>0)||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
function degreeNote(root,scale,degree){let oct=Math.floor(degree/7),i=((degree%7)+7)%7;return root+scale[i]+12*oct;}
function render(plan){
 const {duration,bpm,genre,mode,seed,characterSeed,progression,sections,root:rootNote}=plan;
 const scale=SCALES[mode],N=Math.ceil((duration+.15)*SR),out=new Float32Array(N);
 const r=rng(seed),motifR=rng(characterSeed),eighth=30/bpm,bar=eighth*8;
 const theme=Array.from({length:8},(_,i)=>i===7?0:Math.floor(motifR()*7));
 const interval=Array.from({length:8},(_,i)=>i%2?0:motifR()>.72?7:0);
 const variation=r(),bright=genre==='chip'||genre==='pop';
 // Resonare-derived events are cues, not inferred emotions: preserve the
 // original theme and harmony, modifying only specific musical gestures.
 const cues=new Map();
 const eventList=(plan.resonare&&Array.isArray(plan.resonare.events))?plan.resonare.events:[];
 for(const event of eventList){
  const at=clamp(Math.round(event.position*duration/eighth),0,Math.ceil(duration/eighth)-1);
  const existing=cues.get(at);
  if(!existing||event.tension>existing.tension||event.cue==='recovery')cues.set(at,event);
 }
 const color={chip:'chip',pop:'pluck',piano:'piano',fantasy:'bell',ambient:'flute',horror:'ghost'}[genre]||'pluck';
 function env(x,d,attack,release){return Math.min(1,x/attack,Math.max(0,(d-x)/release));}
 function oscillator(type,phase,x){
  const p=phase-Math.floor(phase);
  switch(type){
   case 'chip': return (p<.5?1:-1)*.60+Math.sin(phase*TAU)*.14;
   case 'pluck': return Math.sin(phase*TAU)*.67+Math.sin(phase*TAU*2)*.20+Math.sin(phase*TAU*3)*.08;
   case 'piano': return Math.sin(phase*TAU)*.64+Math.sin(phase*TAU*2)*.24+Math.sin(phase*TAU*3)*.08;
   case 'bell': return Math.sin(phase*TAU)*.60+Math.sin(phase*TAU*2.01)*.18+Math.sin(phase*TAU*3.97)*.10;
   case 'flute':return Math.sin(phase*TAU)*.85+Math.sin(phase*TAU*2)*.08;
   case 'ghost':return Math.sin(phase*TAU)*.60+Math.sin(phase*TAU*1.006)*.30;
   case 'bass':return Math.sin(phase*TAU)*.70+Math.sin(phase*TAU*2)*.13;
   case 'pad':return Math.sin(phase*TAU)*.56+Math.sin(phase*TAU*.997)*.23;
   default:return Math.sin(phase*TAU);
  }
 }
 function addNote(time,durationSeconds,midi,volume,type){
  if(time<0||time>=duration||durationSeconds<=0)return;
  const start=Math.round(time*SR),d=Math.min(durationSeconds,duration-time),count=Math.min(N-start,Math.ceil(d*SR));
  const frequency=440*Math.pow(2,(midi-69)/12);
  const a=(type==='pad'||type==='ghost')?.12:type==='flute'?.028:.009;
  const release=type==='pad'?.3:type==='ghost'?.22:.065;
  const decay=type==='piano'?1.5:type==='pluck'||type==='bell'?1.1:type==='bass'?.48:.12;
  for(let j=0;j<count;j++){
   const x=j/SR,e=env(x,d,a,release)*Math.exp(-x*decay);
   if(e<=0)continue;
   out[start+j]+=oscillator(type,frequency*x,x)*e*volume;
  }
 }
 function drum(t,type,level){
  if(t>=duration)return;
  const start=Math.floor(t*SR),size=Math.min(Math.floor((type==='kick'?.22:type==='snare'?.14:.052)*SR),N-start);
  for(let j=0;j<size;j++){
   const x=j/SR;
   const noise=r()*2-1;
   const v=type==='kick'?Math.sin(TAU*(70*x-60*x*x))*Math.exp(-x*28)*.50:
     type==='snare'?noise*Math.exp(-x*30)*.20:noise*Math.exp(-x*85)*.08;
   out[start+j]+=v*level;
  }
 }
 function section(t){return sections[Math.min(sections.length-1,Math.floor(t/duration*sections.length))];}
 for(let t=0,step=0;t<duration;step++,t=step*eighth){
  const measure=Math.floor(step/8),position=step%8,
    chordDegree=progression[measure%progression.length],
    seg=section(t),energy=clamp(.30+seg.intensity*.7,.25,.95),
    chord=[0,2,4].map(offset=>degreeNote(rootNote,scale,chordDegree+offset)),
    lastSection=t>duration-bar*1.05,
    heavy=(genre==='horror'),
    cue=cues.get(step);
  if(position===0){
    const level=heavy?.09:genre==='ambient'?.08:.11;
    const pad=(heavy||genre==='ambient'||genre==='fantasy')?'pad':genre==='piano'?'piano':'pluck';
    const length=Math.min(bar*.93,duration-t);
    chord.forEach((note,idx)=>addNote(t+idx*.016,Math.max(.04,length-idx*.016),note-12,level*(idx===0?1.15:.83),pad));
    addNote(t,Math.min(bar*.92,duration-t),chord[0]-24,.17*energy,'bass');
  }
  if(position===4&&!lastSection){
    addNote(t,Math.min(bar*.38,duration-t),chord[0]-24,.11*energy,'bass');
  }
  if(genre==='fantasy'||genre==='pop'||genre==='chip'){
    if(position%2===1&&seg.intensity>.25&&!lastSection) addNote(t,Math.min(eighth*.7,duration-t),chord[(position>>1)%3]+12,.048*energy,genre==='chip'?'chip':'bell');
  }
  const rhythmic=position===0||position===2||position===3||position===5||position===7;
  const silent=(cue&&cue.cue==='stumble')||(position===7&&measure%4===3)||(!rhythmic&&r()>.28);
  if(!silent){
   let deg=theme[position]+interval[position];
   if(position===0||position===4){
     const choices=[chordDegree,chordDegree+2,chordDegree+4];
     deg=choices.reduce((a,b)=>Math.abs(b-deg)<Math.abs(a-deg)?b:a,choices[0]);
   }
   if(measure%4===3&&position>=5)deg=position===7?0:Math.max(0,deg-1);
   if(variation>.6&&measure%4===2&&position===3)deg+=2;
   if(heavy&&position%2)deg=Math.max(0,deg-1);
   const note=degreeNote(rootNote,scale,deg)+((genre==='piano'||genre==='ambient')?-12:0);
   const length=position===7?eighth*1.4:eighth*(genre==='ambient'?1.85:position%2===0?1.5:.80);
   addNote(t,Math.min(length,duration-t),note,.12*energy*(position===0?1.17:1),color);
  }
  // The same character motif survives a stumble and returns after recovery.
  if(cue){
   const strength=clamp(.50+cue.deltaPsi*.5,.45,1);
   if(cue.cue==='stumble'){
    const note=degreeNote(rootNote,scale,4);
    addNote(t,eighth*.43,note,.18*strength,color);
    addNote(t+eighth*.40,eighth*.43,note-3,.15*strength,color);
   }else if(cue.cue==='recovery'){
    addNote(t,eighth*.9,degreeNote(rootNote,scale,0)+12,.17*strength,'bell');
    addNote(t+eighth*.9,eighth*.75,degreeNote(rootNote,scale,theme[1])+12,.12*strength,color);
   }else if(cue.cue==='success'){
    addNote(t,eighth*.75,degreeNote(rootNote,scale,4)+12,.12*strength,'bell');
   }else if(cue.cue==='danger'||cue.cue==='loss'){
    addNote(t,eighth*1.45,degreeNote(rootNote,scale,1)-12,.16*strength,'ghost');
   }else if(cue.cue==='turn'){
    addNote(t,eighth*.43,degreeNote(rootNote,scale,5),.10*strength,'pluck');
   }else if(cue.cue==='anticipation'){
    addNote(t,eighth*.9,degreeNote(rootNote,scale,4),.10*strength,'bell');
   }
  }
  if(!lastSection&&['chip','pop','fantasy'].includes(genre)){
   if(position===0||position===4)drum(t,'kick',energy);
   if(position===2||position===6)drum(t,'snare',energy);
   if(position%2===1&&seg.intensity>.35)drum(t,'hat',energy*.75);
  }else if(heavy&&position===0&&measure%2===0)drum(t,'kick',energy*.24);
 }
 // Gentle, cheap room echo: avoid an abrupt dry, synthetic sound.
 const d1=Math.round(SR*.145),d2=Math.round(SR*.285);
 for(let i=N-1;i>=0;i--){
  out[i]+=((i>=d1?out[i-d1]*.105:0)+(i>=d2?out[i-d2]*.065:0));
 }
 let peak=0;
 for(let i=0;i<N;i++)peak=Math.max(peak,Math.abs(out[i]));
 const gain=Math.min(1.35,.88/Math.max(.1,peak));
 for(let i=0;i<N;i++){
  const fade=Math.min(1,(duration-i/SR)/.28);
  out[i]=Math.tanh(out[i]*gain)*Math.max(0,fade);
 }
 return {samples:out,sampleRate:SR,details:{theme,genre,mode,bpm,sections,cues:[...cues.values()].map(c=>c.cue)}};
}
function wavBlob(samples,sampleRate=SR){
 const bytes=new ArrayBuffer(44+samples.length*2),v=new DataView(bytes);
 const str=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};
 str(0,'RIFF');v.setUint32(4,36+samples.length*2,true);str(8,'WAVE');
 str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
 v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
 str(36,'data');v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,Math.round(clamp(samples[i],-1,1)*32767),true);
 return new Blob([bytes],{type:'audio/wav'});
}
root.PlotuneComposer={render,wavBlob};
})(window);
