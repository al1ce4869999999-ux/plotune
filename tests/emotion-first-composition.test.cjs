const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),window={},ctx={window,Blob,console};
for(const file of ['analyzer.js','composer-v04.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const A=window.PlotuneAnalysis,C=window.PlotuneComposerV4;
const input={title:'emotion form',character:'',world:'',scene:'別れを悲しみ、物音に怯え、最後には安心した。',style:'piano',duration:30};
const plan=A.plan(input,A.analyze(input));
const neutral=C.buildScore(plan);
const emotionPlan={...plan,emotionComposition:true,emotionPlan:{sections:plan.sections.map((section,i)=>({...section,target:{sadness:i===0?.95:0,tension:i===1?.95:0,tenderness:i===3?.9:0,joy:i===2?.95:0}}))}};
const expressive=C.buildScore(emotionPlan);
assert.equal(neutral.details.emotionForm,null);
assert.ok(expressive.details.emotionForm.length>=4);
assert.ok(new Set(expressive.details.emotionForm.slice(0,4).map(x=>x.chord)).size>1,'emotion must guide harmony');
const b=240/plan.bpm;
const lead=Array.from({length:4},(_,k)=>expressive.notes.filter(n=>n.role==='lead'&&n.t>=k*b-.0001&&n.t<(k+1)*b-.0001).map(n=>n.midi));
assert.equal(new Set(lead.map(x=>JSON.stringify(x))).size,4,'four-bar development differs by pitch/rhythm');
assert.ok(expressive.notes.some(n=>n.role==='countermelody'),'counter voice must answer lead');
const answers=expressive.notes.filter(n=>n.role==='countermelody');
assert.ok(answers.length>0,'answer notes exist');
for(const answer of answers){
 const phraseBar=Math.floor(answer.t/b);
 const position=(answer.t-phraseBar*b)/(b/8);
 assert.ok([2.1,4.1,5.1].some(x=>Math.abs(position-x)<.02),'answer should start in a phrase rest');
 const simultaneous=expressive.notes.some(n=>n.role==='lead'&&Math.abs(n.t-answer.t)<.0001);
 assert.equal(simultaneous,false,'answer must not double the lead onset');
}

assert.notDeepEqual(expressive.notes,neutral.notes);
assert.deepEqual(C.buildScore(emotionPlan).notes,expressive.notes,'deterministic');
assert.deepEqual(C.buildScore(plan).notes,neutral.notes,'OFF unaffected');
assert.ok(expressive.notes.every(n=>n.d>0&&n.t>=0&&n.t+n.d<=plan.duration+.001));
console.log('PASS emotion-first composition: harmony, phrase development, countervoice, determinism, OFF stability');
