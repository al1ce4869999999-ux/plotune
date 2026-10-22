const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app-v13.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const handheld=fs.readFileSync(path.join(root,'handheld-v21.js'),'utf8');
assert.match(html,/id="phase3Comparison"/);
assert.match(app,/(?:if|else if)\(\$\('phase3Comparison'\)\?\.checked\)\{/);
assert.match(app,/base=\{\.\.\.base,motifDevelopment:true\}/);
assert.match(app,/enhanced=\{\.\.\.base,musicDevelopment:true,musicHarmony:true,musicVoices:true,musicPerformance:true\}/);
assert.match(app,/phase3\?'▶ Phase 3 OFF'/);
assert.match(app,/phase3\?'▶ Phase 3 ON'/);
for(const flag of ['musicDevelopment','musicHarmony','musicVoices','musicPerformance'])
 assert.match(handheld,new RegExp('plan\\.'+flag+'===true'));
console.log('PASS Phase 3 A/B control and M2-M5 flags');
