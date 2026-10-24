const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
for(const file of ['analyzer.js','m-comparison-v01.js','m-contract-v01.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const input={title:'主題',character:'やさしい',world:'森',scene:'ひかりが差し込む。',style:'piano',duration:'30'};
const a=ctx.window.PlotuneAnalysis,p=a.plan(input,a.analyze(input),0);
const c=ctx.window.PlotuneMContract,m=ctx.window.PlotuneMComparison;
const modes=m.modes(p);
for(const [name,candidate] of Object.entries(modes)){
 const result=c.create(candidate,{musicDevelopment:candidate.musicDevelopment});
 assert.equal(result.seed,p.seed,name);
 assert.equal(result.enabled,name==='mOnly'||name==='combined');
 assert.equal(result.sections.length,p.emotionPlan.sections.length);
 assert.equal(result.sections[0].sectionId,'section-1');
 assert.equal(result.schema,'plotune.composition-contract');
 assert.equal(result.version,1);
}
const before=JSON.stringify(p),out=c.create(p);
out.sections[0].emotionTarget.wonder=0.999;
assert.equal(JSON.stringify(p),before,'contract must not mutate source');
assert.throws(()=>c.create({...p,seed:1.5}),/integer seed/);
assert.throws(()=>c.create(p,{sections:[{start:.9,end:.2}]}),/boundaries/);
assert.throws(()=>c.create(p,{sections:[{start:0,end:.6},{start:.5,end:1}]}),/overlapping/);
const custom=c.create(p,{musicDevelopment:true,sections:[{sectionId:'A',role:'presentation',start:0,end:1,motifReferences:['m1'],cadenceTarget:'authentic',voiceRoles:['lead']}]});
assert.equal(custom.sections[0].motifReferences[0],'m1');
assert.equal(custom.sections[0].cadenceTarget,'authentic');
console.log('PASS M0-3: separate Phase/M contract, boundaries and opt-in');
