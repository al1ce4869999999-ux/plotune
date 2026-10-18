/* A fake-DOM smoke test verifies v0.4 wiring without a real browser.
   It cannot replace Safari audio tests but catches missing controls or listeners. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const folder=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(folder,'index.html'),'utf8');
const scriptAssets=['analyzer.js','resonare.js','composer-v04.js','app-v04.js'];
const isLiveV4=html.includes('src="app-v04.js"');
if(!isLiveV4){
 console.log('SKIP v0.4 browser smoke test until index.html switches');
 process.exit(0);
}
for(const asset of scriptAssets)assert.ok(html.includes('src="'+asset+'"'));
const ids=['title','character','world','scene','style','duration','engine','analysis','status','make','compare','save','analyze','reroll','play','stop','wav','summary','comparison','comparisonInfo','classicPlay','resonarePlay'];
function elem(id){
 const obj={id,children:[],handlers:{},value:'',textContent:'',disabled:false,
   hidden:false,style:{},classList:{toggle(){}},dataset:{},parent:null};
 obj.addEventListener=(type,cb)=>{obj.handlers[type]=cb;};
 obj.append=(...children)=>{obj.children.push(...children);};
 obj.replaceChildren=(...children)=>{obj.children=[...children];};
 obj.focus=()=>{};obj.click=()=>{};
 return obj;
}
const elements=Object.fromEntries(ids.map(id=>[id,elem(id)]));
const document={getElementById:id=>elements[id],createElement:tag=>elem(tag),body:elem('body')};
elements.title.value='ぽんぽん';
elements.character.value='ぽんぽんは人間に褒められたい。';
elements.world.value='のどかな里';
elements.scene.value='ぽんぽんは得意げに掃除を始めた。ところが、ほうきに引っかかり転んだ。もう一度挑戦して上手にできた。';
elements.style.value='chip';elements.duration.value='15';elements.engine.value='resonare';
const saved=new Map();
const localStorage={getItem:key=>saved.get(key)||null,setItem:(key,val)=>saved.set(key,val)};
const url={createObjectURL:()=> 'blob:mock',revokeObjectURL:()=>{}};
const window={};
const context={window,document,localStorage,navigator:{},URL:url,console,Blob,
  setTimeout,clearTimeout,File:undefined};
for(const file of ['analyzer.js','resonare.js','composer-v04.js']){
 vm.runInNewContext(fs.readFileSync(path.join(folder,file),'utf8'),context,{filename:file});
}
context.PlotuneAnalysis=window.PlotuneAnalysis;
context.PlotuneResonare=window.PlotuneResonare;
context.PlotuneComposerV4=window.PlotuneComposerV4;
vm.runInNewContext(fs.readFileSync(path.join(folder,'app-v04.js'),'utf8'),context,{filename:'app-v04.js'});
for(const id of ['make','compare','save','analyze','reroll','play','stop','wav','classicPlay','resonarePlay']){
 assert.equal(typeof elements[id].handlers.click,'function',id+' click not wired');
}
(async()=>{
 await elements.make.handlers.click();
 assert.equal(elements.play.disabled,false,'rendered track must enable Play');
 assert.ok(elements.summary.textContent.includes('構造変化版'));
 assert.ok(elements.analysis.children.length>3,'analysis display populated');
 await elements.compare.handlers.click();
 assert.equal(elements.comparison.hidden,false,'A/B controls must appear');
 assert.equal(elements.classicPlay.disabled,false);
 assert.equal(elements.resonarePlay.disabled,false);
 assert.ok(elements.comparisonInfo.textContent.includes('和音の変更'));
 assert.ok(elements.comparisonInfo.textContent.includes('主旋律の音数'));
 elements.save.handlers.click();
 assert.ok(saved.has('plotune'));
 elements.engine.value='classic';
 elements.engine.handlers.change();
 assert.equal(elements.play.disabled,true,'mode change invalidates old score');
 await elements.make.handlers.click();
 assert.ok(elements.summary.textContent.includes('基準アレンジ'),'baseline mode expected');
 console.log('PASS v0.4 UI: event handlers, generation, A/B display, settings, engine switch');
})().catch(e=>{console.error(e);process.exitCode=1});
