/* Plotune v0.5 band UI smoke test (DOM stub, not real iOS Safari). */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!html.includes('src="app-v05.js"')){
 console.log('SKIP v0.5 UI archive; v0.6 is active');
 process.exit(0);
}
for(const file of ['analyzer.js','resonare.js','composer-v04.js','band-v05.js','app-v05.js']){
 assert.ok(html.includes('src="'+file+'"'),'asset not linked: '+file);
}
for(const id of ['bandOptions','bandStyle','style','duration','engine','make','compare']){
 assert.ok(html.includes('id="'+id+'"'),'missing HTML control: '+id);
}
const ids=['title','character','world','scene','style','duration','engine','bandStyle','bandOptions',
 'analysis','status','make','compare','save','analyze','reroll','play','stop','wav',
 'summary','comparison','comparisonInfo','classicPlay','resonarePlay'];
function mock(id){
 return {id,value:'',hidden:false,disabled:false,textContent:'',children:[],handlers:{},style:{},
  classList:{toggle(){}},focus(){},click(){},remove(){},
  addEventListener(type,cb){this.handlers[type]=cb},
  replaceChildren(...children){this.children=children},
  append(...children){this.children.push(...children)}};
}
const el=Object.fromEntries(ids.map(x=>[x,mock(x)]));
el.title.value='ぽんぽん';el.character.value='褒められたい、掃除が上手になりたい。';
el.world.value='たぬきの里';el.scene.value='得意げに掃除を始めた。しかしほうきに引っかかって転んだ。最後には上手にできた。';
el.style.value='band';el.bandStyle.value='indie';el.duration.value='15';el.engine.value='resonare';
const window={},memory=new Map(),localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
const document={getElementById:id=>el[id],createElement:tag=>mock(tag),body:mock('body')};
const globals={window,document,localStorage,console,setTimeout,clearTimeout,URL,Blob,navigator:{},File:undefined};
for(const file of ['analyzer.js','resonare.js','composer-v04.js','band-v05.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),globals,{filename:file});
}
Object.assign(globals,{PlotuneAnalysis:window.PlotuneAnalysis,PlotuneResonare:window.PlotuneResonare,
 PlotuneComposerV4:window.PlotuneComposerV4,PlotuneBand:window.PlotuneBand});
vm.runInNewContext(fs.readFileSync(path.join(root,'app-v05.js'),'utf8'),globals,{filename:'app-v05.js'});
for(const id of ['make','compare','save','analyze','reroll','play','stop','wav','classicPlay','resonarePlay']){
 assert.equal(typeof el[id].handlers.click,'function','unwired '+id);
}
assert.equal(el.bandOptions.hidden,false,'selected band should display band preset');
(async()=>{
 await el.make.handlers.click();
 assert.equal(el.play.disabled,false,'band is playable');
 assert.ok(el.summary.textContent.includes('インディーロック'),'band style visible');
 await el.compare.handlers.click();
 assert.equal(el.comparison.hidden,false,'comparison visible');
 assert.ok(el.comparisonInfo.textContent.includes('3ピース編成'),'role count is shown');
 assert.ok(el.comparisonInfo.textContent.includes('ギター'),'role count is shown');
 assert.equal(el.classicPlay.disabled,false);
 assert.equal(el.resonarePlay.disabled,false);
 el.save.handlers.click();
 assert.equal(JSON.parse(memory.get('plotune')).bandStyle,'indie');
 el.bandStyle.value='punk';el.bandStyle.handlers.change();
 assert.equal(el.play.disabled,true,'old arrangement invalidated after style change');
 await el.make.handlers.click();
 assert.ok(el.summary.textContent.includes('疾走パンク'),'punk is generated');
 el.style.value='piano';el.style.handlers.change();
 assert.equal(el.bandOptions.hidden,true,'band options hidden for piano');
 await el.make.handlers.click();
 assert.ok(el.summary.textContent.includes('ピアノ風'),'non-band option still works');
 console.log('PASS v0.5 UI: style switch, band generation, A/B, saving, legacy compatibility');
})().catch(e=>{console.error(e);process.exitCode=1});
