const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const page=fs.readFileSync(path.join(root,'phase56-lab.html'),'utf8');
const ui=fs.readFileSync(path.join(root,'phase56-lab-v01.js'),'utf8');
for(const id of ['scene','style','duration','seed','generate','export','results','tracks','rate','report'])
 assert.match(page,new RegExp('id="'+id+'"'));
for(const module of ['handheld-v21.js','phase5-whole-song-audit-v01.js','phase6-evaluation-v01.js','phase56-integration-v01.js','phase56-lab-v01.js'])
 assert(page.includes('src="'+module+'"'));
assert.match(ui,/runner\.generate\(input,seed,\{pcm:false\}\)/);
assert.match(ui,/engine\.render\(entry\.plan\)/);
assert.match(ui,/recordListening/);
assert.match(ui,/\.wavBlob/);
console.log('PASS Phase 6 four-condition audible entry point and review export');

assert.match(page,/id="cadencePitch"/);
assert.match(ui,/proposeCadenceRepair/);
assert.match(ui,/engine\.render\(entry\.plan,repair\.score\)/);
