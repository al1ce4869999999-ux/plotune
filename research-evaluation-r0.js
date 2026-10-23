/* R0 read-only evaluation contract. No integration with generation RNG or sound output. */
(function(root){'use strict';
const VERSION='r0.1';
const object=v=>v!==null&&typeof v==='object';
function copy(v){if(Array.isArray(v))return v.map(copy);if(object(v)){const o={};for(const k of Object.keys(v))o[k]=copy(v[k]);return o;}return v;}
function finite(n){return typeof n==='number'&&Number.isFinite(n);}
function normalize(result){
 if(!result||!object(result))throw new TypeError('evaluation result must be an object');
 const metrics=copy(result.metrics||{}),diagnostics=copy(result.diagnostics||[]);
 if(!object(metrics)||Array.isArray(metrics)||!Array.isArray(diagnostics))throw new TypeError('invalid evaluation shape');
 for(const [k,v] of Object.entries(metrics))if(!finite(v))throw new TypeError('metric '+k+' must be finite');
 return {metrics,diagnostics};
}
function evaluate(evaluator,score,plan,context){
 if(typeof evaluator!=='function')throw new TypeError('evaluator must be a function');
 const inputs=[score,plan,context], before=inputs.map(v=>JSON.stringify(v));
 try{
  const result=normalize(evaluator(copy(score),copy(plan),copy(context)));
  if(inputs.some((v,i)=>JSON.stringify(v)!==before[i]))throw new Error('evaluation mutated input');
  return {version:VERSION,status:'ok',...result};
 }catch(error){return {version:VERSION,status:'fallback',metrics:{},diagnostics:[{code:'EVALUATOR_FAILED',message:String(error&&error.message||error)}]};}
}
function record(trace,assessment,reason){
 const base=object(trace)&&!Array.isArray(trace)?copy(trace):{};
 const entries=Array.isArray(base.researchEvaluations)?base.researchEvaluations:[];
 const safe=normalize(assessment);
 entries.push({version:VERSION,status:assessment.status==='ok'?'ok':'fallback',metrics:safe.metrics,diagnostics:safe.diagnostics,selectionReason:reason==null?null:String(reason)});
 base.researchEvaluations=entries;
 return base;
}
function compare(before,after){
 const a=JSON.stringify(before),b=JSON.stringify(after);
 return {equal:a===b,changed:a!==b};
}
root.PlotuneResearchEvaluation={VERSION,evaluate,record,compare};
})(typeof window!=='undefined'?window:globalThis);
