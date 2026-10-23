const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const ctx={window:{},console,Blob};
for(const file of ['analyzer.js','resonare-v08.js','loop-arranger-v09.js','melodic-grammar-v01.js','handheld-v21.js','research-evaluation-r0.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const w=ctx.window,evaluation=w.PlotuneResearchEvaluation;
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const scoreHash=s=>digest(Buffer.from(JSON.stringify(s.notes)));
const pcmHash=t=>digest(Buffer.from(t.samples.buffer,t.samples.byteOffset,t.samples.byteLength));
const input={title:'R0 baseline',character:'旅人',world:'森',scene:'森を歩いて記憶を思い出す。',style:'handheld'};
const modes=[
 ['baseline',false,false],['phase',true,false],['m',false,true],['phase-m',true,true]
];
for(const duration of [15,30,60]){
 const req={...input,duration};
 const raw=w.PlotuneAnalysis.plan(req,w.PlotuneAnalysis.analyze(req),0);
 const common=w.PlotuneHandheld.prepare({...raw,seed:42,characterSeed:42,duration},'journey',null,false,req.scene);
 for(const [name,phase,m] of modes){
  const plan={...common,motifDevelopment:phase,musicDevelopment:m,musicHarmony:m,musicVoices:m,musicPerformance:m,seed:42,characterSeed:42,duration};
  const original=JSON.stringify(plan);
  const before=w.PlotuneHandheld.render(plan);
  const evaluationResult=evaluation.evaluate((score,selection,context)=>{
   if(context.condition!==name)throw Error('wrong condition');
   return {metrics:{noteCount:score.notes.length,pcmFrames:context.pcmFrames},diagnostics:[]};
  },before.score,plan,{condition:name,pcmFrames:before.samples.length});
  assert.equal(evaluationResult.status,'ok',name);
  const traced=evaluation.record({version:'0.1'},evaluationResult,'diagnostic only');
  assert.equal(traced.researchEvaluations.length,1);
  const after=w.PlotuneHandheld.render(plan);
  assert.equal(scoreHash(before.score),scoreHash(after.score),'score OFF/ON '+name+' '+duration);
  assert.equal(pcmHash(before),pcmHash(after),'PCM OFF/ON '+name+' '+duration);
  assert.equal(before.samples.length,duration*before.sampleRate);
  assert(before.samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=1));
  assert.equal(JSON.stringify(plan),original,'no plan mutation '+name);
  console.log('PASS R0 baseline',name,duration,scoreHash(before.score),pcmHash(before));
 }
}
