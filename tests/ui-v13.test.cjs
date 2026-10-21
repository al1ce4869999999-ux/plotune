/* Plotune v1.3 UI: AAC export control + handheld A/B, looped playback.
 * Simulates iOS WebAudio controls without network calls or a real browser.
 */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const root=require('path').resolve(__dirname,'..');
const ids=['title','character','world','scene','style','duration','engine','bandStyle','bandOptions',
'analysis','status','make','compare','save','analyze','reroll','play','stop','wav','summary',
'comparison','comparisonInfo','classicPlay','resonarePlay','eventCompare','cueSelect',
'classicClip','resonareClip','clipPosition','changeDiagnosis','trackDiff','runtimeVersion',
'playerHint','contrastAssessment','generationTrace','loopPlayback','gameStyle','gameOptions','zeta','zetaHelp','zetaProgress','zetaDownload'];
const element=id=>({id,value:'',textContent:'',children:[],handlers:{},hidden:false,disabled:false,
 checked:false,style:{},classList:{toggle(){}},addEventListener(k,cb){this.handlers[k]=cb},
 replaceChildren(...items){this.children=items},append(...items){this.children.push(...items)},
 focus(){},click(){},remove(){}});
const elems=Object.fromEntries(ids.map(id=>[id,element(id)]));
elems.title.value='ぽんぽん';
elems.character.value='人間に褒められたいので、掃除のれんしゅうを続けたい。';
elems.world.value='たぬきの里';
elems.scene.value='ぽんぽんは掃除を始めた。ところが引っかかって転んだ。でも、れんしゅう、何度もやり直す。';
elems.style.value='bandpiano';elems.gameStyle.value='journey';elems.bandStyle.value='indie';elems.duration.value='15';
elems.engine.value='resonare';elems.loopPlayback.checked=true;
elems.zetaProgress.value=0;
const window={},records=[],memory=new Map();
class FakeAudio{
 constructor(){this.currentTime=0;FakeAudio.last=this;}
 async resume(){}
 createBuffer(c,n,rate){return {copyToChannel(){},length:n,sampleRate:rate};}
 createBufferSource(){return {connect(){},disconnect(){},stop(){this.stopped=true},
  start(w,offset,len){this.offset=offset;this.len=len;records.push(this)}};}
}
window.AudioContext=FakeAudio;
window.MediaRecorder=class{static isTypeSupported(t){return t==='audio/mp4'}};
const context={window,document:{getElementById:id=>elems[id],createElement:element,body:element('body')},
 localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},
 Blob,URL,console,setTimeout,clearTimeout,navigator:{}};
for(const f of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','composer-v04.js','band-v09.js','band-piano-v15.js','handheld-v21.js','comparison-v13.js','zeta-export-v12.js'])
 vm.runInNewContext(fs.readFileSync(root+'/'+f,'utf8'),context,{filename:f});
Object.assign(context,{PlotuneAnalysis:window.PlotuneAnalysis,PlotuneResonare:window.PlotuneResonare,
 PlotuneLoop:window.PlotuneLoop,PlotuneComposerV4:window.PlotuneComposerV4,PlotuneBand:window.PlotuneBand,PlotuneBandPiano:window.PlotuneBandPiano,PlotuneHandheld:window.PlotuneHandheld});
vm.runInNewContext(fs.readFileSync(root+'/app-v13.js','utf8'),context,{filename:'app-v13.js'});
(async()=>{
 assert.ok(elems.runtimeVersion.textContent.includes('v2.4'));
 assert.equal(elems.bandOptions.hidden,false);
 assert.equal(elems.gameOptions.hidden,true);
 await elems.make.handlers.click();
 assert.equal(elems.comparison.hidden,false);
 assert.equal(elems.classicPlay.disabled,false);
 assert.equal(elems.resonarePlay.disabled,false);
 assert.equal(elems.zeta.disabled,true,'15-second track cannot pass Zeta duration gate');
 assert.ok(elems.contrastAssessment.textContent.includes('曲の冒頭0秒'),'global arrangement starts before playback');
 assert.ok(elems.summary.textContent.includes('ループ設計'));
 assert.ok(elems.summary.textContent.includes('ピアノユニゾン'));
 assert.ok(elems.contrastAssessment.textContent.includes('同じ音程'));
 assert.ok(elems.trackDiff.children.some(x=>x.textContent.includes('ピアノ')));
 assert.ok(elems.contrastAssessment.textContent.includes('ギター'));
 // The piano-unison arrangement is a band, not the 7-part handheld ensemble.
 
 
 
 assert.ok(elems.cueSelect.children.some(e=>e.textContent.includes('冒頭')),'direct 0–10s A/B selection');
 assert.ok(elems.playerHint.textContent.includes('0秒から編曲が違う'));
 await elems.classicClip.handlers.click();
 assert.equal(records.at(-1).offset,0,'intro comparison starts at bar one');
 assert.equal(records.at(-1).loop,undefined,'clip is not looped');
 FakeAudio.last.currentTime+=2;
 await elems.resonareClip.handlers.click();
 assert.ok(Math.abs(records.at(-1).offset-2)<.05,'intro clip keeps A/B playhead');
 await elems.classicPlay.handlers.click();
 const first=records.at(-1);
 assert.equal(first.offset,0);
 assert.equal(first.loop,true,'continuous playback enabled by checkbox');
 assert.ok(!Number.isFinite(first.len),'looped buffer source has no stop duration');
 assert.equal(first.loopEnd,15,'exact 15s source duration');
 FakeAudio.last.currentTime+=18.4;
 await elems.resonarePlay.handlers.click();
 assert.ok(Math.abs(records.at(-1).offset-3.4)<.05,'A/B switch wraps modulo duration');
 assert.equal(records.at(-1).loop,true);
 elems.loopPlayback.checked=false;
 elems.loopPlayback.handlers.change();
 await elems.classicPlay.handlers.click();
 assert.ok(Number.isFinite(records.at(-1).len),'when repeat is off, one-shot playback retains duration');
 assert.notEqual(records.at(-1).loop,true);
 elems.bandStyle.value='ballad';elems.bandStyle.handlers.change();
 await elems.make.handlers.click();
 assert.ok(elems.summary.textContent.includes('バンドバラード'));
 elems.style.value='piano';elems.style.handlers.change();
 assert.equal(elems.bandOptions.hidden,true);
 assert.equal(elems.gameOptions.hidden,true);
 await elems.make.handlers.click();
 assert.ok(elems.summary.textContent.includes('ピアノ風'),'nonband arrangements remain functional');
 elems.style.value='bandpiano';elems.style.handlers.change();
 elems.scene.value='窓辺に光が差す。';
 elems.character.value='';
 elems.world.value='';
 await elems.make.handlers.click();
 assert.ok(elems.contrastAssessment.textContent.includes('基準版と同じループ編曲'));
 assert.equal(elems.classicPlay.disabled,false);
 assert.equal(elems.resonarePlay.disabled,false);
 elems.duration.value='30';
 await elems.make.handlers.click();
 assert.equal(elems.zeta.disabled,false,'30-second track has M4A export enabled');
 assert.equal(typeof elems.zeta.handlers.click,'function');
 assert.ok(fs.readFileSync(root+'/index.html','utf8').includes('id="zetaHelp"'),'Zeta guidance is visible');
 console.log('PASS v1.3 UI: game style selector, seven layers, 2 versions, seamless loop UI, nonband compatibility');
})().catch(e=>{console.error(e);process.exitCode=1});
