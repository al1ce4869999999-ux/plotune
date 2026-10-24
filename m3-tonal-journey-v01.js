/* M3 chromatic key journey: deterministic temporary tonicization and return.
   Opt-in only, applied uniformly to pitched voices after ordinary composition. */
(function(root){'use strict';
const PITCHED=new Set(['lead','counter','chords','arp','bass','pad','sparkle']);
function apply(score,{semitones=2,tonic=null,mode=null}={}){
 if(!score||!Array.isArray(score.notes)||!Array.isArray(score.harmony)||
    !Number.isFinite(score.duration)||score.duration<=0||
    !Number.isInteger(semitones)||Math.abs(semitones)>5)
  throw new TypeError('valid score and bounded key shift required');
 const start=score.duration*.5,end=score.duration*.75;
 // Borrow the flat sixth from parallel minor only on a subdominant (IV)
 // bar of a major-key passage, producing iv's minor third without changing lead.
 const meter=240/score.bpm;
 const sourceThird=Number.isInteger(tonic)?((tonic+9)%12+12)%12:null;
 const borrowed=mode==='major'&&Number.isFinite(meter)&&meter>0&&sourceThird!=null?
  score.harmony.find(h=>h.chord===3&&h.t>=score.duration*.25&&h.t<start):null;
 const borrowedStart=borrowed?.t??null,borrowedEnd=borrowedStart==null?null:borrowedStart+meter;
 let borrowedNotes=0;
 const notes=score.notes.map(n=>{
  if(borrowedStart!=null&&n.t>=borrowedStart&&n.t<borrowedEnd&&
     (n.voice==='chords'||n.voice==='pad'||n.voice==='arp')&&
     ((n.midi%12+12)%12)===sourceThird){borrowedNotes++;return {...n,midi:n.midi-1};}
  if(!PITCHED.has(n.voice)||n.t<start||n.t>=end)return {...n};
  const midi=n.midi+semitones;
  if(!Number.isInteger(n.midi)||midi<24||midi>108)return {...n};
  return {...n,midi};
 });
 const harmony=score.harmony.map(h=>({...h,keyOffset:h.t>=start&&h.t<end?semitones:0}));
 const events=[{at:0,keyOffset:0,function:'home'},
  {at:start,keyOffset:semitones,function:'temporary-tonicization'},
  {at:end,keyOffset:0,function:'home-return'}];
 return {...score,notes,harmony,tonalJourney:{events,semitones,borrowed:borrowedNotes?{at:borrowedStart,alteredNotes:borrowedNotes,function:'iv borrowed from parallel minor'}:null,
   source:'temporary tonicization with home return; optional parallel-minor subdominant mixture; no rhythmic edits'}};
}
root.PlotuneM3TonalJourney={apply};
})(window);
