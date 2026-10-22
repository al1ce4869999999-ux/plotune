(function(){
'use strict';
const $=id=>document.getElementById(id);
let generated=null,urls=[],audio=null;
const conditions=['Baseline','Phase','M','Phase+M'];
function stop(){if(audio){audio.pause();audio=null}}
function clear(){stop();urls.forEach(u=>URL.revokeObjectURL(u));urls=[];$('tracks').replaceChildren();$('results').hidden=true;$('export').disabled=true}
function add(tag,parent,content){const el=document.createElement(tag);if(content!==undefined)el.textContent=content;parent.append(el);return el}
function generate(){
 clear();$('generate').disabled=true;$('status').textContent='4条件を生成しています';
 try {
 const seed=Number($('seed').value),duration=Number($('duration').value);
 const engine=window.PlotuneHandheld;
 const input=engine.prepare({seed,characterSeed:seed,duration},$('style').value,null,false,$('scene').value,$('scene').value);
 const runner=window.PlotunePhase56Integration.createRunner(engine,window.PlotuneWholeSongAudit,window.PlotunePhase6Evaluation);
 generated=runner.generate(input,seed,{pcm:false});
 for(const condition of conditions){
  const entry=generated.cases[condition],root=add('article',$('tracks'));
  add('h3',root,condition);
  const play=add('button',root,'▶ 再生 '+condition);
  play.type='button';
  play.addEventListener('click',()=>{
   stop();
   if(!entry.audio)entry.audio=engine.render(entry.plan);
   if(!entry.url){
    const blob=engine.wavBlob(entry.audio.samples,entry.audio.sampleRate);
    entry.url=URL.createObjectURL(blob);urls.push(entry.url);
   }
   audio=new Audio(entry.url);audio.play().catch(e=>{$('status').textContent='再生できません: '+e.message});
  });
  for(const [key,label] of [['coherence','まとまり'],['development','展開'],['relisten','また聴きたい']]){
   const l=add('label',root,label+' ');
   const inp=add('input',l);inp.type='number';inp.min='1';inp.max='5';inp.step='1';inp.value='3';inp.dataset.condition=condition;inp.dataset.metric=key;
  }
  add('p',root,'音符: '+generated.report.results[condition].summary.notes+' / 監査: '+(generated.report.results[condition].audit.ok?'OK':'要確認'));
 }
 $('results').hidden=false;$('status').textContent='生成完了。再生して評価してください。';
 $('report').textContent=JSON.stringify(generated.report.differences,null,2);
 }catch(e){$('status').textContent='生成エラー: '+e.message;generated=null}
 finally{$('generate').disabled=false}
}
$('generate').addEventListener('click',generate);
$('rate').addEventListener('click',()=>{
 if(!generated)return;
 try{
  const ratings=conditions.map(condition=>{
   const values={condition};
   for(const key of ['coherence','development','relisten'])
    values[key]=Number([...document.querySelectorAll('input[data-metric]')].find(n=>n.dataset.condition===condition&&n.dataset.metric===key).value);
   return values;
  });
  generated.report=window.PlotunePhase6Evaluation.recordListening(generated.report,ratings);
  $('export').disabled=false;$('status').textContent='評価を記録しました。JSON保存が可能です。';
 }catch(e){$('status').textContent='評価エラー: '+e.message}
});
$('export').addEventListener('click',()=>{
 if(!generated||generated.report.listening.status!=='rated')return;
 const url=URL.createObjectURL(new Blob([JSON.stringify(generated.report,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='plotune-phase6-review-'+generated.report.seed+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
})();
