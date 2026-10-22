const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../motif-planner-v01.js'),'utf8'),context);
const P=context.window.PlotuneMotifPlanner;
const original=[{position:0,durationUnits:2,degree:3,rest:false},{position:2,durationUnits:1,degree:5,rest:false},{position:4,durationUnits:2,degree:4,rest:true},{position:8,durationUnits:2,degree:6,rest:false},{position:12,durationUnits:3,degree:2,rest:false}];
const motif=P.capture(original);
assert.equal(motif.contour.length,4);
assert.equal(motif.anchors.length,2);
const theme=P.transform(motif,'statement');
const varied=P.transform(motif,'variation');
const contrast=P.transform(motif,'contrast');
const returnA=P.transform(motif,'return');
assert.equal(JSON.stringify(theme.events),JSON.stringify(original));
assert.notEqual(JSON.stringify(varied.events),JSON.stringify(theme.events));
assert.notEqual(JSON.stringify(contrast.events),JSON.stringify(theme.events));
assert.equal(returnA.events[returnA.events.length-1].degree,motif.anchors[0].degree);
assert.equal(JSON.stringify(P.transform(motif,'variation')),JSON.stringify(varied),'deterministic');
for(const result of [theme,varied,contrast,returnA]){
 assert.ok(result.events.some(x=>!x.rest));
 assert.ok(result.events.every(x=>x.position>=0&&x.position+x.durationUnits<=16.001&&x.durationUnits>0&&x.degree>=0&&x.degree<=8));
}
assert.throws(()=>P.capture([{position:0,durationUnits:0,degree:2,rest:false}]));
assert.throws(()=>P.transform(motif,'unknown'));
console.log('PASS phase2 motif: identity, variation, contrast, return, bounds and determinism');
