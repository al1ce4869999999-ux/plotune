/* M7.2: isolated four-condition listening panel; legacy two-track UI remains intact. */
(function(root){'use strict';
const IDS=['baseline','phase','m','phase-m'];
const LABELS={baseline:'Baseline',phase:'Phase',m:'M', 'phase-m':'Phase + M'};
function peak(samples){let p=0;for(const x of samples)p=Math.max(p,Math.abs(x));return p;}
function gainFor(track,reference=0.18){
 const samples=track.samples;if(!samples?.length)throw new TypeError('empty track');
 let sum=0;for(const x of samples){if(!Number.isFinite(x))throw new RangeError('non-finite audio');sum+=x*x;}
 const rms=Math.sqrt(sum/samples.length);if(rms<1e-7)throw new RangeError('silent track');
 return Math.min(1,reference/rms,0.95/Math.max(peak(samples),1e-8));
}
function validate(result){
 if(result?.tracks?.length!==4)throw new TypeError('four tracks required');
 const ids=result.tracks.map(x=>x.conditionId);
 if(ids.join('|')!==IDS.join('|'))throw new TypeError('condition order mismatch');
 const first=result.tracks[0].track;
 for(const item of result.tracks){
  const t=item.track;
  if(t.sampleRate!==first.sampleRate||t.samples.length!==first.samples.length)throw new RangeError('mismatched track timing');
 }
 return result;
}
function attach(doc,api,AudioContextClass){
 const byId=id=>doc.getElementById(id),make=byId('m7Make'),panel=byId('m7Panel');
 if(!make||!panel)return null;
 const buttons=IDS.map(id=>byId('m7Play-'+id)),message=byId('m7Status'),stopButton=byId('m7Stop');
 const seek=byId('m7Seek'),pauseButton=byId('m7Pause'),restartButton=byId('m7Restart'),
  repeat=byId('m7Repeat'),sync=byId('m7Sync'),clock=byId('m7Clock'),history=byId('m7History');
 let context=null,source=null,transport=null,result=null,buffers=new Map(),epoch=0,generating=false;
 let active='baseline',pausedAt=0,playing=false,frame=null;
 const report=s=>{if(message)message.textContent=s;};
 const duration=()=>result?.tracks?.[0]?.track?.samples.length/result.tracks[0].track.sampleRate||0;
 const clampTime=t=>Math.max(0,Math.min(duration(),Number(t)||0));
 function position(){
  if(!transport||!context)return pausedAt;
  const t=transport.offset+Math.max(0,context.currentTime-transport.started);return repeat?.checked&&duration()>0?t%duration():clampTime(t);
 }
 function draw(){
  const d=duration(),t=position();
  if(seek){seek.max=String(d);seek.value=String(t);seek.disabled=!result;}
  if(clock)clock.textContent=Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')+' / '+Math.floor(d/60)+':'+String(Math.floor(d%60)).padStart(2,'0');
  if(pauseButton){pauseButton.disabled=!result;pauseButton.textContent=playing?'⏸ 一時停止':'▶ 再生';}
  if(restartButton)restartButton.disabled=!result;
  if(repeat)repeat.disabled=!result;
  if(sync)sync.disabled=!result;
  buttons.forEach((b,i)=>{b.disabled=!result?.tracks?.some(t=>t.conditionId===IDS[i]);b.setAttribute('aria-pressed',String(IDS[i]===active));});
 }
 function halt(reset=false){
  epoch++;
  if(source){try{source.onended=null;source.stop();source.disconnect();}catch{}source=null;}
  transport=null;playing=false;if(reset)pausedAt=0;
  if(frame!=null&&root.cancelAnimationFrame){root.cancelAnimationFrame(frame);frame=null;}
  draw();
 }
 function tick(){
  draw();
  if(playing&&root.requestAnimationFrame)frame=root.requestAnimationFrame(tick);
 }
 async function play(id=active,offset=pausedAt){
  if(!result)return;
  const item=result.tracks.find(x=>x.conditionId===id);if(!item)return;
  halt();active=id;pausedAt=clampTime(offset);
  if(pausedAt>=duration())pausedAt=0;
  const ticket=epoch;
  try{
   if(!AudioContextClass)throw new Error('Web Audio unavailable');
   context=context||new AudioContextClass();
   await context.resume();if(ticket!==epoch)return;
   let buffer=buffers.get(id);
   if(!buffer){const t=item.track;buffer=context.createBuffer(1,t.samples.length,t.sampleRate);buffer.copyToChannel(t.samples,0);buffers.set(id,buffer);}
   const node=context.createBufferSource(),gain=context.createGain();
   gain.gain.value=gainFor(item.track);node.buffer=buffer;node.loop=!!repeat?.checked;
   node.connect(gain);gain.connect(context.destination);
   node.onended=()=>{
    if(source!==node)return;
    source=null;transport=null;playing=false;pausedAt=duration();draw();
    report(LABELS[id]+' · 再生終了');
   };
   node.start(0,pausedAt);source=node;transport={id,offset:pausedAt,started:context.currentTime,duration:buffer.duration};
   playing=true;draw();tick();report(LABELS[id]+' · 再生中');
  }catch(e){halt();report('再生エラー: '+e.message);}
 }
 function pause(){if(!playing)return;const at=position();halt();pausedAt=at;draw();report('一時停止');}
 function stop(){halt(true);report('停止しました');}
 function choose(id){if(!result)return;const at=sync?.checked?position():0;play(id,at);}
 function seekTo(t){if(!result)return;const wasPlaying=playing,id=active;halt();pausedAt=clampTime(t);draw();if(wasPlaying)play(id,pausedAt);}
 // History stores only composition inputs, never raw PCM, to conserve iPhone storage.
 const historyKey='plotune.m7.history.v1';
 function getHistory(){try{const h=JSON.parse(root.localStorage?.getItem(historyKey)||'[]');return Array.isArray(h)?h.slice(0,12):[];}catch{return [];}}
 function showHistory(){
  if(!history)return;history.textContent='';
  const entries=getHistory();const placeholder=doc.createElement('option');placeholder.value='';placeholder.textContent='保存した曲を選択';history.appendChild(placeholder);
  entries.forEach((entry,i)=>{const o=doc.createElement('option');o.value=String(i);o.textContent=entry.title+' · seed '+entry.seed;history.appendChild(o);});
 }
 function remember(input,seed){
  try{
   const entries=getHistory().filter(x=>!(x.seed===seed&&JSON.stringify(x.input)===JSON.stringify(input)));
   entries.unshift({title:String(input.title||'無題').slice(0,60),seed,input});
   root.localStorage?.setItem(historyKey,JSON.stringify(entries.slice(0,12)));
  }catch{/* private mode or quota: playback still works */}
  showHistory();
 }
 async function create(inputOverride=null,seedOverride=null){
  if(generating)return;
  generating=true;make.disabled=true;report('4条件を生成中…');
  halt(true);result=null;buffers.clear();draw();
  const input=inputOverride||Object.fromEntries(['title','character','world','scene','style','gameStyle','duration'].map(k=>[k,byId(k)?.value]));
  const seed=seedOverride??Number(byId('m7Seed').value);
  try{
   if(typeof api.generateProgressively==='function'){
    const req=api.request(input,seed);
    result={schemaVersion:'m7.1-v1',request:req,tracks:[]};
    result=validate(await api.generateProgressively(input,seed,(item,count)=>{
     result.tracks.push(item);draw();report('生成済み '+count+'/4曲 · '+LABELS[item.conditionId]+' を再生できます');
    }));
   }else result=validate(api.generate(input,seed));
   active='baseline';pausedAt=0;
   if(root.PlotuneM7Evaluation?.controller)root.PlotuneM7Evaluation.controller.begin(result);
   if(root.PlotuneM7Diagnostics?.controller)root.PlotuneM7Diagnostics.controller.show(result);
   remember(input,seed);draw();
   report('4曲生成完了 · seed '+seed+' · '+result.request.duration+'秒 · ダウンロード不要');
  }catch(e){report('4条件生成エラー: '+e.message);}
  finally{generating=false;make.disabled=false;draw();}
 }
 make.addEventListener('click',()=>create());
 buttons.forEach((b,i)=>b.addEventListener('click',()=>choose(IDS[i])));
 stopButton.addEventListener('click',stop);
 pauseButton?.addEventListener('click',()=>playing?pause():play());
 restartButton?.addEventListener('click',()=>play(active,0));
 seek?.addEventListener('input',()=>seekTo(seek.value));
 repeat?.addEventListener('change',()=>{if(source)source.loop=!!repeat.checked;});
 history?.addEventListener('change',()=>{
  const i=Number(history.value),entries=getHistory();if(history.value===''||!entries[i])return;
  const e=entries[i];for(const [key,val] of Object.entries(e.input)){const el=byId(key);if(el)el.value=val;}
  if(byId('m7Seed'))byId('m7Seed').value=String(e.seed);
  create(e.input,e.seed);
 });
 showHistory();draw();
 return {create,play,stop,pause,seekTo,choose,getHistory,get result(){return result;}};
}
root.PlotuneM7Listening={IDS,LABELS,gainFor,validate,attach};
if(typeof document!=='undefined')root.PlotuneM7Listening.controller=attach(document,root.PlotuneM7Generation,root.AudioContext||root.webkitAudioContext);
})(typeof window!=='undefined'?window:globalThis);
