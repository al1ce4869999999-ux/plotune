const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!html.includes('src="app-v062.js"')){
 console.log('SKIP v0.6.2 cache regression: v0.7 is active');
 process.exit(0);
}
const app=fs.readFileSync(path.join(root,'app-v062.js'),'utf8');
assert.ok(html.includes('src="app-v062.js"'));
assert.ok(!html.includes('src="app-v06.js"'));
assert.equal((html.match(/id="classicPlay"/g)||[]).length,1);
assert.equal((html.match(/id="resonarePlay"/g)||[]).length,1);
assert.ok(html.indexOf('id="classicPlay"')<html.indexOf('id="play"'));
assert.ok(html.includes('id="runtimeVersion"'));
assert.ok(html.includes('id="playerHint"'));
assert.ok(app.includes("await compare();"));
assert.ok(app.includes("$('runtimeVersion').textContent="));
assert.ok(app.includes("$('comparison').hidden=false;"));
console.log('PASS v0.6.2: fresh script asset, visible paired controls, one-tap dual-track generation');
