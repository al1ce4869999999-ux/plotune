/* R4a: diagnostic-only, deterministic motif identity and independent novelty. UNEXECUTED. */
(function(root){'use strict';
const VERSION='r4a.1';
const ROLES=Object.freeze({
 statement:{identity:[.72,1],novelty:[0,.42]},
 variation:{identity:[.52,1],novelty:[.16,.70]},
 development:{identity:[.35,.82],novelty:[.28,.88]},
 contrast:{identity:[0,.58],novelty:[.55,1]},
 return:{identity:[.68,1],novelty:[0,.48]}
});
const clamp=x=>Math.max(0,Math.min(1,x));
const round=x=>Math.round(x*1e6)/1e6;
function events(value){return Array.isArray(value)?value:value?.events??value?.notes;}
function pitches(value){return events(value).filter(x=>!x.rest).map(x=>x.degree??x.midi??x.pitch);}
function assess(origin,variant,opts={}){
 if(!root.PlotuneMotifSimilarityEvaluator)throw new Error('R1 motif evaluator unavailable');
 const role=opts.role??'variation';
 if(!Object.hasOwn(ROLES,role))throw new RangeError('invalid role');
 const base=events(origin),next=events(variant);
 if(!Array.isArray(base)||!Array.isArray(next))throw new TypeError('events required');
 const comparison=root.PlotuneMotifSimilarityEvaluator.compare(origin,variant);
 const m=comparison.metrics;
 const identity=round(clamp(.19*m.contour+.20*m.interval+.20*m.transposedPitch+.12*m.rhythm+.11*m.anchor+.09*m.transport+.09*m.coverage));
 const a=pitches(origin),b=pitches(variant);
 const min=Math.min(a.length,b.length),shift=min?b[0]-a[0]:0;
 const transpose=min?clamp(Math.abs(shift)/12):0;
 const rhythmChange=1-m.rhythm;
 const intervalChange=1-m.interval;
 const structuralChange=1-m.coverage;
 const restChange=1-m.restPattern;
 const accentChange=m.accent===undefined?0:1-m.accent;
 const inversion=min>2&&a.slice(1,min).some((x,i)=>Math.sign(x-a[i])!==Math.sign(b[i+1]-b[i]))?1:0;
 // Novelty is a separate feature-change vector: it is NOT 1 - identity or expectancy IC.
 const novelty=round(clamp(.22*transpose+.22*rhythmChange+.22*intervalChange+.17*structuralChange+.09*restChange+.04*accentChange+.04*inversion));
 const band=ROLES[role],distance=(n,[lo,hi])=>n<lo?round(lo-n):n>hi?round(n-hi):0;
 const identityDistance=distance(identity,band.identity),noveltyDistance=distance(novelty,band.novelty);
 const retained=Object.entries({contour:m.contour,interval:m.interval,rhythm:m.rhythm,anchor:m.anchor,transport:m.transport}).filter(([,v])=>v>=.8).map(([k])=>k);
 const changed=Object.entries({absolutePitch:m.absolutePitch,rhythm:m.rhythm,interval:m.interval,coverage:m.coverage,restPattern:m.restPattern}).filter(([,v])=>v<.8).map(([k])=>k);
 return {version:VERSION,role,motifId:opts.motifId??null,identity,novelty,identityBand:[...band.identity],noveltyBand:[...band.novelty],
  identityDistance,noveltyDistance,withinTarget:identityDistance===0&&noveltyDistance===0,
  operations:{transpose:shift,fragmentation:a.length!==b.length,inversion:!!inversion,rhythmChanged:rhythmChange>.001},
  retained,changed,r1:{version:comparison.version,metrics:{...m},diagnostics:comparison.diagnostics},
  r3:opts.r3Assessment??null,diagnostics:['Novelty is a structural feature-change measure independent of R1 identity and R3 surprise','Bands are provisional engineering hypotheses, not psychophysical thresholds']};
}
root.PlotuneIdentityNoveltyR4={VERSION,ROLES,assess};
})(typeof window!=='undefined'?window:globalThis);
