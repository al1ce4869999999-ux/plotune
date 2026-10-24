/* Export four real-engine tracks for listening without deployment.
   Run: node scripts/export-m7-listening.cjs */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'m7-listening-wavs');
const math=Object.create(Math);math.random=()=>{throw Error('ambient RNG forbidden');};
const context={window:{},Blob,console,Math:math};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js',
 'music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js',
 'm1-motif-registry-v01.js','m1-motif-transform-v01.js','m1-section-history-v01.js',
 'm2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m3-tonal-journey-v01.js',
 'm4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js',
 'm6-quality-v01.js','m6-integration-v01.js','m7-generation-v01.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
const M=context.window.PlotuneM7Generation;
const input={title:'森の別れ',scene:'森の道を歩き、友との別れを思い出して涙をこらえる',
 character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey',duration:30};
const seed=42,result=M.generate(input,seed);
fs.mkdirSync(out,{recursive:true});
function wav(track){
 const {samples,sampleRate}=track,bytes=samples.length*2,b=Buffer.alloc(44+bytes);
 b.write('RIFF',0);b.writeUInt32LE(36+bytes,4);b.write('WAVEfmt ',8);
 b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
 b.writeUInt32LE(sampleRate,24);b.writeUInt32LE(sampleRate*2,28);
 b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(bytes,40);
 // Shared static peak normalization: never individually inflate one variant.
 for(let i=0;i<samples.length;i++){
  const v=Math.max(-1,Math.min(1,samples[i]));
  b.writeInt16LE(Math.round(v<0?v*32768:v*32767),44+i*2);
 }
 return b;
}
for(const {conditionId,track} of result.tracks){
 if(track.samples.length!==input.duration*track.sampleRate)throw Error('duration mismatch '+conditionId);
 fs.writeFileSync(path.join(out,conditionId+'.wav'),wav(track));
}
fs.writeFileSync(path.join(out,'README.txt'),
 'Plotune M7: 4 tracks, same fixed seed 42, 30 seconds, same scene and instrument set.\n'+
 'baseline.wav = legacy controls OFF\nphase.wav = Phase 1-4 treatments ON\n'+
 'm.wav = M1-M5 ON\nphase-m.wav = both ON\n'+
 'Listening order: baseline, phase, m, phase-m.\n'+
 'Human rating: motif recognizability, development, emotion, coherence, preference.\n'+
 'This is a deterministic export, not a claim of improved musical quality.\n');
console.log('Exported 4 M7 WAVs to '+out);
