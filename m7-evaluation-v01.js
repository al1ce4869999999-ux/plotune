/* M7.3: human listening evaluations; no automatic quality claims. */
(function(root){'use strict';
const IDS=['baseline','phase','m','phase-m'];
const CRITERIA=[['motif','旋律・動機'],['development','展開'],['emotion','感情表現'],['coherence','まとまり'],['preference','好み'],['liking','好き／嫌い'],['expectation','予想通り／予想外'],['memorability','記憶に残る／残らない'],['naturalness','自然／不自然'],['difference','違いの明瞭さ'],['emotionalComplexity','感情の複雑さ'],['motifRecognition','主題の再認しやすさ'],['variationFreshness','変奏の新鮮さ'],['melodyClarity','主旋律の明瞭さ'],['boundaryPersuasiveness','セクション境界の説得力'],['wholeSongCoherence','全曲のまとまり'],['relistenIntent','もう一度聴きたい度合い']];
function rating(value){if(value===''||value==null)return null;const n=Number(value);if(!Number.isInteger(n)||n<1||n>5)throw new RangeError('rating must be 1..5');return n;}
const DIAGNOSTIC_KEYS=['r0','r3','r4','r5','r7'];
function diagnosticsFor(track){
 const details=track.track?.details??track.track?.score?.details??{};
 const sources={r0:details.researchEvaluations,r3:details.expectancyR3,r4:details.identityNoveltyR4,r5:details.arrangementPerceptionR5,r7:details.transitionEvaluationR7};
 const supplied=track.diagnostics??track.track?.diagnostics??{};
 const result={};
 for(const key of DIAGNOSTIC_KEYS){
  const value=supplied[key]??sources[key]??null;
  result[key]=value===null?null:JSON.parse(JSON.stringify(value));
 }
 return result;
}
function createRecord(generation){
 if(!generation||generation.tracks?.map(t=>t.conditionId).join('|')!==IDS.join('|'))throw new TypeError('M7 four-condition generation required');
 return {schema:'plotune.m7.listening.v1',seed:generation.request.seed,generation:{schemaVersion:generation.schemaVersion??null,version:generation.version??null,conditions:generation.tracks.map(t=>({id:t.conditionId,config:t.config??null,version:t.version??generation.version??null}))},input:{...generation.request},presentationOrder:generation.presentationOrder??null,objectiveDiagnostics:Object.fromEntries(generation.tracks.map(t=>[t.conditionId,diagnosticsFor(t)])),ratings:Object.fromEntries(IDS.map(id=>[id,Object.fromEntries(CRITERIA.map(([key])=>[key,null]))])),notes:Object.fromEntries(IDS.map(id=>[id,'']))};
}
function setRating(record,id,key,value){
 if(!IDS.includes(id)||!CRITERIA.some(c=>c[0]===key))throw new RangeError('unknown evaluation dimension');
 record.ratings[id][key]=rating(value);return record;
}
function complete(record){return IDS.every(id=>CRITERIA.every(([key])=>record.ratings[id][key]!=null));}
function compareRatings(record,left='baseline',right='phase-m'){
 if(!IDS.includes(left)||!IDS.includes(right)||left===right)throw new RangeError('invalid comparison');
 const dimensions=CRITERIA.map(([key])=>key);
 return {left,right,axes:Object.fromEntries(dimensions.map(key=>{
  const a=record.ratings?.[left]?.[key]??null,b=record.ratings?.[right]?.[key]??null;
  return [key,{left:a,right:b,delta:a===null||b===null?null:b-a}];
 })),objective:{left:record.objectiveDiagnostics?.[left]??null,right:record.objectiveDiagnostics?.[right]??null}};
}
function attach(doc,listening,storage){
 const panel=doc.getElementById('m7Evaluation'),body=doc.getElementById('m7RatingFields'),message=doc.getElementById('m7RatingStatus');
 if(!panel||!body)return null;
 const save=doc.getElementById('m7RatingSave'),download=doc.getElementById('m7RatingExport');
 let record=null;
 const render=()=>{
  body.replaceChildren();if(!record)return;
  for(const id of IDS){
   const group=doc.createElement('fieldset'),legend=doc.createElement('legend');
   legend.textContent=({baseline:'Baseline',phase:'Phase',m:'M','phase-m':'Phase + M'})[id];group.append(legend);
   for(const [key,label] of CRITERIA){
    const row=doc.createElement('label');row.textContent=label+'（1〜5） ';
    const select=doc.createElement('select');select.setAttribute('aria-label',legend.textContent+' '+label);
    for(const [value,name] of [['','未評価'],['1','1'],['2','2'],['3','3'],['4','4'],['5','5']]){
     const opt=doc.createElement('option');opt.value=value;opt.textContent=name;select.append(opt);
    }
    select.value=record.ratings[id][key]??'';
    select.addEventListener('change',()=>{setRating(record,id,key,select.value);message.textContent=complete(record)?'全項目入力済み':'未評価の項目があります';});
    row.append(select);group.append(row);
   }
   const note=doc.createElement('textarea');note.placeholder='聴いて気づいたこと（任意）';note.setAttribute('aria-label',legend.textContent+' メモ');
   note.value=record.notes[id];note.addEventListener('input',()=>{record.notes[id]=note.value;});group.append(note);body.append(group);
  }
 };
 function begin(generation){record=createRecord(generation);panel.hidden=false;render();message.textContent='新しい4曲の評価を開始しました。未評価は空欄のまま保存できます。';}
 function comparisonText(){
  const compared=compareRatings(record);
  const labels={liking:'好き',expectation:'意外性',memorability:'記憶性',naturalness:'自然さ'};
  return Object.entries(compared.axes).map(([key,value])=>labels[key]+': '+(value.delta===null?'未評価':(value.delta>0?'+':'')+value.delta)).join(' / ');
 }
 function persist(){
  if(!record)return;
  try{storage.setItem('plotune-m7-rating-v1',JSON.stringify(record));message.textContent='評価をこの端末に保存しました。'+(complete(record)?'全項目入力済み。':'未評価項目あり。')+' Baseline→Phase + M: '+comparisonText();}
  catch(e){message.textContent='保存失敗: '+e.message;}
 }
 function exportJson(){
  if(!record)return;
  const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=doc.createElement('a');
  a.href=url;a.download='plotune-m7-rating-'+record.seed+'.json';doc.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 save.addEventListener('click',persist);download.addEventListener('click',exportJson);
 return {begin,persist,compare:(left,right)=>record?compareRatings(record,left,right):null,get record(){return record;}};
}
function createResearchRecord(generation,conditionId){
 const pair=generation.tracks.filter(t=>t.conditionId===conditionId);
 if(pair.length!==2||pair[0].mode!=='off'||pair[1].mode!=='on')throw new TypeError('R9 research pair required');
 return {schema:'plotune.r9.listening.v1',seed:generation.request.seed,input:{...generation.request},conditionId,ablation:generation.ablation.slice(),generationVersion:generation.schemaVersion,presentationOrder:generation.presentationOrder??['off','on'],
  researchFlags:pair.map(t=>({mode:t.mode,flags:{...t.config.research}})),
  objectiveDiagnostics:Object.fromEntries(pair.map(t=>[t.mode,diagnosticsFor(t)])),
  ratings:Object.fromEntries(['off','on'].map(mode=>[mode,Object.fromEntries(CRITERIA.map(([key])=>[key,null]))])),notes:{off:'',on:''}};
}
function compareResearchRatings(record){
 return Object.fromEntries(CRITERIA.map(([key])=>{
  const off=record.ratings.off[key],on=record.ratings.on[key];
  return [key,{off,on,delta:off===null||on===null?null:on-off}];
 }));
}
function attachResearch(doc,storage){
 const panel=doc.getElementById('r9Evaluation'),body=doc.getElementById('r9RatingFields'),message=doc.getElementById('r9RatingStatus');
 if(!panel||!body)return null;
 let record=null;
 function begin(generation,conditionId){
  record=createResearchRecord(generation,conditionId);panel.hidden=false;body.replaceChildren();
  for(const [i,mode] of record.presentationOrder.entries()){
   const fieldset=doc.createElement('fieldset'),legend=doc.createElement('legend');legend.textContent='曲'+(i+1);fieldset.append(legend);
   for(const [key,label] of CRITERIA){
    const row=doc.createElement('label');row.textContent=label+'（1〜5） ';
    const select=doc.createElement('select');select.setAttribute('aria-label','曲'+(i+1)+' '+label);
    for(const value of ['',1,2,3,4,5]){const option=doc.createElement('option');option.value=String(value);option.textContent=value===''?'未評価':String(value);select.append(option);}
    select.addEventListener('change',()=>{record.ratings[mode][key]=rating(select.value);});row.append(select);fieldset.append(row);
   }
   const note=doc.createElement('textarea');note.placeholder='聴取メモ';note.addEventListener('input',()=>{record.notes[mode]=note.value;});fieldset.append(note);body.append(fieldset);
  }
  message.textContent='研究OFF/ONの評価を開始しました。';
 }
 doc.getElementById('r9RatingSave')?.addEventListener('click',()=>{if(!record)return;try{storage.setItem('plotune-r9-rating-v1',JSON.stringify(record));const deltas=compareResearchRatings(record);message.textContent='R9評価を保存しました · 好き '+(deltas.liking.delta??'未評価')+' / 自然さ '+(deltas.naturalness.delta??'未評価')+'（ON−OFF）';}catch(e){message.textContent='保存失敗: '+e.message;}});
 doc.getElementById('r9RatingExport')?.addEventListener('click',()=>{if(!record)return;const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const link=doc.createElement('a');link.href=url;link.download='plotune-r9-'+record.seed+'.json';doc.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);});
 return {begin,get record(){return record;}};
}
root.PlotuneM7Evaluation={IDS,CRITERIA,DIAGNOSTIC_KEYS,diagnosticsFor,rating,createRecord,setRating,complete,compareRatings,attach,createResearchRecord,compareResearchRatings,attachResearch};
if(typeof document!=='undefined'){root.PlotuneM7Evaluation.controller=attach(document,root.PlotuneM7Listening,root.localStorage);root.PlotuneM7Evaluation.researchController=attachResearch(document,root.localStorage);}
})(typeof window!=='undefined'?window:globalThis);
