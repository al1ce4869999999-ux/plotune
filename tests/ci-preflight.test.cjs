/* Regression guard: HTML asset checks must accept versioned script URLs and select the real app entrypoint. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const test=fs.readFileSync('tests/resonare.test.cjs','utf8');
assert.match(test,/\/src="app-v13\.js\(\?:/,'asset manifest must recognize query-versioned app entrypoints');
assert.ok(/src="app-v13\.js(?:\?[^\"]*)?"/.test(html),'current app entrypoint not found');
for(const file of ['analyzer.js','resonare-v08.js','composer-v04.js','app-v13.js'])assert.ok(html.includes('src="'+file+'"')||html.includes('src="'+file+'?'),'missing runtime asset '+file);
console.log('PASS: CI asset preflight and versioned entrypoint');
