/* Plotune 0.5 — zero-API three-piece instrumental band
   ONE guitar, ONE bass, ONE drum kit. No vocals or downloaded samples.
   Score is inspectable, deterministic, and compatible with Plotune A/B.
   The clean/crunch/distorted tones approximate a band using a lightweight
   plucked-string feedback model, amp coloration and synthesized drum kit.
*/
(function(root){
'use strict';
const SR=22050, TWOPI=2*Math.PI;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const SCALE={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10]};
const STYLES={
 indie:{name:'インディーロック',bpm:118,drive:1.4,attack:.58,hat:1,brightness:.75,loose:.014},
 rock:{name:'ギターロック',bpm:138,drive:3.2,attack:.89,hat:.9,brightness:.90,loose:.009},
 punk:{name:'疾走パンク',bpm:171,drive:4.2,attack:1,hat:1.25,brightness:.93,loose:.005},
 ballad:{name:'バンドバラード',bpm:81,drive:1.05,attack:.48,hat:.70,brightness:.65,loose:.019}
};
function rng(seed){let state=(seed>>>0)||1;return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};}
function pitch(root,scale,index){
 const oct=Math.floor(index/7),idx=((index%7)+7)%7;
 return root+12*oct+scale[idx];
}
function chooseStyle(input){return STYLES[input] ? input : 'indie';}
function adaptPlan(plan,style){
 const preset=STYLES[chooseStyle(style)];
 return {...plan,genre:'band',bandStyle:chooseStyle(style),bpm:preset.bpm,
   // independent of genre: same key, seeded motif, and narrative cue track
   root:plan.root||60};
}
function score(plan){
 const style=chooseStyle(plan.bandStyle),p=STYLES[style],key=SCALE[plan.mode]||SCALE.major;
 const duration=clamp(+plan.duration||30,1,65),bpm=clamp(+plan.bpm||p.bpm,65,190);
 const eighth=30/bpm,totalSteps=Math.ceil(duration/eighth),bar=eighth*8;
 const rand=rng(plan.seed),character=rng(plan.characterSeed);
 const mainRiff=Array.from({length:8},(_,i)=>i===7?0:Math.floor(character()*6));
 const values=Array.from({length:4},()=>character());
 const notes=[],percussion=[],rests=[],harmony=[];
 const events=plan.resonare&&Array.isArray(plan.resonare.events)?plan.resonare.events:[];
 const cues=events.filter(e=>e.cue&&e.cue!=='neutral').map(e=>({
   ...e,step:clamp(Math.round(clamp(+e.position)*totalSteps),0,totalSteps-1)
 })).sort((a,b)=>a.step-b.step);
 const usesResonare=!!plan.resonare;
 // Events extend over a bar: one sentence changes a PHRASE, not only one sample.
 function state(step){
  if(!usesResonare)return null;
  let current=null;
  for(const event of cues)if(event.step<=step)current=event;else break;
  if(!current||step-current.step>=8)return null;
  return {...current,age:step-current.step};
 }
 const arr={indie:[.29,.61,1,.44],rock:[.48,.69,1,.53],punk:[.66,.82,1,.72],ballad:[.16,.42,.83,.31]}[style];
 function section(t){
  const frac=t/duration,index=frac<.16?0:frac<.51?1:frac<.85?2:3;
  let intensity=arr[index],st=state(Math.floor(t/eighth));
  // Narrative expectation modulates density without eliminating song form.
  if(st&&['danger','loss','stumble'].includes(st.cue))intensity*=.40;
  if(st&&['recovery','success'].includes(st.cue))intensity=Math.min(1,intensity+.2);
  return {index,name:['Intro','Verse','Chorus','Outro'][index],intensity};
 }
 function note(t,d,midi,v,instrument,articulation,role,group){
  if(t>=duration||t<0||d<=.018)return;
  const capped=Math.min(d,duration-t);
  if(capped<=.018)return;
  notes.push({t,d:capped,midi:clamp(midi,28,88),v:clamp(v,0,.7),
    instrument,articulation,role,group});
 }
 function drum(t,kind,v){if(t>=0&&t<duration)percussion.push({t,kind,v:clamp(v,0,1)})}
 function mutedAt(t){return rests.some(r=>t>=r.start&&t<r.end)}
 for(const e of cues){
  if(e.cue==='stumble'||e.cue==='turn'&&e.tension>.45){
   const start=e.step*eighth+eighth*.28;
   rests.push({start,end:Math.min(duration,start+(e.cue==='stumble'?.86:.38)*eighth),cue:e.cue});
  }
 }
 let shiftedChords=0,choirs=new Set(),bandSections=new Set(),cueHits=0;
 let lastChord=null;
 const root=plan.root||60,progression=plan.progression&&plan.progression.length?plan.progression:[0,5,3,4];
 const chorusProg=style==='ballad'?[0,3,4,5]:[0,4,5,3];
 for(let i=0;i<totalSteps;i++){
  const t=i*eighth,beat=i%8,barNum=Math.floor(i/8),part=section(t),s=state(i);
  bandSections.add(part.name);
  const cue=s&&s.cue,down=cue==='danger'||cue==='loss'||cue==='stumble';
  const lift=cue==='recovery'||cue==='success';
  // In the hook, chord sequence changes even when narrative analysis is off.
  let chord=(part.index===2?chorusProg:progression)[barNum%4]%7;
  if(down){chord=(chord+5)%7;shiftedChords++;}
  if(lift){chord=(s.age<4?4:0);shiftedChords++;}
  if(chord!==lastChord&&i%4===0)harmony.push({t,degree:chord,section:part.name,cue:cue||'neutral'});
  lastChord=chord;
  const degreeRoot=pitch(root,key,chord)-12; // guitar C3-C5 depending key
  const noteRoot=clamp(degreeRoot,43,67),bassRoot=noteRoot-12;
  const attack=part.intensity,chorus=part.index===2,quiet=part.index===0&&style==='ballad';
  let strum=false;
  if(style==='punk')strum=beat%2===0;
  else if(style==='ballad')strum=beat===0||beat===4||chorus&&beat===6;
  else if(chorus)strum=beat===0||beat===2||beat===4||beat===6||beat===7;
  else strum=beat===0||beat===3||beat===4||beat===6;
  if(down)strum=beat===0||beat===4;
  if(lift)strum=beat===0||beat===2||beat===4||beat===6;
  if(strum&&!mutedAt(t)){
   const pattern=style==='punk'?'power':style==='ballad'?'open':style==='indie'?'open':'power';
   // Three or four individual strings, lightly delayed like a pick across guitar.
   const pitches=pattern==='power'?[0,7,12]:[0,(plan.mode==='minor'?3:4),7,12];
   const palm=!chorus&&(style==='punk'||style==='rock')&&beat!==0&&!lift;
   const articulation=palm?'mute':chorus?'open':quiet?'gentle':'normal';
   const sustain=palm?.19:chorus?.60:style==='ballad'?1.25:.43;
   const emphasis=beat===0||beat===4?1:.73;
   const volume=(.067+attack*.055)*emphasis*(down?.61:lift?1.25:1)*p.attack;
   pitches.forEach((interval,k)=>{
    const jitter=(rand()-.5)*p.loose;
    note(Math.max(.001,t+k*(style==='punk'?.007:.012)+jitter),
       sustain,noteRoot+interval,volume*(k===0?1:.88),
       'guitar',articulation,'chord','guitar');
   });
   choirs.add(articulation);
  }
  // One guitarist: little fills in gaps rather than a permanent second lead.
  if(!strum&&beat%2===1&&part.index!==0&&!down&&!mutedAt(t)){
   if(chorus||rand()>.45){
    const degreeValue=mainRiff[beat] + (lift?2:0);
    note(t,eighth*(chorus?.60:.45),pitch(root,key,degreeValue)+
      (style==='ballad'?-12:0),.064*attack,
      'guitar','lead','riff','guitar');
   }
  }
  if(i%2===0&&!mutedAt(t)){
   const movement=(style==='punk'||chorus)?[0,0,7,12][(beat/2)%4]:
      style==='ballad'?[0,0,7,0][(beat/2)%4]:[0,7,12,7][(beat/2)%4];
   const next=(part.index===2?chorusProg:progression)[(barNum+1)%4]%7;
   const walking=beat===6&&style==='indie'?pitch(root,key,next)-12:0;
   const bassMidi=walking||bassRoot+movement;
   const bassLen=eighth*(style==='ballad'?2.5:style==='punk'?1.25:1.75);
   note(t,bassLen,bassMidi,.16*(.6+attack*.5)*(down?.74:1),
     'bass',beat===0?'accent':'normal','bass','bass');
  }
  // Acoustic kit: closed hats, real backbeat, crash cymbal, occasional fills.
  if(!mutedAt(t)){
   if(beat%2===0||style==='punk')drum(t,'hat',(.15+.29*attack)*p.hat*(down?.38:1));
   if(chorus&&beat%2===1&&style!=='ballad')drum(t,'hat',.12+.20*attack);
   if(beat===0||beat===4||chorus&&beat===6||style==='punk'&&beat===2)
       drum(t,'kick',(.45+.45*attack)*(down?.72:1));
   if((beat===2||beat===6)&&!down)drum(t,'snare',(.35+.48*attack));
   if((beat===2||beat===6)&&down&&style!=='ballad')drum(t,'sidestick',.22);
   if((beat===0&&chorus)||(s&&s.age===0&&(lift||cue==='turn')))
       drum(t,'crash',chorus?.69:.53);
   if(beat>=6&&part.index===2&&barNum%4===3&&style!=='ballad')
       drum(t,'tom',.37);
  }
  if(s&&s.age===0){cueHits++;
   if(s.cue==='stumble')drum(t,'tom',.72);
   if(s.cue==='danger')drum(t,'crash',.43);
  }
 }
 // Full-band terminal cadence when music is still active.
 const lastPart=section(Math.max(0,duration-eighth));
 const tail=Math.max(0,duration-eighth*2);
 if(!mutedAt(tail)&&lastPart.intensity>.24){
  const first=pitch(root,key,0)-12;
  for(const interval of [0,7,12]){
   note(tail,Math.min(duration-tail,eighth*1.8),first+interval,.063,
     'guitar','open','ending','guitar');
  }
  note(tail,Math.min(duration-tail,eighth*1.9),first-12,.12,'bass','accent','ending','bass');
 }
 notes.sort((a,b)=>a.t-b.t);
 percussion.sort((a,b)=>a.t-b.t);
 const instruments=['guitar','bass','drums'];
 const roles={guitar:notes.filter(x=>x.instrument==='guitar').length,
              bass:notes.filter(x=>x.instrument==='bass').length,drums:percussion.length};
 const details={
  genre:'band',bandStyle:style,bandName:p.name,mode:plan.mode,bpm,
  instruments,roles,sections:[...bandSections],
  theme:mainRiff,melodyNotes:notes.filter(n=>n.role==='riff').length,
  accompanimentNotes:notes.filter(n=>n.instrument==='guitar'&&n.role==='chord').length,
  bassNotes:roles.bass,percussionHits:percussion.length,
  breaks:rests.length,shiftedChords,cueHits,
  harmonyChanges:harmony.length,
  palette:{guitar:roles.guitar,bass:roles.bass,drums:roles.drums},
  rests,events:cues.map(x=>({cue:x.cue,t:x.step*eighth,step:x.step})),
  harmonies:harmony.map(x=>({t:x.t,chord:x.degree,section:x.section}))
 };
 return {duration,bpm,sampleRate:SR,notes,percussion,rests,harmony,details};
}
function render(plan){
 const arrangement=score(plan),n=Math.ceil((arrangement.duration+.12)*SR);
 const output=new Float32Array(n),r=rng(plan.seed^0x4f13ab78);
 const config=STYLES[chooseStyle(plan.bandStyle)];
 function string(note){
  const start=Math.round(note.t*SR);
  if(start>=n)return;
  const freq=440*Math.pow(2,(note.midi-69)/12);
  const period=clamp(Math.round(SR/freq),22,450);
  const wave=new Float32Array(period);
  // Pick noise excites a damped string; avoids simple square-wave guitars.
  let prev=0;
  for(let j=0;j<period;j++){
   const raw=r()*2-1;
   prev=prev*.58+raw*.42;
   wave[j]=prev*(.72+.28*Math.sin(Math.PI*j/period));
  }
  const isBass=note.instrument==='bass';
  const palm=note.articulation==='mute';
  const decay=isBass?.992:palm?.932:note.articulation==='open'?.988:.980;
  const damping=isBass?.58:palm?.44:.52;
  const drive=isBass?1.1:config.drive;
  let last=0,filtered=0,dc=0;
  const length=Math.min(n-start,Math.round((note.d+(isBass?.085:.13))*SR));
  for(let i=0;i<length;i++){
   const ix=i%period;
   const next=wave[(ix+1)%period];
   const stringValue=wave[ix];
   wave[ix]=((1-damping)*stringValue+damping*next)*decay;
   const t=i/SR;
   const gate=Math.min(1,t/.004)*Math.min(1,(note.d+.07-t)/.09);
   if(gate<=0)continue;
   const raw=isBass?(stringValue*.68+Math.sin(TWOPI*freq*t)*.32):stringValue;
   const distorted=Math.tanh(raw*drive)/(Math.tanh(drive)||1);
   filtered=.36*distorted+.64*filtered;
   dc=.997*dc+.003*filtered;
   const hp=filtered-dc*.68;
   last=last*.12+hp*.88;
   const amp=note.v*(isBass?1.04:.91)*gate;
   output[start+i]+=last*amp;
  }
 }
 for(const note of arrangement.notes)string(note);
 function drums(hit){
  const start=Math.round(hit.t*SR);
  const secs=hit.kind==='crash'?.95:hit.kind==='hat'?.09:
      hit.kind==='kick'?.32:hit.kind==='tom'?.26:.18;
  const length=Math.min(n-start,Math.floor(secs*SR));
  let previous=0,previous2=0;
  for(let i=0;i<length;i++){
   const t=i/SR,no=r()*2-1;
   const hpf=no-previous*.8;
   previous=no;previous2=.85*previous2+.15*hpf;
   let value=0;
   switch(hit.kind){
    case 'kick':
     value=Math.sin(TWOPI*(84*t-80*t*t))*Math.exp(-t*27)*.84;
     break;
    case 'snare':
     value=(previous2*.7+Math.sin(TWOPI*183*t)*.16)*Math.exp(-t*23)*.59;
     break;
    case 'sidestick':
     value=previous2*Math.exp(-t*80)*.34;
     break;
    case 'hat':
     value=(hpf*.70+no*.17)*Math.exp(-t*48)*.28;
     break;
    case 'crash':
     value=(hpf*.51+no*.18)*Math.exp(-t*5.7)*.36;
     break;
    case 'tom':
     value=Math.sin(TWOPI*(135*t-72*t*t))*Math.exp(-t*17)*.58;
     break;
   }
   output[start+i]+=value*hit.v;
  }
 }
 for(const hit of arrangement.percussion)drums(hit);
 // Coordinated ensemble stop: mute TAILS, not merely future note onsets.
 for(const pause of arrangement.rests){
  const a=clamp(Math.round(pause.start*SR),0,n),b=clamp(Math.round(pause.end*SR),0,n);
  const smooth=Math.max(1,Math.round(SR*.009));
  for(let i=a;i<b;i++){
   const fade=clamp(Math.min((i-a)/smooth,(b-i)/smooth),0,1);
   output[i]*=1-.995*fade;
  }
 }
 // Small room reflections at controlled levels; mono export is portable on iOS.
 const one=Math.round(SR*.071),two=Math.round(SR*.139);
 for(let i=two;i<n;i++)output[i]+=.092*output[i-one]+.052*output[i-two];
 let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(output[i]));
 const gain=Math.min(2.1,.90/Math.max(.10,peak));
 for(let i=0;i<n;i++){
  const remain=clamp((arrangement.duration-i/SR)/.24,0,1);
  output[i]=Math.tanh(output[i]*gain)*remain;
 }
 return {samples:output,sampleRate:SR,details:arrangement.details,score:arrangement};
}
function wavBlob(samples,rate=SR){
 const arr=new ArrayBuffer(44+samples.length*2),view=new DataView(arr);
 function tag(p,t){for(let i=0;i<t.length;i++)view.setUint8(p+i,t.charCodeAt(i));}
 tag(0,'RIFF');view.setUint32(4,36+samples.length*2,true);
 tag(8,'WAVE');tag(12,'fmt ');view.setUint32(16,16,true);
 view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
 view.setUint16(32,2,true);view.setUint16(34,16,true);
 tag(36,'data');view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)view.setInt16(44+2*i,Math.round(clamp(samples[i],-1,1)*32767),true);
 return new Blob([arr],{type:'audio/wav'});
}
root.PlotuneBand={STYLES,adaptPlan,score,render,wavBlob};
})(window);
