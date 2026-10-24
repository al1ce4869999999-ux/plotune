/* M3 chromatic key journey: deterministic temporary tonicization and return.
   Opt-in only, applied uniformly to pitched voices after ordinary composition. */
(function(root){'use strict';
const PITCHED=new Set(['lead','counter','chords','arp','bass','pad','sparkle']);
function apply(score,{semitones=2}={}){
 if(!score||!Array.isArray(score.notes)||!Array.isArray(score.harmony)||
    !Number.isFinite(score.duration)||score.duration<=0||
    !Number.isInteger(semitones)||Math.abs(semitones)>5)
  throw new TypeError('valid score and bounded key shift required');
 const start=score.duration*.5,end=score.duration*.75;
 const notes=score.notes.map(n=>{
  if(!PITCHED.has(n.voice)||n.t<start||n.t>=end)return {...n};
  const midi=n.midi+semitones;
  if(!Number.isInteger(n.midi)||midi<24||midi>108)return {...n};
  return {...n,midi};
 });
 const harmony=score.harmony.map(h=>({...h,keyOffset:h.t>=start&&h.t<end?semitones:0}));
 const events=[{at:0,keyOffset:0,function:'home'},
  {at:start,keyOffset:semitones,function:'temporary-tonicization'},
  {at:end,keyOffset:0,function:'home-return'}];
 return {...score,notes,harmony,tonalJourney:{events,semitones,source:'relative semitone offset of all pitched voices; no rhythmic edits'}};
}
root.PlotuneM3TonalJourney={apply};
})(window);
