const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','song-form-v01.js'),'utf8'),{window});const plan=window.PlotuneSongForm.plan;
for(const [seconds,expected] of [[10,['intro','A','returnA']],[30,['intro','A','B','returnA']],[60,['intro','A','Aprime','B','returnA']]]){
 const a=plan({duration:seconds,title:'test'}),b=plan({duration:seconds,title:'test'});
 assert.equal(JSON.stringify(a),JSON.stringify(b),'deterministic');
 assert.equal(JSON.stringify(a.sections.map(x=>x.id)),JSON.stringify(expected));
 assert.equal(a.sections[0].start,0);assert.equal(a.sections.at(-1).end,seconds);
 for(let i=0;i<a.sections.length;i++){const s=a.sections[i];assert.ok(s.duration>0);assert.ok(s.tensionStart>=0&&s.tensionEnd<=1);assert.ok(s.reason);if(i)assert.equal(s.start,a.sections[i-1].end);}
 assert.equal(a.diagnostics.audioGenerated,false);
}
for(const duration of [0,-1,NaN,Infinity])assert.throws(()=>plan({duration}),{name:'RangeError',message:'duration must be positive and finite'});
console.log('PASS phase1 song form: duration, continuity, tension, diagnostics, determinism');
