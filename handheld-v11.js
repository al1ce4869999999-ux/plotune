/* Plotune v1.1: 30 plot-driven, emotionally expressive handheld ensemble, zero API, mono 22.05 kHz.
 * Not a ROM soundfont or a reproduction of any commercial game music.
 * Seven independent parts: lead, counter melody, chords, arpeggio,
 * bass, percussion, sparkles/pads. Deterministic score and synthesizer.
 */
(function(root){
'use strict';
const SR=22050,TAU=2*Math.PI,clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const MAJOR=[0,2,4,5,7,9,11],MINOR=[0,2,3,5,7,8,10];
const STYLES={
 journey:{name:'冒険・フィールド',bpm:132,progression:[0,4,5,3],lead:'bright',bass:'walking',drums:'drive',mode:'major',density:0.88,arpEvery:1,intensity:1,shape:'field'},
 village:{name:'街・タウン',bpm:112,progression:[0,3,4,0],lead:'warm',bass:'bounce',drums:'soft',mode:'major',density:0.66,arpEvery:2,intensity:0.76,shape:'gentle'},
 mischief:{name:'コミカル・ドタバタ',bpm:146,progression:[0,4,3,4],lead:'reed',bass:'bounce',drums:'shuffle',mode:'major',density:1.05,arpEvery:1,intensity:1.1,shape:'bounce'},
 mystery:{name:'ふしぎ・探索',bpm:98,progression:[5,3,1,4],lead:'glass',bass:'pulse',drums:'light',mode:'minor',density:0.58,arpEvery:2,intensity:0.76,shape:'mystery'},
 joy:{name:'喜・うれしい！',bpm:144,progression:[0,4,3,4],lead:'bright',bass:'bounce',drums:'festival',mode:'major',density:1.1,arpEvery:1,intensity:1.2,shape:'jump'},
 anger:{name:'怒・ぷんぷん！',bpm:156,progression:[5,4,5,1],lead:'reed',bass:'pulse',drums:'heavy',mode:'minor',density:0.91,arpEvery:2,intensity:1.19,shape:'stomp'},
 sadness:{name:'哀・しょんぼり',bpm:76,progression:[5,3,1,4],lead:'warm',bass:'sustain',drums:'ballad',mode:'minor',density:0.42,arpEvery:4,intensity:0.7,shape:'sigh'},
 fun:{name:'楽・わくわく！',bpm:154,progression:[0,3,4,0],lead:'bright',bass:'bounce',drums:'shuffle',mode:'major',density:1,arpEvery:1,intensity:1.2,shape:'jump'},
 proud:{name:'得意げ・どや顔',bpm:124,progression:[0,4,0,3],lead:'reed',bass:'walk',drums:'march',mode:'major',density:0.88,arpEvery:2,intensity:1.02,shape:'march'},
 victory:{name:'成功・やった！',bpm:158,progression:[0,4,5,3],lead:'bright',bass:'running',drums:'festival',mode:'major',density:1.1,arpEvery:1,intensity:1.3,shape:'triumph'},
 frustration:{name:'悔しい・むむむ',bpm:130,progression:[5,4,1,4],lead:'reed',bass:'pulse',drums:'heavy',mode:'minor',density:0.82,arpEvery:2,intensity:1.1,shape:'stomp'},
 shyness:{name:'照れ・もじもじ',bpm:92,progression:[0,3,5,4],lead:'warm',bass:'sustain',drums:'soft',mode:'major',density:0.5,arpEvery:4,intensity:0.65,shape:'tiptoe'},
 affection:{name:'なかよし・ぬくもり',bpm:96,progression:[0,3,4,0],lead:'warm',bass:'sustain',drums:'ballad',mode:'major',density:0.54,arpEvery:4,intensity:0.68,shape:'gentle'},
 lonely:{name:'ひとりぼっち',bpm:72,progression:[5,1,3,4],lead:'glass',bass:'sustain',drums:'ballad',mode:'minor',density:0.36,arpEvery:4,intensity:0.57,shape:'sigh'},
 anxiety:{name:'不安・おろおろ',bpm:106,progression:[5,1,4,5],lead:'glass',bass:'pulse',drums:'suspense',mode:'minor',density:0.62,arpEvery:2,intensity:0.78,shape:'tiptoe'},
 fear:{name:'こわい・びくびく',bpm:90,progression:[5,1,5,4],lead:'glass',bass:'pulse',drums:'suspense',mode:'minor',density:0.42,arpEvery:4,intensity:0.84,shape:'mystery'},
 failure:{name:'失敗・ずっこけ',bpm:138,progression:[0,4,5,1],lead:'reed',bass:'bounce',drums:'shuffle',mode:'minor',density:0.88,arpEvery:2,intensity:1.1,shape:'bounce'},
 retry:{name:'再挑戦・がんばる',bpm:150,progression:[5,3,0,4],lead:'bright',bass:'running',drums:'drive',mode:'major',density:1.02,arpEvery:1,intensity:1.16,shape:'field'},
 prank:{name:'いたずら・こっそり',bpm:124,progression:[0,5,4,3],lead:'reed',bass:'bounce',drums:'shuffle',mode:'minor',density:0.78,arpEvery:2,intensity:0.96,shape:'tiptoe'},
 chase:{name:'追いかけっこ',bpm:176,progression:[5,4,0,4],lead:'bright',bass:'running',drums:'race',mode:'minor',density:1.08,arpEvery:1,intensity:1.24,shape:'rush'},
 discovery:{name:'発見・きらり',bpm:118,progression:[0,3,4,0],lead:'glass',bass:'walk',drums:'light',mode:'major',density:0.72,arpEvery:2,intensity:0.85,shape:'spark'},
 wonder:{name:'ふしぎ・夢みたい',bpm:86,progression:[0,5,3,4],lead:'glass',bass:'sustain',drums:'light',mode:'major',density:0.48,arpEvery:4,intensity:0.76,shape:'mystery'},
 suspense:{name:'見つかりそう・ひみつ',bpm:114,progression:[5,4,1,5],lead:'glass',bass:'pulse',drums:'suspense',mode:'minor',density:0.52,arpEvery:2,intensity:0.8,shape:'tiptoe'},
 sleep:{name:'おやすみ・すやすや',bpm:68,progression:[0,3,4,0],lead:'warm',bass:'sustain',drums:'ballad',mode:'major',density:0.33,arpEvery:4,intensity:0.52,shape:'gentle'},
 rain:{name:'雨・しっとり',bpm:88,progression:[5,3,1,4],lead:'glass',bass:'sustain',drums:'light',mode:'minor',density:0.42,arpEvery:4,intensity:0.62,shape:'sigh'},
 reunion:{name:'再会・ほっとする',bpm:112,progression:[0,3,5,4],lead:'warm',bass:'walking',drums:'soft',mode:'major',density:0.64,arpEvery:2,intensity:0.82,shape:'gentle'},
 farewell:{name:'おわかれ・余韻',bpm:80,progression:[5,3,4,0],lead:'warm',bass:'sustain',drums:'ballad',mode:'minor',density:0.41,arpEvery:4,intensity:0.64,shape:'sigh'},
 daily:{name:'のんびり・日常',bpm:106,progression:[0,3,4,0],lead:'warm',bass:'walk',drums:'soft',mode:'major',density:0.66,arpEvery:2,intensity:0.75,shape:'gentle'},
 festival:{name:'おまつり・大騒ぎ',bpm:166,progression:[0,4,3,4],lead:'bright',bass:'running',drums:'festival',mode:'major',density:1.13,arpEvery:1,intensity:1.25,shape:'jump'},
 battle:{name:'勝負・対決',bpm:172,progression:[5,4,1,5],lead:'reed',bass:'running',drums:'heavy',mode:'minor',density:1.04,arpEvery:1,intensity:1.22,shape:'rush'}
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
 const scale=(game.mode||plan.mode)==='minor'?MINOR:MAJOR,tonic=(game.mode==='minor'&&plan.mode!=='minor'?57:game.mode==='major'&&plan.mode==='minor'?60:plan.root||60);
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
 const songEnergy=game.intensity||1;
 const pulseDensity=game.density||1;
 const shape=game.shape||'field';
 // Repeat 4-bar thematic material; vary density and fills but keep a looping identity.
 for(let b=0;b<bars;b++){
  const chord=chordAt(b),next=chordAt((b+1)%bars),barAt=b*meter;
  harmony.push({t:barAt,chord});
  const section=b%4;
  const lift=b%8===4||kind==='bright';
  const energy=clamp((section===2?1.08:section===3?.87:1)*(kind==='tense'?.76:kind==='effort'?1.12:1)*songEnergy,.28,1.38);
  const isLast=b===bars-1;
  // Baseline original chord voicings, game ensemble uses bright, close four notes.
  for(const d of [0,2,4,6])add(barAt,step*15.2,midi(tonic,scale,chord+d)-12,'pad',.016*energy);
  for(let i=0;i<16;i++){
   const t=barAt+i*step,beat=i%4,on=i%8;
   // Main tune is a recognizable independent melody, not one-off sound effects.
   const contour={sigh:[0,-1,-2,-1,0,-2,-3,-2],stomp:[0,0,-1,0,1,0,-1,0],
    tiptoe:[0,1,0,2,1,0,1,0],jump:[0,2,4,2,0,4,5,3],
    triumph:[0,2,4,5,4,6,5,7],rush:[0,1,2,3,4,3,2,1],
    spark:[0,2,4,7,5,4,2,0],march:[0,0,2,2,4,4,2,0],
    mystery:[0,1,3,1,-1,2,0,-2],bounce:[0,2,-1,3,0,4,1,2]}[shape]||[0,1,2,1,3,2,1,0];
   const melodyIndex=motif[(i+section*2)%8]+contour[i%8]+(section===2?2:0)+
       (kind==='bright'&&i>=8?2:0);
   const leadPattern=kind==='tense'?(i%4===0||i%8===6):
      kind==='effort'?(i%2===0||i%8===7):
      kind==='playful'?(i%3!==0):pulseDensity<=.45?(i%8===0||i%8===4):
      pulseDensity<.68?(i%4===0||i%8===6):pulseDensity>1?(i%3!==1):i%2===0||i%8===3;
   if(leadPattern){
    const rootDegree=(i%8===0||i%8===6)?chord:melodyIndex;
    add(t,step*(kind==='tense'?2.8:1.55),
      midi(leadRoot,scale,rootDegree),
      'lead',.125*energy);
   }
   // Counterpoint answers primary melody in a different octave.
   if(((i===3||i===7||i===11||i===15)&&!isLast||i===3||i===11)&& (pulseDensity>.5||i===3)){
    const response=motif[(i+3)%8]+(kind==='effort'?1:0);
    add(t,step*1.75,midi(tonic+12,scale,response-2),
     'counter',.046*energy);
   }
   // Layered keyboard chord stabs, routed separately from lush pad.
   let chordHit=i===0||i===8||(kind==='playful'?i===4||i===12:
       kind==='bright'?i===4||i===10:i===12);
   if(kind==='tense'||pulseDensity<.5)chordHit=i===0||i===8;
   if(shape==='stomp')chordHit=i%4===0;
   if(chordHit){
    const dur=step*(kind==='tense'?4:3.2);
    [0,2,4].forEach((degree,j)=>add(t+step*.045*j,dur,
      midi(tonic,scale,chord+degree),'chords',.042*energy));
   }
   // Independent fast arpeggiator; alternates with chord stabs.
   if((i%(game.arpEvery===4?4:game.arpEvery===2?2:1)===(game.arpEvery===4?3:game.arpEvery===2?1:0)) || kind==='effort'&&i%2===0 || kind==='playful'&&i%3===0){
    const arpDegree=chord+[0,2,4,6,4,2,0,4][Math.floor(i/2)%8];
    add(t,step*(kind==='tense'?2:1.25),
      midi(tonic+12,scale,arpDegree),'arp',.028*energy);
   }
   // Bass line is independent and changes its rhythmic intent with the story.
   if(i%4===0||game.bass==='running'&&i%2===0||game.bass==='bounce'&&i%4===3||kind==='effort'&&i%4===2||kind==='playful'&&i%4===3){
    const bassDegree=game.bass==='running'?chord+(i%8>=4?4:0):game.bass==='sustain'?chord:kind==='tense'?chord:
      kind==='effort'?chord+(i%8>=4?4:0):
      kind==='playful'?chord+[0,4,2,4][Math.floor(i/4)%4]:
      chord+(i===12?4:0);
    add(t,step*(kind==='tense'?4:2.8),
      midi(tonic-24,scale,bassDegree),'bass',.11*energy);
   }
   // Groove is selected from the entire plot, starting on the first beat.
   const drumMode=game.drums;
   const beat=i%4;
   if(drumMode==='ballad'){
     if(i%4===0)drum(t,'hat',.10*energy);
     if(i===0||i===8)drum(t,'kick',.22*energy);
     if(i===12)drum(t,'rim',.13*energy);
   }else if(drumMode==='suspense'){
     if(i%4===0)drum(t,'hat',.14*energy);
     if(i===0||i===11)drum(t,'kick',.33*energy);
     if(i===8)drum(t,'rim',.30*energy);
   }else if(drumMode==='march'){
     if(i%2===0)drum(t,'hat',.19*energy);
     if(i===0||i===8)drum(t,'kick',.42*energy);
     if(i===4||i===12)drum(t,'snare',.38*energy);
   }else if(drumMode==='heavy'){
     if(i%2===0)drum(t,'hat',.23*energy);
     if(i===0||i===3||i===8||i===11)drum(t,'kick',.59*energy);
     if(i===4||i===12)drum(t,'snare',.62*energy);
   }else if(drumMode==='race'||drumMode==='festival'){
     drum(t,'hat',.19*energy);
     if(i%4===0||i===6||i===14)drum(t,'kick',.45*energy);
     if(i%8===4)drum(t,'snare',.46*energy);
     if(i===0&&section===2)drum(t,'crash',.31*energy);
   }else if(drumMode==='shuffle'){
     if(i%3!==1)drum(t,'hat',.24*energy);
     if(i===0||i===7||i===8)drum(t,'kick',.40*energy);
     if(i===4||i===12)drum(t,'snare',.36*energy);
     if(i===15)drum(t,'rim',.25*energy);
   }else{
     if(i%2===0)drum(t,'hat',.18*energy);
     if(i===0||i===8)drum(t,'kick',.42*energy);
     if((i===4||i===12)&&drumMode!=='light')drum(t,'snare',.38*energy);
     if(i===12&&drumMode==='light')drum(t,'rim',.21*energy);
   }
   // Glitter is short and rare; it must not mask the lead.
   if(i===3||i===11&&lift || shape==='spark'&&i===7)add(t,step*3.1,midi(tonic+24,scale,chord+4),
      'sparkle',.028*energy);
  }
  // Soft pickup to the next loop avoids terminal success cadence.
  if(isLast)add(barAt+14*step,step*1.7,midi(tonic+12,scale,next),'counter',.034);
 }
 const details={
  genre:'game',gameStyle:plan.gameStyle||'journey',gameName:game.name,emotionMode:game.mode,groove:game.drums,shape,
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
