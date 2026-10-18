/* Plotune v0.8 — contextual practice, uncluttered harmonic diagnostics and A/B.
   Works entirely inside Safari/Web Audio; no network calls or paid APIs. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const names={chip:'8bit・コミカル',pop:'ポップ',piano:'ピアノ風',horror:'ホラー',fantasy:'ファンタジー',ambient:'アンビエント',band:'3ピースバンド'};
const cueNames={practice:'練習・試行',stumble:'つまずき',recovery:'回復',success:'成功',danger:'危険',loss:'喪失',turn:'転換',anticipation:'期待',neutral:'変化なし'};
const roleNames={guitar:'ギター',bass:'ベース',drums:'ドラム',melody:'旋律',chords:'伴奏'};
const fields=['title','character','world','scene','style','duration','engine','bandStyle'];
const composer=window.PlotuneComposerV4,band=window.PlotuneBand,compareTools=window.PlotuneCompare;
const renderer=plan=>plan.genre==='band'?band:composer;
const styleName=plan=>plan.genre==='band'?(band.STYLES[plan.bandStyle]||band.STYLES.indie).name:names[plan.genre];
const form=()=>Object.fromEntries(fields.map(k=>[k,$(k).value]));
const textNode=(type,text,cls)=>{const n=document.createElement(type);n.textContent=String(text);if(cls)n.className=cls;return n;};
const status=(s,error=false)=>{$('status').textContent=s;$('status').classList.toggle('error',error);};
let ctx=null,node=null,transport=null,request=0,current=null,tracks=null,variant=0,events=[],selected=null;
const buffers=new WeakMap();
function stop(silent=false){
 request++;
 if(node){const old=node;node=null;try{old.stop()}catch{}try{old.disconnect()}catch{}}
 transport=null;
 if(!silent)status('停止しました');
}
function clearComparison(){
 stop(true);tracks=null;events=[];selected=null;$('comparison').hidden=true;
 $('eventCompare').hidden=true;$('cueSelect').replaceChildren();
}
function bandPanel(){$('bandOptions').hidden=$('style').value!=='band';}
function ready(){
 $('play').disabled=$('wav').disabled=!current;
 $('reroll').disabled=!current;
 for(const id of ['classicPlay','resonarePlay'])$(id).disabled=!tracks;
 for(const id of ['classicClip','resonareClip'])$(id).disabled=!tracks||!selected;
 $('cueSelect').disabled=!tracks||!events.length;
}
function busy(yes){
 for(const id of ['make','compare','analyze','reroll'])$(id).disabled=yes;
 if(yes)for(const id of ['play','wav','classicPlay','resonarePlay','classicClip','resonareClip'])$(id).disabled=true;
}
function save(quiet=false){
 try{localStorage.setItem('plotune',JSON.stringify(form()));if(!quiet)status('設定を保存しました');}
 catch{if(!quiet)status('設定を保存できませんでした',true);}
}
try{
 const saved=JSON.parse(localStorage.getItem('plotune')||'{}');
 fields.forEach(k=>{if(saved[k]!=null)$(k).value=saved[k]});
}catch{}
bandPanel();
$('runtimeVersion').textContent='実行中：v0.8｜練習・挑戦も物語の展開として解析';
function addRow(parent,title,value){
 const el=document.createElement('div');el.className='report-row';
 el.append(textNode('span',title,'muted'),textNode('strong',value));parent.append(el);
}
function analyze(){
 const input=form(),old=PlotuneAnalysis.analyze(input);
 const original=PlotuneAnalysis.plan(input,old,variant);
 const appraisal=PlotuneResonare.analyze(input);
 let base=original,enhanced=PlotuneResonare.attachPlan(original,appraisal);
 if(input.style==='band'){
  base=band.adaptPlan(original,input.bandStyle);
  enhanced=band.adaptPlan(enhanced,input.bandStyle);
 }
 const box=$('analysis');box.replaceChildren();
 box.append(textNode('h3','物語の解析結果'));
 const report=document.createElement('div');report.className='report';
 addRow(report,'曲調',styleName(base));
 addRow(report,'テンポ',base.bpm+' BPM');
 addRow(report,'目的の推定',appraisal.goal.label);
 addRow(report,'根拠',appraisal.goal.evidence.join('・')||'未特定');
 addRow(report,'出来事',appraisal.events.length+'件');
 box.append(report);
 box.append(textNode('h4','出来事に対する演奏指示'));
 for(const e of appraisal.events.slice(0,14)){
  const item=document.createElement('div');item.className='event';
  item.append(textNode('span','約'+Math.round(e.position*base.duration)+'秒：'+e.text,'event-text'));
  item.append(textNode('span',cueNames[e.cue]||'維持','event-cue'));
  box.append(item);
 }
 box.append(textNode('p','Resonare型は文章上の手がかりから推定しています。心理状態を確定するものではありません。','explain'));
 box.hidden=false;
 return {input,base,enhanced,appraisal};
}
function comparisonDisplay(){
 const drop=$('cueSelect');drop.replaceChildren();
 for(const e of events){
  const option=document.createElement('option');
  option.value=e.id;
  option.textContent=Math.round(e.window.center)+'秒 · '+e.label+' · '+e.detail.slice(0,28);
  drop.append(option);
 }
 if(selected)drop.value=selected.id;
 $('eventCompare').hidden=!selected;
 showSelection();
}
function showSelection(){
 if(!selected)return;
 const e=selected;
 $('clipPosition').textContent='約'+compareTools.formatSeconds(e.window.center)+
  'の出来事｜比較区間 '+compareTools.formatSeconds(e.window.start)+'〜'+compareTools.formatSeconds(e.window.end);
 $('changeDiagnosis').textContent=e.status+'。波形の差 '+Math.round(e.audio.relative*100)+
  '%、演奏イベントの差 '+e.scoreDelta+'件。※聴き取りやすさ・音楽の良さを判定するものではありません。';
 const box=$('trackDiff');box.replaceChildren();
 for(const [role,stat] of Object.entries(e.roles)){
  box.append(textNode('div',(roleNames[role]||role)+'：'+stat.base+' → '+stat.resonare+
    ' 音／打（差分 '+stat.changed+'件）','track-line'));
 }
}
async function generate(variation=false){
 if(!form().scene.trim()){status('シーンを入力してね',true);return;}
 if(variation)variant++;else variant=0;
 // Always prepare BOTH versions from the same input and seed. Previously
 // "自動作曲" quietly made only one track, hiding the A/B player.
 await compare();
}
function allWaveDiff(a,b){
 const duration=Math.min(a.score.duration,b.score.duration);
 return compareTools.signalDifference(a,b,0,duration).relative;
}
async function compare(){
 if(!form().scene.trim()){status('シーンを入力してね',true);return;}
 clearComparison();current=null;busy(true);status('基準版とResonare版を作曲中…');
 await new Promise(resolve=>setTimeout(resolve,35));
 try{
  const a=analyze();
  const base=renderer(a.base).render(a.base);
  const enhanced=renderer(a.enhanced).render(a.enhanced);
  tracks={classic:base,resonare:enhanced};
  current=a.input.engine==='classic'?base:enhanced;
  events=compareTools.buildEvents(base,enhanced,a.appraisal);
  selected=events[0]||null;
  comparisonDisplay();
  const d=enhanced.details,ordinary=base.details;
  const rests=d.rests||[],totalRests=rests.reduce((sum,r)=>sum+Math.max(0,r.end-r.start),0);
  const oldNotes=ordinary.melodyNotes??0,newNotes=d.melodyNotes??0;
  const duration=Math.min(base.score.duration,enhanced.score.duration);
  const roles=compareTools.roleChanges(base,enhanced,0,duration);
  const changedNotes=Object.values(roles).reduce((total,r)=>total+r.changed,0);
  const important=a.appraisal.events.filter(e=>['stumble','loss','danger','recovery','success','practice'].includes(e.cue));
  const hasPractice=a.appraisal.events.some(e=>e.cue==='practice');
  const active=a.appraisal.events.filter(e=>e.cue!=='neutral');
  const relative=allWaveDiff(base,enhanced);
  let diagnosis;
  if(active.length===0||changedNotes===0&&relative<.02){
    diagnosis='分析上、大きな出来事が見つからず、2曲がほぼ同じです。変化を捏造しない設計です。';
  }else if(!important.length){
    diagnosis='場面転換・期待のみを検出。練習や試行の記述がない場合、強い変化は作りません。';
  }else if(hasPractice&&!a.appraisal.events.some(e=>['stumble','loss','danger','recovery','success'].includes(e.cue))){
    diagnosis='練習・試行を検出。ギターの刻み、ベース、ドラムを段階的に変化させました。成功・失敗は推定していません。';
  }else if(changedNotes<8&&totalRests<.25){
    diagnosis='編曲の差が小さい状態です。明確な出来事は検出していますが、表現強度を再検証する必要があります。';
  }else{
    diagnosis='物語に対応した編曲差を生成しました。聴いて違いが感じられるかは別途評価が必要です。';
  }
  $('contrastAssessment').textContent=diagnosis;
  $('comparisonInfo').textContent='同じ楽器・主題から生成：和音の変化 '+d.shiftedChords+
    '小節内区間／休止 '+d.breaks+'回（'+totalRests.toFixed(1)+'秒）／旋律 '+oldNotes+
    '→'+newNotes+'音／演奏差分 '+changedNotes+'件／波形差 '+Math.round(relative*100)+
    '%。和音の変化は小節内の編曲単位で数えています。波形差だけでは聴感上の改善を証明できません。';
  $('comparison').hidden=false;
  $('playerHint').textContent=selected
    ? '曲の冒頭は同じ演奏が多いよ。今回の変化候補は約'+Math.round(selected.window.center)+
      '秒。下の「変化場面」ボタンで直接聴き比べてね。'
    : '物語の変化を検出できなかったため、今回は曲全体の2方式を比較してね。';
  $('summary').textContent='2曲生成済み（基準版 ＋ Resonare版） · '+styleName(a.base)+' · '+a.base.bpm+' BPM · '+a.base.duration+'秒';
  save(true);
  status(events.length?'2曲できました！下に「▶ 基準版」「▶ Resonare版」があるよ。場面別にも比較できます。':
    '2曲できました！下の2つの再生ボタンで比較できます。今回は明確な場面転換を検出できませんでした。');
 }catch(e){console.error(e);status('比較用の作曲に失敗しました',true);}
 finally{busy(false);ready();}
}
function playhead(){
 if(!transport||!ctx)return 0;
 return Math.min(transport.end,transport.start+Math.max(0,ctx.currentTime-transport.contextStart));
}
function bufferFor(track){
 let buffer=buffers.get(track);
 if(!buffer){
  buffer=ctx.createBuffer(1,track.samples.length,track.sampleRate);
  buffer.copyToChannel(track.samples,0);buffers.set(track,buffer);
 }
 return buffer;
}
async function play(which=null,scope='full'){
 const track=which&&tracks?tracks[which]:current;
 if(!track||scope==='clip'&&!selected)return;
 const duration=Math.min(track.score?.duration||track.samples.length/track.sampleRate,
    track.samples.length/track.sampleRate);
 const part=scope==='clip'?selected.window:{start:0,end:duration};
 const targetKey=which||'single';
 // Switching A→B or B→A in the same mode preserves the absolute song position.
 const synced=!!(transport&&tracks&&transport.which!==targetKey&&transport.scope===scope&&
   (scope!=='clip'||transport.eventId===selected.id));
 const at=synced?playhead():part.start;
 const offset=Math.max(part.start,Math.min(part.end-.03,at));
 stop(true);const token=request;
 try{
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass)throw Error('WebAudio unsupported');
  ctx=ctx||new AudioContextClass();
  await ctx.resume();
  if(token!==request)return;
  const buffer=bufferFor(track),source=ctx.createBufferSource();
  source.buffer=buffer;source.connect(ctx.destination);
  node=source;transport={which:targetKey,scope,eventId:scope==='clip'?selected.id:null,
    start:offset,end:part.end,contextStart:ctx.currentTime};
  source.onended=()=>{if(source===node){node=null;transport=null;status('再生が終わりました');}};
  source.start(0,offset,Math.max(.03,part.end-offset));
  current=track;$('stop').disabled=false;
  status((synced?'同じ再生位置で切り替え：':'再生中：')+
    (which==='classic'?'基準版':which==='resonare'?'Resonare版':'曲')+
    ' · '+offset.toFixed(1)+'秒'+(scope==='clip'?'（この場面だけ）':'')+' 🎵');
 }catch(e){console.error(e);node=null;transport=null;status('再生に失敗しました。音量を確認してね',true);}
}
async function exportWav(){
 if(!current)return;
 const blob=composer.wavBlob(current.samples,current.sampleRate);
 const filename=((form().title||'plotune').replace(/[\\/:*?"<>|]/g,'_').slice(0,48)||'plotune')+'.wav';
 try{
  if(navigator.share&&typeof File!=='undefined'){
   const file=new File([blob],filename,{type:'audio/wav'});
   if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:filename});status('共有メニューを開きました');return;}
    catch(e){if(e.name==='AbortError'){status('保存をキャンセルしました');return;}}
   }
  }
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  status('Safariのダウンロードを確認してね');
 }catch(e){console.error(e);status('WAV保存に失敗しました',true);}
}
$('save').addEventListener('click',()=>save());
$('analyze').addEventListener('click',()=>{analyze();status('解析しました');});
$('make').addEventListener('click',()=>generate(false));
$('reroll').addEventListener('click',()=>generate(true));
$('compare').addEventListener('click',compare);
$('play').addEventListener('click',()=>play());
$('classicPlay').addEventListener('click',()=>play('classic'));
$('resonarePlay').addEventListener('click',()=>play('resonare'));
$('classicClip').addEventListener('click',()=>play('classic','clip'));
$('resonareClip').addEventListener('click',()=>play('resonare','clip'));
$('cueSelect').addEventListener('change',()=>{
 stop(true);selected=events.find(e=>e.id===$('cueSelect').value)||events[0]||null;
 showSelection();ready();status('比較する出来事を切り替えました');
});
$('stop').addEventListener('click',()=>stop());
$('wav').addEventListener('click',exportWav);
function reset(){
 clearComparison();current=null;ready();$('summary').textContent='設定が変わりました。もう一度作曲してね';
}
$('engine').addEventListener('change',()=>{reset();analyze();status('解析方法を切り替えました');});
$('style').addEventListener('change',()=>{bandPanel();reset();status('曲調を切り替えました');});
$('bandStyle').addEventListener('change',()=>{reset();status('バンドのスタイルを切り替えました');});
})();
