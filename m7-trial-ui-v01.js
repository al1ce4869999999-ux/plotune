/* M7 repeated-trial capture: optional UI, no automatic aesthetic conclusion. */
(function(root){'use strict';
const STORAGE_KEY='plotune-m7-trials-v1';
function createTrial(generation,evaluation,diagnostics){
 if(!generation?.request||!evaluation||!diagnostics)throw new TypeError('paired trial required');
 if(evaluation.seed!==generation.request.seed||diagnostics.seed!==generation.request.seed)throw new RangeError('seed mismatch');
 const input=evaluation.input;
 if(!input||input.scene!==generation.request.scene||input.duration!==generation.request.duration)throw new RangeError('input mismatch');
 return {trialId:[input.scene,generation.request.seed,input.duration].join(':'),evaluation:JSON.parse(JSON.stringify(evaluation)),
  diagnostics:JSON.parse(JSON.stringify(diagnostics))};
}
function attach(doc,storage,listen,ratings,diagnostic,aggregator){
 const add=doc.getElementById('m7TrialAdd'),exportButton=doc.getElementById('m7TrialExport'),message=doc.getElementById('m7TrialStatus');
 if(!add||!exportButton||!message)return null;
 function read(){
  const raw=storage?.getItem(STORAGE_KEY),trials=raw?JSON.parse(raw):[];
  if(!Array.isArray(trials))throw new TypeError('invalid stored trials');
  return trials;
 }
 function addTrial(){
  try{
   const generation=listen?.result,evaluation=ratings?.record;
   if(!generation||!evaluation)throw new Error('generate and evaluate four tracks first');
   const trial=createTrial(generation,evaluation,diagnostic.analyze(generation));
   const previous=read(),index=previous.findIndex(t=>t.trialId===trial.trialId);
   if(index>=0)previous[index]=trial;else previous.push(trial);
   aggregator.aggregate(previous); // validate before persisting
   storage.setItem(STORAGE_KEY,JSON.stringify(previous));
   message.textContent=previous.length+'件の比較記録を保存しました（同じ場面・seed・曲長は更新）。';
  }catch(e){message.textContent='比較記録の保存失敗: '+e.message;}
 }
 function exportTrials(){
  try{
   const trials=read(),summary=aggregator.aggregate(trials);
   const blob=new Blob([JSON.stringify({trials,summary},null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='plotune-m7-trials.json';
   doc.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
   message.textContent=trials.length+'件の比較記録と集計を保存しました。';
  }catch(e){message.textContent='集計の出力失敗: '+e.message;}
 }
 add.addEventListener('click',addTrial);exportButton.addEventListener('click',exportTrials);
 return {read,addTrial,exportTrials};
}
root.PlotuneM7TrialUI={STORAGE_KEY,createTrial,attach};
if(typeof document!=='undefined')root.PlotuneM7TrialUI.controller=attach(document,root.localStorage,
 root.PlotuneM7Listening?.controller,root.PlotuneM7Evaluation?.controller,root.PlotuneM7Diagnostics,root.PlotuneM7Aggregate);
})(typeof window!=='undefined'?window:globalThis);
