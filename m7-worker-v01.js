/* M7 browser worker: score and PCM are generated off the UI thread.
   Each finished track is transferred, not duplicated, to the main thread. */
'use strict';
self.window=self;
try{
 importScripts(
  'analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js',
  'music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js',
  'm1-motif-registry-v01.js','m1-motif-transform-v01.js','m1-section-history-v01.js',
  'm2-emotion-phrase-v01.js','m3-harmony-melody-v01.js','m3-tonal-journey-v01.js',
  'm4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js',
  'm6-quality-v01.js','m6-integration-v01.js','m7-generation-v01.js'
 );
 self.postMessage({type:'ready'});
}catch(error){self.postMessage({type:'error',message:'音源エンジンの読込に失敗: '+error.message});}
self.onmessage=event=>{
 if(event.data?.type!=='generate')return;
 try{
  const api=self.PlotuneM7Generation,req=api.request(event.data.input,event.data.seed);
  const deps=api.dependenciesFromRoot(),plans=api.makePlans(req,deps);
  for(const {conditionId,config,plan} of plans){
   const track=deps.handheld.render(plan);
   if(!track?.samples||!track?.score||!Number.isFinite(track.sampleRate)||
       track.samples.length!==Math.round(req.duration*track.sampleRate)||
       !track.samples.every(Number.isFinite))throw Error('無効な音源: '+conditionId);
   const item={conditionId,config,request:req,track,m6Report:null};
   self.postMessage({type:'track',item},[track.samples.buffer]);
  }
  self.postMessage({type:'complete'});
 }catch(error){self.postMessage({type:'error',message:error.message});}
};
