/* Phase 6: four-way controlled comparison, objective audit, blind listening
 * record. No fabricated perceptual scores; listener data is required.
 */
(function(root){
'use strict';
const CONDITIONS=['Baseline','Phase','M','Phase+M'];
function scoreSummary(score){
 if(!score||!Array.isArray(score.notes)||!Number.isFinite(score.duration))
  throw new TypeError('Each condition must contain a real score');
 const notes=score.notes;
 return {duration:score.duration,notes:notes.length,
  lead:notes.filter(n=>n.voice==='lead').length,
  density:score.duration>0?notes.length/score.duration:null,
  transitions:score.details?.transitions?.length||0};
}
function compare(cases,seed,options={}){
 if(!Number.isFinite(seed))throw new TypeError('seed must be finite');
 if(!cases||CONDITIONS.some(c=>!cases[c]))throw new TypeError('Four generated conditions required');
 const audit=options.audit;
 const results={};
 for(const condition of CONDITIONS){
  const entry=cases[condition];
  const summary=scoreSummary(entry.score);
  const review=typeof audit==='function'?audit(entry.plan||{},entry.score):null;
  results[condition]={summary,audit:review};
 }
 const baseline=results.Baseline.summary;
 const differences={};
 for(const condition of CONDITIONS.slice(1)){
  const s=results[condition].summary;
  differences[condition]={notes:s.notes-baseline.notes,
   lead:s.lead-baseline.lead,
   density:s.density-baseline.density,
   transitions:s.transitions-baseline.transitions};
 }
 return {schema:'plotune.phase6.comparison',version:1,seed,
  conditions:CONDITIONS.slice(),results,differences,
  listening:{status:'pending',ratings:[],verdict:null}};
}
function recordListening(comparison,ratings){
 if(!comparison||comparison.schema!=='plotune.phase6.comparison')
  throw new TypeError('Expected phase6 comparison');
 if(!Array.isArray(ratings)||ratings.length!==4||
    ratings.some(r=>!CONDITIONS.includes(r.condition)||
      !Number.isInteger(r.coherence)||r.coherence<1||r.coherence>5||
      !Number.isInteger(r.development)||r.development<1||r.development>5||
      !Number.isInteger(r.relisten)||r.relisten<1||r.relisten>5)||
    new Set(ratings.map(r=>r.condition)).size!==4)
  throw new TypeError('Four unique ratings, 1..5 for coherence/development/relisten, required');
 const result=JSON.parse(JSON.stringify(comparison));
 result.listening={status:'rated',ratings:ratings.map(r=>({
  condition:r.condition,coherence:r.coherence,development:r.development,
  relisten:r.relisten,notes:String(r.notes||'')
 })),verdict:null};
 return result;
}
const api={CONDITIONS,compare,recordListening};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.PlotunePhase6Evaluation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
