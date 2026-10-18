/* Plotune v1.0: original handheld-era ensemble, zero API, mono 22.05 kHz.
 * Not a ROM soundfont or a reproduction of any commercial game music.
 * Seven independent parts: lead, counter melody, chords, arpeggio,
 * bass, percussion, sparkles/pads. Deterministic score and synthesizer.
 */
(function(root){
'use strict';
const SR=22050,TAU=2*Math.PI,clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const MAJOR=[0,2,4,5,7,9,11],MINOR=[0,2,3,5,7,8,10];
const STYLES={
 journey:{name:'冒険・フィールド',bpm:132,progression:[0,4,5,3],lead:'bright',bass:'walking',drums:'drive'},
 village:{name:'街・タウン',bpm:112,progression:[0,3,4,0],lead:'warm',bass:'bounce',drums:'soft'},
 mischief:{name:'コミカル・ドタバタ',bpm:146,progression:[0,4,3,4],lead:'reed',bass:'bounce',drums:'shuffle'},
 mystery:{name:'ふしぎ・探索',bpm:98,progression:[5,3,1,4],lead:'glass',bass:'pulse',drums:'light'}
};
function random(seed){let x=(seed>>>0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function midi(root,scale,index){return root+scale[((index%7)+7)%7]+12*Math.floor(index/7);}
function prepare(plan,style,appraisal=null,reactive=false){
 const type=STYLES[style]?style:'journey';
 const knowledge=root.PlotuneLoop?.analyzeWhole(appraisal);
 return {...plan,genre:'game',gameStyle:type,loopMode:true,
  loopArrangement:reactive&&knowledge?.active?knowledge:null};
}
function score(plan){
 const game=STYLES[plan.gameStyle]||STYLES.journey;
 const duration=[15,30,60].includes(Number(plan.duration))?Number(plan.duration):30;
 const bars=Math.max(1,Math.round(game.bpm*duration/240));
 const bpm=bars*240/duration,step=duration/(bars*16),steps=bars*16;
 const scale=plan.mode==='minor'?MINOR:MAJOR,tonic=plan.root||60;
 const concept=plan.loopArrangement,kind=concept?.preset||null,transform=!!concept?.active;
 // Distinct global harmony from the FIRST measure when story supports it.
 const base=game.progression,change=transform?(concept.progression||base):base;
 const prog=change.map((v,i)=>((v+(kind==='mystery'?1:0))%7+7)%7);
 const meter=step*16,seed=plan.seed>>>0;
 const themeRand=random(plan.characterSeed>>>0);
 const motif=[0,2,4,2,3,5,4,1].map((x,i)=>x+(themeRand()>.6?(i%3===0?2:1):0));
 const notes=[],drums=[],rests=[],harmony=[];
 const voices={lead:0,counter:0,chords:0,arp:0,bass:0,sparkle:0,pad:0,drums:0};
 const roleLimits={lead:850,counter:390,chords:850,arp:700,bass:480,sparkle:180,pad:100};
 const count={};
 function add(t,d,n,voice,v){
  if(t<0||t>=duration||d<=.018||!Number.isFinite(n))return;
  count[voice]=(count[voice]||0)+1;if(count[voice]>roleLimits[voice])return;
  notes.push({t,d:Math.min(d,duration-t),midi:clamp(n,24,105),
    voice,role:voice,volume:clamp(v,0,.26)});
  voices[voice]++;
 }
 function drum(t,name,v){
  if(t<0||t>=duration)return;
  drums.push({t,kind:name,volume:clamp(v,0,1)});voices.drums++;
 }
 function chordAt(b){return prog[b%4];}
 const leadTone=game.lead;
 const leadRoot=tonic+12;
 // Repeat 4-bar thematic material; vary density and fills but keep a looping identity.
 for(let b=0;b<bars;b++){
  const chord=chordAt(b),next=chordAt((b+1)%bars),barAt=b*meter;
  harmony.push({t:barAt,chord});
  const section=b%4;
  const lift=b%8===4||kind==='bright';
  const energy=clamp((section===2?1.08:section===3?.87:1)*(kind==='tense'?.76:kind==='effort'?1.12:1),.5,1.2);
  const isLast=b===bars-1;
  // Baseline original chord voicings, game ensemble uses bright, close four notes.
  for(const d of [0,2,4,6])add(barAt,step*15.2,midi(tonic,scale,chord+d)-12,'pad',.016*energy);
  for(let i=0;i<16;i++){
   const t=barAt+i*step,beat=i%4,on=i%8;
   // Main tune is a recognizable independent melody, not one-off sound effects.
   const melodyIndex=motif[(i+section*2)%8]+(section===2?2:0)+
       (kind==='bright'&&i>=8?2:0);
   const leadPattern=kind==='tense'?(i%4===0||i%8===6):
      kind==='effort'?(i%2===0||i%8===7):
      kind==='playful'?(i%3!==0):i%2===0||i%8===3;
   if(leadPattern){
    const rootDegree=(i%8===0||i%8===6)?chord:melodyIndex;
    add(t,step*(kind==='tense'?2.8:1.55),
      midi(leadRoot,scale,rootDegree),
      'lead',.125*energy);
   }
   // Counterpoint answers primary melody in a different octave.
   if((i===3||i===7||i===11||i===15)&&!isLast||i===3||i===11){
    const response=motif[(i+3)%8]+(kind==='effort'?1:0);
    add(t,step*1.75,midi(tonic+12,scale,response-2),
     'counter',.046*energy);
   }
   // Layered keyboard chord stabs, routed separately from lush pad.
   let chordHit=i===0||i===8||(kind==='playful'?i===4||i===12:
       kind==='bright'?i===4||i===10:i===12);
   if(kind==='tense')chordHit=i===0||i===8;
   if(chordHit){
    const dur=step*(kind==='tense'?4:3.2);
    [0,2,4].forEach((degree,j)=>add(t+step*.045*j,dur,
      midi(tonic,scale,chord+degree),'chords',.042*energy));
   }
   // Independent fast arpeggiator; alternates with chord stabs.
   if(i%2===1 || kind==='effort'&&i%2===0 || kind==='playful'&&i%3===0){
    const arpDegree=chord+[0,2,4,6,4,2,0,4][Math.floor(i/2)%8];
    add(t,step*(kind==='tense'?2:1.25),
      midi(tonic+12,scale,arpDegree),'arp',.028*energy);
   }
   // Bass line is independent and changes its rhythmic intent with the story.
   if(i%4===0||kind==='effort'&&i%4===2||kind==='playful'&&i%4===3){
    const bassDegree=kind==='tense'?chord:
      kind==='effort'?chord+(i%8>=4?4:0):
      kind==='playful'?chord+[0,4,2,4][Math.floor(i/4)%4]:
      chord+(i===12?4:0);
    add(t,step*(kind==='tense'?4:2.8),
      midi(tonic-24,scale,bassDegree),'bass',.11*energy);
   }
   // Handheld-like acoustic/electronic hybrid kit; cymbals have their own texture.
   if(i%2===0)drum(t,'hat',.19*energy);
   if((i===0||i===8||kind==='effort'&&(i===6||i===14))&&kind!=='tense')
     drum(t,'kick',.48*energy);
   if(kind==='tense'&&i===0)drum(t,'kick',.41);
   if((i===4||i===12)&&kind!=='tense')drum(t,'snare',.45*energy);
   if(kind==='tense'&&i===8)drum(t,'rim',.27);
   if(kind==='playful'&&(i===7||i===15))drum(t,'rim',.31);
   if((i===0&&section===2&&!isLast))drum(t,'crash',.39);
   // Glitter is short and rare; it must not mask the lead.
   if(i===3||i===11&&lift)add(t,step*3.1,midi(tonic+24,scale,chord+4),
      'sparkle',.028*energy);
  }
  // Soft pickup to the next loop avoids terminal success cadence.
  if(isLast)add(barAt+14*step,step*1.7,midi(tonic+12,scale,next),'counter',.034);
 }
 const details={
  genre:'game',gameStyle:plan.gameStyle||'journey',gameName:game.name,
  loopMode:true,loopBars:bars,bpm,theme:motif,parts:voices,
  globalArrangement:transform?{preset:kind,label:concept.label,reason:concept.reason}:null,
  instruments:Object.keys(voices),palette:voices,
  melodyNotes:voices.lead,counterMelodyNotes:voices.counter,
  accompanimentNotes:voices.chords+voices.pad+voices.arp,
  bassNotes:voices.bass,percussionHits:voices.drums,
  breaks:0,shiftedChords:transform?bars:0,cueHits:transform?1:0,
  harmonyChanges:harmony.length,rests,events:[],harmonies:harmony
 };
 return {notes,drums,rests,harmony,theme:motif,details,genre:'game',
  duration,bpm,sampleRate:SR};
}
function render(plan){
 const s=score(plan),N=Math.round(s.duration*SR),out=new Float32Array(N);
 const leadTone=STYLES[plan.gameStyle]?.lead||'bright';
 function wave(voice,phase){
  const x=phase-Math.floor(phase),sin=Math.sin(TAU*phase),sin2=Math.sin(TAU*phase*2);
  switch(voice){
   case 'lead':return leadTone==='reed'?.66*(x<.5?1:-1)+.24*sin:
     leadTone==='glass'?.70*sin+.25*Math.sin(TAU*phase*2.004):
     leadTone==='warm'?.67*sin+.21*sin2+.08*Math.sin(TAU*phase*3):
     .45*(x<.5?1:-1)+.33*sin+.11*sin2;
   case 'counter':return .66*sin+.22*sin2+.07*Math.sin(TAU*phase*3);
   case 'chords':return .47*sin+.27*sin2+.16*Math.sin(TAU*phase*3);
   case 'arp':return .62*sin+.24*Math.sin(TAU*phase*2.012)+.12*Math.sin(TAU*phase*4.01);
   case 'pad':return .59*sin+.24*Math.sin(TAU*phase*.998);
   case 'bass':return .77*sin+.20*sin2;
   case 'sparkle':return .70*sin+.22*Math.sin(TAU*phase*2.01)+.08*Math.sin(TAU*phase*4.02);
  }
  return sin;
 }
 // Keep event generation deterministic and stable across A/B.
 for(const n of s.notes){
  const start=Math.floor(n.t*SR),length=Math.min(N-start,Math.floor(n.d*SR));
  const freq=440*Math.pow(2,(n.midi-69)/12),attack=n.voice==='pad'?.08:.007;
  const release=n.voice==='pad'?.23:n.voice==='sparkle'?.17:.08;
  const decay=n.voice==='pad'?.12:n.voice==='arp'?.9:n.voice==='sparkle'?1.8:.34;
  let phase=0,prev=0;
  for(let i=0;i<length;i++){
   const x=i/SR,env=Math.min(1,x/attack,(n.d-x)/release)*Math.exp(-decay*x);
   phase+=freq/SR;
   let y=wave(n.voice,phase);
   // One-pole filter emulates a small sample-ROM / FM-style mellowing.
   const smoothing=n.voice==='chords'?.50:n.voice==='pad'?.28:.74;
   prev=prev*(1-smoothing)+y*smoothing;
   out[start+i]+=prev*n.volume*clamp(env,0,1);
  }
 }
 const r=random((plan.seed^0x7ca1f3d2)>>>0);
 for(const hit of s.drums){
  const start=Math.floor(hit.t*SR),len=Math.min(N-start,Math.floor(
   SR*(hit.kind==='crash'?.42:hit.kind==='hat'?.065:.18)));
  let h=0;
  for(let i=0;i<len;i++){
   const x=i/SR,z=r()*2-1;h=.79*h+.21*z;
   const noise=z-h;
   const val=hit.kind==='hat'?noise*Math.exp(-x*77)*.22:
    hit.kind==='crash'?noise*Math.exp(-x*9)*.22:
    hit.kind==='kick'?Math.sin(TAU*(87*x-90*x*x))*Math.exp(-x*31)*.40:
    hit.kind==='snare'?(noise*.70+Math.sin(TAU*198*x)*.1)*Math.exp(-x*24)*.29:
    noise*Math.exp(-x*46)*.22;
   out[start+i]+=val*hit.volume;
  }
 }
 // A single delay makes the counter/lead/chord layers sound cohesive.
 const d1=Math.floor(.093*SR),d2=Math.floor(.17*SR);
 for(let i=d2;i<N;i++)out[i]+=.058*out[i-d1]+.03*out[i-d2];
 let peak=0;
 for(let i=0;i<N;i++)peak=Math.max(peak,Math.abs(out[i]));
 const gain=Math.min(2.4,.79/Math.max(peak,.11));
 for(let i=0;i<N;i++)out[i]=Math.tanh(out[i]*gain);
 // Lapped window at playback boundary; align final sample to exact loop start.
 const span=Math.min(1600,Math.floor(N/50));
 for(let i=0;i<span;i++){
  const a=(i+1)/span;
  out[N-span+i]=out[N-span+i]*(1-a)+out[i]*a;
 }
 const guard=Math.min(170,Math.floor(span/3));
 for(let i=0;i<guard;i++){
  const a=(i+1)/guard,j=N-guard+i;
  out[j]=out[j]*(1-a)+out[0]*a;
 }
 return {samples:out,sampleRate:SR,score:s,details:s.details};
}
function wavBlob(samples,rate=SR){
 const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);
 function str(i,s){for(let j=0;j<s.length;j++)v.setUint8(i+j,s.charCodeAt(j));}
 str(0,'RIFF');v.setUint32(4,36+samples.length*2,true);
 str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);
 v.setUint16(20,1,true);v.setUint16(22,1,true);
 v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);
 v.setUint16(32,2,true);v.setUint16(34,16,true);
 str(36,'data');v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,Math.round(clamp(samples[i],-1,1)*32767),true);
 return new Blob([buffer],{type:'audio/wav'});
}
root.PlotuneHandheld={STYLES,prepare,score,render,wavBlob};
})(window);
