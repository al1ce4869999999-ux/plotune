/* H1: versioned degree semantics; legacy sound mapping remains unchanged. */
(function(root){
 'use strict';
 const VERSION=1;
 function legacyDegreeToSoundingMidi(tonic,scale,degree){
  return tonic+scale[((degree%7)+7)%7]+12*Math.floor(degree/7);
 }
 function fromLegacy(event,context={}){
  if(!event||typeof event!=='object')throw new TypeError('legacy note required');
  const result={schema:'plotune.musical-note',version:VERSION,
   motifDegree:event.degree===undefined?null:event.degree,
   localScaleDegree:null,chordRelativeDegree:null,
   localKeyRegionId:context.localKeyRegionId??null,
   harmonyId:context.harmonyId??null,nonChordToneRole:null,
   midi:event.midi??null,voice:event.voice??null,
   onset:event.t??null,duration:event.d??null,
   provenance:[{source:'legacy',degreeField:event.degree===undefined?null:'degree'}],
   legacy:{...event}};
  return result;
 }
 function toLegacy(note){
  if(!note||note.schema!=='plotune.musical-note'||note.version!==VERSION||!note.legacy)
   throw new TypeError('H1 legacy snapshot required');
  return {...note.legacy};
 }
 // Explicit tonal mappings for H2+; never infer a chord root from motifDegree.
 function localScaleDegreeToMidi(tonic,scale,degree){
  if(!Number.isInteger(degree)||!Number.isFinite(tonic)||!Array.isArray(scale)||scale.length!==7||!scale.every(Number.isFinite))
   throw new TypeError('explicit local key and scale degree required');
  return tonic+scale[((degree%7)+7)%7]+12*Math.floor(degree/7);
 }
 function chordRelativeDegreeToMidi(tonic,scale,chordRootDegree,chordRelativeDegree){
  if(!Number.isInteger(chordRootDegree)||!Number.isInteger(chordRelativeDegree))
   throw new TypeError('explicit chord root and relative degree required');
  return localScaleDegreeToMidi(tonic,scale,chordRootDegree+chordRelativeDegree);
 }
 function resolveSoundingMidi(note,tonic,scale){
  if(note.midi!==null&&note.midi!==undefined)return note.midi;
  if(note.legacy&&note.legacy.degree!==undefined)
   return legacyDegreeToSoundingMidi(tonic,scale,note.legacy.degree);
  throw new TypeError('explicit pitch mapping required');
 }
 root.PlotuneH1Degree=Object.freeze({VERSION,fromLegacy,toLegacy,legacyDegreeToSoundingMidi,localScaleDegreeToMidi,chordRelativeDegreeToMidi,resolveSoundingMidi});
})(typeof window!=='undefined'?window:globalThis);
