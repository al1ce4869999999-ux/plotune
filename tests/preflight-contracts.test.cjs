const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app-v13.js'),'utf8');
const ui=fs.readFileSync(path.join(root,'tests/ui-v13.test.cjs'),'utf8');
const failures=[];
const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(x=>x[1]);
for(const src of scripts){
 const filename=src.split('?')[0];
 if(!fs.existsSync(path.join(root,filename)))failures.push('HTML references missing script: '+filename);
}
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
for(const match of app.matchAll(/\$\('([^']+)'\)/g)){
 if(!ids.has(match[1]))failures.push('app-v13.js references absent HTML ID: '+match[1]);
}
const testIds=new Set([...ui.matchAll(/'([a-zA-Z][a-zA-Z0-9]+)'/g)].map(x=>x[1]));
for(const match of app.matchAll(/\$\('([^']+)'\)/g)){
 if(!testIds.has(match[1]))failures.push('ui-v13 mock misses app ID: '+match[1]);
}
const testDir=path.join(root,'tests');
for(const file of fs.readdirSync(testDir).filter(x=>x.endsWith('.test.cjs'))){
 const source=fs.readFileSync(path.join(testDir,file),'utf8');
 // Exact script-src string checks do not recognize the browser's version query.
 for(const m of source.matchAll(/html\.includes\('src="([^"]+\.js)"'\)/g)){
  const actual=scripts.find(x=>x.split('?')[0]===m[1]);
  if(actual&&actual!==m[1])failures.push(file+': hard-coded script src without cache query: '+m[1]);
 }
}
if(failures.length){console.error('Preflight contract violations:\n'+[...new Set(failures)].map(x=>' - '+x).join('\n'));process.exitCode=1;}
else console.log('PASS preflight: HTML assets, current UI IDs and mocked IDs, versioned script references');
