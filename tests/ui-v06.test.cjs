/* Plotune v0.6 browser simulation test: A/B switch keeps playback time. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const root=require('path').resolve(__dirname,'..');
const ids=['title','character','world','scene','style','duration','engine','bandStyle','bandOptions',
'analysis','status','make','compare','save','analyze','reroll','play','stop','wav','summary',
'comparison','comparisonInfo','classicPlay','resonarePlay','eventCompare','cueSelect',
'classicClip','resonareClip','clipPosition','changeDiagnosis','trackDiff'];
const element=id=>({id,value:'',textContent:'',children:[],handlers:{},hidden:false,disabled:false,
style:{},classList:{toggle(){}},addEventListener(k,cb){this.handlers[k]=cb},
replaceChildren(...x){this.children=x},append(...x){this.children.push(...x)},
focus(){},click(){},remove(){}});
const elems=Object.fromEntries(ids.map(id=>[id,element(id)]));
Object.assign(elems.title,{value:'ぽんぽん'});
elems.character.value='褒められたいから掃除をする。';
elems.world.value='たぬきの里';
elems.scene.value='得意げに掃除する。ところがほうきで転んだ。再挑戦して上手にできた。';
elems.style.value='band';elems.bandStyle.value='indie';elems.engine.value='resonare';elems.duration.value='15';
const window={};
const records=[];
class FakeAudio{
 constructor(){this.currentTime=0;FakeAudio.last=this;}
 async resume(){}
 createBuffer(c,n,rate){return {copyToChannel(){}}}
 createBufferSource(){return {connect(){},disconnect(){},stop(){this.stopped=true},
 start(w,offset,len){this.offset=offset;this.len=len;records.push(this)}}}
}
window.AudioContext=FakeAudio;
const memory=new Map();
const ctx={window,document:{getElementById:id=>elems[id],createElement:element,body:element('body')},
 localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},
 Blob,URL,console,setTimeout,clearTimeout,navigator:{}};
for(const f of ['analyzer.js','resonare.js','composer-v04.js','band-v05.js','comparison-v06.js'])
 vm.runInNewContext(fs.readFileSync(root+'/'+f,'utf8'),ctx,{filename:f});
Object.assign(ctx,{PlotuneAnalysis:window.PlotuneAnalysis,PlotuneResonare:window.PlotuneResonare,
 PlotuneComposerV4:window.PlotuneComposerV4,PlotuneBand:window.PlotuneBand});
vm.runInNewContext(fs.readFileSync(root+'/app-v06.js','utf8'),ctx);
(async()=>{
 // One tap on "作曲" must now generate TWO complete, selectable arrangements.
 await elems.make.handlers.click();
 assert.equal(elems.comparison.hidden,false,'one-tap compose reveals A/B panel');
 assert.equal(elems.classicPlay.disabled,false,'baseline track generated');
 assert.equal(elems.resonarePlay.disabled,false,'Resonare track generated');
 assert.ok(elems.summary.textContent.includes('2曲生成済み'),'explicit paired generation status');
 assert.ok(elems.status.textContent.includes('2曲できました'),'help user find both tracks');
 await elems.reroll.handlers.click();
 assert.equal(elems.comparison.hidden,false,'reroll also generates both versions');
 assert.equal(elems.classicClip.disabled,false,'reroll retains event clips');
 await elems.compare.handlers.click();
 assert.equal(elems.comparison.hidden,false);
 assert.ok(elems.cueSelect.children.length>0);
 assert.equal(elems.classicClip.disabled,false);
 assert.ok(elems.trackDiff.children.some(n=>n.textContent.includes('ギター')));
 await elems.classicClip.handlers.click();
 const before=records.at(-1).offset;
 FakeAudio.last.currentTime+=2;
 await elems.resonareClip.handlers.click();
 assert.ok(Math.abs(records.at(-1).offset-before-2)<.05,'same clip position on switch');
 assert.ok(elems.status.textContent.includes('同じ再生位置'));
 await elems.classicPlay.handlers.click();
 assert.equal(records.at(-1).offset,0,'full track restarts at beginning');
 FakeAudio.last.currentTime+=3;
 await elems.resonarePlay.handlers.click();
 assert.ok(Math.abs(records.at(-1).offset-3)<.05,'full track position synced');
 elems.style.value='piano';elems.style.handlers.change();
 assert.equal(elems.bandOptions.hidden,true);
 assert.equal(elems.classicClip.disabled,true);
 await elems.make.handlers.click();
 assert.ok(elems.summary.textContent.includes('ピアノ風'));
 console.log('PASS v0.6 UI: A/B synced playback, clips, score differences, nonband');
})().catch(e=>{console.error(e);process.exitCode=1});
