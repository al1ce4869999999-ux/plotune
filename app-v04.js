/* Plotune v0.4: structurally reactive scores and baseline A/B. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const fields=['title','character','world','scene','style','duration','engine'];
const labels={chip:'8bit・コミカル',pop:'ポップ',piano:'ピアノ風',horror:'ホラー',fantasy:'ファンタジー',ambient:'アンビエント'};
const gestures={stumble:'旋律がつまずく',recovery:'主題が戻る',success:'高音のアクセント',loss:'低音の緊張',danger:'不穏な響き',turn:'展開のアクセント',anticipation:'期待の響き',neutral:'主題を維持'};
let ctx=null,playing=null,current=null,tracks=null,variant=0;
const composer=window.PlotuneComposerV4;
const data=()=>Object.fromEntries(fields.map(k=>[k,$(k).value]));
const status=(s,err=false)=>{$('status').textContent=s;$('status').classList.toggle('error',err)};
const txt=(tag,value,cls)=>{const n=document.createElement(tag);n.textContent=String(value);if(cls)n.className=cls;return n};
function stop(silent=false){if(playing){const n=playing;playing=null;try{n.stop()}catch{}try{n.disconnect()}catch{}}if(!silent)status('停止しました')}
function save(silent=false){try{localStorage.setItem('plotune',JSON.stringify(data()));if(!silent)status('設定を保存しました')}catch{if(!silent)status('保存できませんでした',true)}}
try{const s=JSON.parse(localStorage.getItem('plotune')||'{}');fields.forEach(k=>{if(s[k]!=null)$(k).value=s[k]})}catch{}
function row(box,label,value){const r=document.createElement('div');r.className='report-row';r.append(txt('span',label,'muted'),txt('strong',value));box.append(r)}
function analyze(show=true){
 const input=data(),original=PlotuneAnalysis.analyze(input),base=PlotuneAnalysis.plan(input,original,variant);
 const appraisal=PlotuneResonare.analyze(input),experimental=PlotuneResonare.attachPlan(base,appraisal);
 if(show)present(original,base,appraisal);
 return {input,base,experimental,appraisal};
}
function present(original,base,appraisal){
 const box=$('analysis');box.replaceChildren();
 box.append(txt('h3','物語解析 '+(data().engine==='classic'?'（従来）':'（Resonare型）')));
 const meta=document.createElement('div');meta.className='report';
 row(meta,'従来方式の曲調',original.label);
 row(meta,'楽器スタイル',labels[base.genre]);
 row(meta,'テンポ',base.bpm+' BPM');
 row(meta,'推定した目的',appraisal.goal.label);
 row(meta,'目的の根拠',appraisal.goal.evidence.join('・')||'不明');
 row(meta,'根拠の確信度',appraisal.goal.confidence==='medium'?'中':'低');
 row(meta,'解析した出来事',appraisal.events.length+'件');
 row(meta,'構造的な作曲',data().engine==='classic'?'未適用（従来の演奏）':'音の密度・和音・無音・編成を変化');
 box.append(meta);
 box.append(txt('h4','出来事ごとの演出（実験モデル）'));
 if(!appraisal.events.length)box.append(txt('p','シーンを入力すると解析されます。','explain'));
 for(const e of appraisal.events.slice(0,16)){
  const item=document.createElement('div');item.className='event';
  const seconds=Math.round(e.position*Number(data().duration));
  item.append(txt('span','約'+seconds+'秒：'+e.text,'event-text'),txt('span',gestures[e.cue]||'主題を維持','event-cue'));
  item.append(txt('small','期待との整合 '+Math.round(e.resonance*100)+'% · 状態変化 '+Math.round(e.deltaPsi*100)+'% · '+(e.evidence.join('・')||'判断根拠は薄い'),'muted'));box.append(item);
 }
 if(appraisal.events.length>16)box.append(txt('p','ほか '+(appraisal.events.length-16)+' 件','explain'));
 box.append(txt('p','整合率は期待と出来事の一致度で、喜び・悲しみではありません。明示されない心理は推測にとどまります。','explain'));
 box.hidden=false;
}
function busy(flag){
 for(const id of ['make','compare','analyze','reroll'])$(id).disabled=flag;
 if(flag)for(const id of ['play','wav','classicPlay','resonarePlay'])$(id).disabled=true;
}
function ready(){
 $('play').disabled=$('wav').disabled=!current;
 $('reroll').disabled=!current;
 $('classicPlay').disabled=$('resonarePlay').disabled=!tracks;
}
async function generate(change=false){
 if(!data().scene.trim()){status('今回のシーンを入力してね',true);return}
 if(change)variant++;else variant=0;
 stop(true);current=null;tracks=null;$('comparison').hidden=true;busy(true);
 status('文章を解析して作曲しています…');
 await new Promise(resolve=>setTimeout(resolve,35));
 try{
  const a=analyze(),plan=a.input.engine==='classic'?a.base:a.experimental;
  current=composer.render(plan);
  $('summary').textContent=(plan.resonare?'構造変化版':'従来版')+' · '+labels[plan.genre]+' · '+plan.bpm+' BPM · '+plan.duration+'秒';
  save(true);status('生成できました！');
 }catch(err){console.error(err);status('作曲中にエラーが発生しました',true)}
 finally{busy(false);ready()}
}
function difference(a,b){
 let numerator=0,denominator=0;
 for(let i=0;i<Math.min(a.length,b.length);i+=257){numerator+=(a[i]-b[i])**2;denominator+=a[i]**2+b[i]**2}
 return Math.min(2,Math.sqrt(numerator/Math.max(1e-9,denominator)));
}
async function compare(){
 if(!data().scene.trim()){status('今回のシーンを入力してね',true);return}
 stop(true);current=null;tracks=null;busy(true);$('comparison').hidden=true;
 status('同じ設定から2曲を作成中…');
 await new Promise(resolve=>setTimeout(resolve,35));
 try{
  const a=analyze();
  const classic=composer.render(a.base);
  const resonare=composer.render(a.experimental);
  tracks={classic,resonare};
  current=a.input.engine==='classic'?classic:resonare;
  const old=classic.details,neu=resonare.details;
  const totalPauses=neu.rests.reduce((t,x)=>t+x.end-x.start,0);
  const changes='音楽構造の比較：和音の変更 '+neu.shiftedChords+'区間 / 演奏を止める場面 '+neu.breaks+'回（合計 '+totalPauses.toFixed(1)+'秒） / 主旋律の音数 '+old.melodyNotes+'→'+neu.melodyNotes+' / 打楽器 '+old.percussionHits+'→'+neu.percussionHits+' / 出来事への反応 '+neu.cueHits+'件。';
  $('comparisonInfo').textContent=changes+' 波形差 '+Math.round(difference(classic.samples,resonare.samples)*100)+'%（音質の優劣ではありません）。';
  $('comparison').hidden=false;
  $('summary').textContent='A/B比較 · '+labels[a.base.genre]+' · '+a.base.bpm+' BPM · '+a.base.duration+'秒';
  save(true);status('比較用の2曲が完成！ボタンで聴き比べてね');
 }catch(err){console.error(err);status('比較の生成に失敗しました',true)}
 finally{busy(false);ready()}
}
async function play(which){
 const selected=which&&tracks?tracks[which]:current;if(!selected)return;
 try{
  stop(true);
  ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();
  await ctx.resume();
  const buffer=ctx.createBuffer(1,selected.samples.length,selected.sampleRate);buffer.copyToChannel(selected.samples,0);
  const node=ctx.createBufferSource();node.buffer=buffer;node.connect(ctx.destination);playing=node;
  node.onended=()=>{if(playing===node){playing=null;status('再生終了')}};
  node.start();current=selected;$('stop').disabled=false;
  status((which==='classic'?'従来版':which==='resonare'?'Resonare版':'曲')+'を再生中 🎵');
 }catch(err){console.error(err);status('再生に失敗しました。音量を確認してね',true)}
}
async function exportWav(){
 if(!current)return;
 const blob=composer.wavBlob(current.samples,current.sampleRate);
 const name=((data().title||'plotune').replace(/[\\/:*?"<>|]/g,'_').slice(0,48)||'plotune')+'.wav';
 try{
  if(navigator.share&&typeof File!=='undefined'){
   const f=new File([blob],name,{type:'audio/wav'});
   if(navigator.canShare&&navigator.canShare({files:[f]})){
    try{await navigator.share({files:[f],title:name});status('共有・保存メニューを開きました');return}
    catch(e){if(e.name==='AbortError'){status('保存をキャンセルしました');return}}
   }
  }
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  status('Safariのダウンロードを確認してね');
 }catch(e){console.error(e);status('WAVの書き出しに失敗しました',true)}
}
$('save').addEventListener('click',()=>save());
$('analyze').addEventListener('click',()=>{analyze();status('解析しました')});
$('make').addEventListener('click',()=>generate(false));
$('reroll').addEventListener('click',()=>generate(true));
$('compare').addEventListener('click',compare);
$('play').addEventListener('click',()=>play());
$('classicPlay').addEventListener('click',()=>play('classic'));
$('resonarePlay').addEventListener('click',()=>play('resonare'));
$('stop').addEventListener('click',()=>stop());
$('wav').addEventListener('click',exportWav);
$('engine').addEventListener('change',()=>{stop(true);current=null;tracks=null;ready();$('comparison').hidden=true;analyze();status('解析方式を切り替えました。作曲で反映されます')});
})();
