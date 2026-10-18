/* Run with: node tests/engine.test.cjs — no npm or API required */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const window={};
const context={window,Blob,console};
for(const filename of ['analyzer.js','composer.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,filename),'utf8'),context,{filename});
}
const {analyze,plan}=window.PlotuneAnalysis;
const {render,wavBlob}=window.PlotuneComposer;
const base={title:'たぬきの里',character:'ぽんぽんは頑張り屋のたぬき。',world:'穏やかな里',style:'auto',duration:15};
const a=analyze({...base,scene:'ぽんぽんがころころ転んで笑った。'});
assert.equal(a.primary,'whimsy','comedies should be recognized');
const b=analyze({...base,character:'',world:'',scene:'ひとりで泣いた。悲しい別れだった。'});
assert.equal(b.primary,'melancholy','sad scenes should be recognized');
const c=analyze({...base,character:'',world:'',scene:'暗闇で怪異が迫る。怖くて震えた。'});
assert.equal(c.primary,'suspense','suspense scenes should be recognized');
const d=analyze({...base,character:'',world:'',scene:'怖くない。あたたかい笑顔で安心した。'});
assert.equal(d.primary,'warm','simple negation should not trigger horror');
const e=analyze({...base,scene:'ぽんぽんが転んだ。ところが、突然走り始めた。'});
assert.equal(e.hasSwitch,true,'story transitions should be recognized');
const inp={...base,scene:'たぬきが転んだ。やがて笑った。'};
const s=plan(inp,analyze(inp));
assert.ok(Number.isFinite(s.bpm)&&s.bpm>50&&s.bpm<160);
assert.equal(s.sections.length,4);
const s2=plan({...inp,scene:'しばらく静かに眠った。'},analyze({...inp,scene:'しばらく静かに眠った。'}));
assert.equal(s.characterSeed,s2.characterSeed,'stable motifs depend on character/world');
const audio=render(s);
assert.ok(audio.samples.length>330000);
assert.ok(audio.samples.some(x=>x!==0),'not silent');
for(let i=0;i<audio.samples.length;i++)assert.ok(Number.isFinite(audio.samples[i])&&Math.abs(audio.samples[i])<=1,'sample invalid');
const blob=wavBlob(audio.samples,audio.sampleRate);
assert.equal(blob.size,44+audio.samples.length*2);
(async()=>{const ab=await blob.slice(0,12).arrayBuffer();const head=Buffer.from(ab);assert.equal(head.toString('ascii',0,4),'RIFF');assert.equal(head.toString('ascii',8,12),'WAVE');console.log('PASS: analysis, negation, scene transitions, stable motifs, PCM, WAV');})().catch(e=>{console.error(e);process.exitCode=1});
