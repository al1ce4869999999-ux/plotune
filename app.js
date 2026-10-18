/* Plotune app v2: browser-only controller */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const fields=['title','character','world','scene','style','duration'];
const names={chip:'8bit / コミカル',pop:'ポップ',piano:'ピアノ風',horror:'ホラー',fantasy:'ファンタジー',ambient:'アンビエント'};
let context=null,source=null,rendered=null,variant=0,lastInput=null,lastAnalysis=null,lastPlan=null;
function input(){return Object.fromEntries(fields.map(k=>[k,$(k).value]));}
function setStatus(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function stop(silent=false){
 if(source){const old=source;source=null;try{old.stop()}catch{}try{old.disconnect()}catch{}}
 if(!silent)setStatus('停止しました');
}
function save(){
 try{localStorage.setItem('plotune',JSON.stringify(input()));setStatus('設定を保存しました');}
 catch(e){setStatus('このブラウザでは設定を保存できません',true);}
}
function load(){
 try{const data=JSON.parse(localStorage.getItem('plotune')||'{}');fields.forEach(k=>{if(data[k]!=null)$(k).value=data[k]});}catch{}
}
function makeNode(tag,cls,text){
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text!=null)e.textContent=text;
 return e;
}
function showAnalysis(analysis,plan){
 const box=$('analysis');
 box.replaceChildren();
 box.append(makeNode('h3','', '物語の解析結果'));
 const report=makeNode('div','report');
 const line=(title,value)=>{const row=makeNode('div','report-row');row.append(makeNode('span','muted',title),makeNode('strong','',value));report.append(row);};
 line('中心の感情',analysis.label);
 line('曲調',names[plan.genre]);
 line('速さ',plan.bpm+' BPM');
 line('音階',plan.mode==='minor'?'短調系':'長調系');
 line('場面転換',analysis.hasSwitch?'あり（接続語を検出）':'明確な接続語は未検出');
 box.append(report);
 const word=makeNode('p','explain',analysis.keywords.length?'シーンの手がかり：'+analysis.keywords.join('・'):'シーンから感情語を十分に検出できませんでした。標準的な曲調に寄せます。');
 box.append(word);
 const profile=makeNode('p','explain',analysis.characterKeywords.length?'人物の手がかり：'+analysis.characterKeywords.join('・'):'キャラクター設定は主題を固定する種として利用します。');
 box.append(profile);
 const heading=makeNode('h4','', '曲の流れ（推定）');box.append(heading);
 const grid=makeNode('div','arc');
 plan.sections.forEach(s=>{
  const item=makeNode('div','arc-item');
  const bar=makeNode('div','arc-bar');
  const fill=makeNode('div','arc-fill');
  fill.style.height=Math.round(15+s.intensity*85)+'%';
  bar.append(fill);item.append(bar,makeNode('span','',s.name));grid.append(item);
 });
 box.append(grid);
 box.hidden=false;
}
function doAnalysis(){lastInput=input();lastAnalysis=PlotuneAnalysis.analyze(lastInput);lastPlan=PlotuneAnalysis.plan(lastInput,lastAnalysis,variant);showAnalysis(lastAnalysis,lastPlan);return lastPlan;}
async function generate(isVariation=false){
 if(!input().scene.trim()){setStatus('まず「今回のシーン」を入力してね',true);$('scene').focus();return;}
 if(isVariation)variant++;else variant=0;
 stop(true);rendered=null;
 $('make').disabled=$('reroll').disabled=true;
 setStatus('物語を解析して作曲中…');
 // Allow Safari to paint the status before waveform synthesis.
 await new Promise(resolve=>setTimeout(resolve,35));
 try{
  const plan=doAnalysis();
  rendered=PlotuneComposer.render(plan);
  $('summary').textContent=names[plan.genre]+' · '+plan.bpm+' BPM · '+plan.duration+'秒 · '+(plan.mode==='minor'?'短調':'長調');
  $('play').disabled=$('wav').disabled=$('reroll').disabled=false;
  saveSilently();
  setStatus(isVariation?'別アレンジを作りました！':'作曲できました！');
 }catch(e){console.error(e);setStatus('生成中にエラーが発生しました。文章を短くして再試行してください。',true);}
 finally{$('make').disabled=false;$('reroll').disabled=!rendered;}
}
function saveSilently(){try{localStorage.setItem('plotune',JSON.stringify(input()));}catch{}}
async function play(){
 if(!rendered)return;
 try{
  stop(true);
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass)throw new Error('Web Audio unavailable');
  context=context||new AudioContextClass();
  // resume() is triggered directly by tap for iOS Safari.
  await context.resume();
  const buffer=context.createBuffer(1,rendered.samples.length,rendered.sampleRate);
  buffer.copyToChannel(rendered.samples,0);
  const node=context.createBufferSource();source=node;node.buffer=buffer;node.connect(context.destination);
  node.onended=()=>{if(source===node){source=null;setStatus('再生が終わりました');}};
  node.start();$('stop').disabled=false;setStatus('再生中 🎵');
 }catch(e){console.error(e);setStatus('再生できませんでした。iPhoneの音量・消音設定を確認してください。',true);}
}
async function exportWav(){
 if(!rendered)return;
 try{
  const blob=PlotuneComposer.wavBlob(rendered.samples,rendered.sampleRate);
  const name=((input().title||'plotune').replace(/[\\/:*?"<>|]/g,'_').slice(0,50)||'plotune')+'.wav';
  if(navigator.share&&typeof File!=='undefined'){
   const file=new File([blob],name,{type:'audio/wav'});
   if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:name});setStatus('共有・保存メニューを開きました');return;}
    catch(err){if(err&&err.name==='AbortError'){setStatus('保存をキャンセルしました');return;}}
   }
  }
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  setStatus('WAVを書き出しました。Safariのダウンロードを確認してください');
 }catch(e){console.error(e);setStatus('WAVの保存に失敗しました',true);}
}
load();
$('save').addEventListener('click',save);
$('analyze').addEventListener('click',()=>{doAnalysis();setStatus('解析結果を更新しました');});
$('make').addEventListener('click',()=>generate(false));
$('reroll').addEventListener('click',()=>generate(true));
$('play').addEventListener('click',play);
$('stop').addEventListener('click',()=>stop());
$('wav').addEventListener('click',exportWav);
})();