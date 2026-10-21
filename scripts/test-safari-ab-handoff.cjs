const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app-v13.js','utf8');
const rules=fs.readFileSync('DEVELOPMENT_RULES.md','utf8');
for(const [id,label] of [['engineABMake','新旧2曲を生成'],['engineABOld','従来エンジン'],['engineABNew','新エンジン']]){
 assert.match(html,new RegExp('id="'+id+'"[^>]*>[^<]*'+label),'Missing visible old/new A/B control: '+id);
 assert.match(app,new RegExp("\\$\\('"+id+"'\\)\\.addEventListener"),'Missing handler: '+id);
}
assert.match(html,/新旧作曲エンジン A\/B/);
assert.match(app,/async function generateEngineAB\(/);
assert.match(app,/compositionV1:false/);
assert.match(app,/compositionV1:true/);
assert.match(app,/tracks=\{legacy,hierarchical\}/);
assert.match(app,/play\('legacy'\)/);
assert.match(app,/play\('hierarchical'\)/);
assert.match(app,/const a=analyze\(\),p=a\.input\.engine==='classic'\?a\.base:a\.enhanced/);
assert.match(rules,/Mandatory Safari A\/B handoff gate/);
console.log('Safari handoff static regression passed (does not prove browser or audio playback)');
