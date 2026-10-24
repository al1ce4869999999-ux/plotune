const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
// Any accidental ambient RNG usage is a failure, including in prepare/analysis.
const math=Object.create(Math);math.random=()=>{throw Error('ambient RNG forbidden');};
const context={window:{},Blob,console,Math:math};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','story-structure-v01.js',
 'music-psychology-v01.js','motif-planner-v01.js','melodic-grammar-v01.js','m2-emotion-phrase-v01.js',
 'm3-harmony-melody-v01.js','m4-voice-dialogue-v01.js','m5-performance-v01.js','handheld-v21.js','m6-quality-v01.js','m6-integration-v01.js','m7-generation-v01.js'])
 vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const m=context.window.PlotuneM7Generation,deps=m.dependenciesFromRoot();
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const fingerprint=t=>({notes:hash(JSON.stringify(t.score.notes)),pcm:hash(Buffer.from(t.samples.buffer,t.samples.byteOffset,t.samples.byteLength))});
const input={scene:'森の道を歩き、友との別れを思い出して涙をこらえる',character:'静かな旅人',world:'森',style:'handheld',gameStyle:'journey'};
for(const [duration,seed] of [[15,42],[30,0],[60,0xffffffff]]){
 const req=m.request({...input,duration},seed),plans=m.makePlans(req,deps);
 const base=JSON.stringify(plans.map(p=>{const x={...p.plan};for(const k of Object.keys(p.config.flags))delete x[k];return x;}));
 const normalized=JSON.parse(base);for(const p of normalized)assert.deepEqual(p,normalized[0],'only treatment flags differ');
 assert.notEqual(plans[0].plan.structure,plans[1].plan.structure,'nested data isolated');
 const before=JSON.stringify(plans),first=m.generate({...input,duration},seed);
 const fingerprints=new Map(first.tracks.map(t=>[t.conditionId,fingerprint(t.track)]));
 for(const {conditionId,plan} of [...plans].reverse()){
  const actual=deps.handheld.render(plan);
  assert.deepEqual(fingerprint(actual),fingerprints.get(conditionId),'order independent notes and full PCM '+conditionId);
  assert(actual.samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=1),'bounded finite PCM');
  assert.equal(actual.samples.length,duration*actual.sampleRate);
 }
 assert.equal(JSON.stringify(plans),before,'render leaves all prepared plans unchanged');
 assert.equal(new Set([...fingerprints.values()].map(f=>f.notes)).size,4,'all four rendered note sets differ');
 assert.equal(new Set([...fingerprints.values()].map(f=>f.pcm)).size,4,'all four PCM buffers differ');
 const repeat=m.makePlans(req,deps);assert.equal(JSON.stringify(repeat),before,'same request regenerates same plans');
 console.log('PASS M7 real engine',JSON.stringify({duration,seed,fingerprints:Object.fromEntries(fingerprints)}));
}

for(const [duration,seed] of [[15,42],[30,0],[60,0xffffffff]]){
 const off=m.generate({...input,duration},seed);
 const on=m.generate({...input,duration},seed,undefined,{m6Repair:true});
 assert.equal(on.tracks.length,4);
 assert(on.tracks[0].m6Report===null&&on.tracks[1].m6Report===null,'control tracks must remain untreated');
 assert(on.tracks[2].m6Report&&on.tracks[3].m6Report,'M tracks must emit repair audit');
 for(const id of ['baseline','phase']){
  const a=off.tracks.find(t=>t.conditionId===id).track,b=on.tracks.find(t=>t.conditionId===id).track;
  assert.deepEqual(fingerprint(a),fingerprint(b),'M6 ON leaves non-M control PCM and notes unchanged');
 }
 for(const t of on.tracks){
  assert.equal(t.track.samples.length,duration*t.track.sampleRate);
  assert(t.track.samples.every(Number.isFinite));
 }
 const second=m.generate({...input,duration},seed,undefined,{m6Repair:true});
 for(let i=0;i<4;i++)assert.deepEqual(fingerprint(on.tracks[i].track),fingerprint(second.tracks[i].track),'M6 ON reproducible');
 console.log('PASS M7 real engine M6 opt-in',duration,seed);
}
