const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{},Blob,console};
for(const name of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js',
 'motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js',
 'm3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
}
const M=context.window.PlotuneM5Performance,H=context.window.PlotuneHandheld,A=context.window.PlotuneAnalysis;
const notes=[{t:1,d:.4,midi:72,volume:.15,voice:'lead',timbre:'flute'},
 {t:3,d:.8,midi:74,volume:.14,voice:'lead',timbre:'flute'},
 {t:12,d:.7,midi:76,volume:.15,voice:'lead',timbre:'flute'},
 {t:1,d:.5,midi:60,volume:.10,voice:'chords',timbre:'softpiano'}];
const args={notes,duration:16,meter:16,seed:123,wholeTrackArc:[{stage:'development'}]};
const before=JSON.stringify(notes),a=M.express(args);
assert.equal(JSON.stringify(a),JSON.stringify(M.express(args)),'seed deterministic');
assert.equal(JSON.stringify(notes),before,'pure original unchanged');
assert.ok(a.details.dynamics>0&&a.details.rubato>0&&a.details.breaths>0,'expression applied');
assert.ok(a.notes.every(n=>n.t>=0&&n.d>=.04&&n.t+n.d<=16+.001),'time valid');
assert.throws(()=>M.express({notes:[],duration:0,meter:1}),/valid timing/);
const input={title:'M5',character:'静かな旅人',world:'森',scene:'森の道を歩く',style:'handheld',duration:30};
const plan=A.plan(input,A.analyze(input));
for(const style of ['journey','forestflute','musicbox']){
 const base={...H.prepare(plan,style,null,false,input.scene),motifDevelopment:true,musicDevelopment:true,musicHarmony:true,musicVoices:true};
 const off=H.score(base),on=H.score({...base,musicPerformance:true});
 assert.equal(JSON.stringify(off.harmony),JSON.stringify(on.harmony),'same harmony '+style);
 assert.ok(on.details.performance?.dynamics>0,'M5 metadata '+style);
 assert.notEqual(JSON.stringify(off.notes),JSON.stringify(on.notes),'M5 affects score '+style);
 assert.equal(JSON.stringify(on.notes),JSON.stringify(H.score({...base,musicPerformance:true}).notes),'seed stability '+style);
 assert.equal(JSON.stringify(off.notes),JSON.stringify(H.score(base).notes),'M5 OFF stable '+style);
 assert.ok(on.notes.every(n=>n.t>=0&&n.d>0&&n.t+n.d<=on.duration+.001),'all valid '+style);
}
const base={...H.prepare(plan,'journey',null,false,input.scene),motifDevelopment:true,musicDevelopment:true,musicHarmony:true,musicVoices:true};
const off=H.render(base),on=H.render({...base,musicPerformance:true});
assert.equal(off.samples.length,on.samples.length,'equal length');
let diff=0;
for(let i=0;i<off.samples.length;i+=199)diff+=Math.abs(off.samples[i]-on.samples[i]);
assert.ok(diff>1,'actual PCM difference');
const html=fs.readFileSync(path.join(root,'impression-lab.html'),'utf8');
assert.match(html,/value="m5"/,'M5 mode visible');
assert.match(html,/tracks\.A=buildM5\(\$\('characterA'\)\.value,false\)/,'same character OFF');
assert.match(html,/tracks\.B=buildM5\(\$\('characterA'\)\.value,true\)/,'same character ON');
for(const file of ['index.html','impression-lab.html'])
 assert.match(fs.readFileSync(path.join(root,file),'utf8'),/m5-performance-v01\.js/,'asset loaded');
console.log('PASS M5 deterministic expression, A/B, PCM, compatibility');
