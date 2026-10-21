/* Plotune Phase 1: deterministic, score-independent whole-song form planning. */
(function(root){'use strict';
const LABELS={intro:'導入',A:'主題A',Aprime:'変奏A′',B:'対比B',returnA:'回帰A'};
function plan(input={}){
 const duration=Number(input.duration);
 if(!Number.isFinite(duration)||duration<=0)throw new RangeError('duration must be positive and finite');
 const seed=String(input.seed??input.title??'plotune');
 const n=duration<20?3:duration<45?4:5;
 const types=n===3?['intro','A','returnA']:n===4?['intro','A','B','returnA']:['intro','A','Aprime','B','returnA'];
 const weights=n===3?[1,3,2]:n===4?[1,3,3,2]:[1,3,2,3,2];
 const targets={intro:[.12,.22],A:[.32,.48],Aprime:[.48,.64],B:[.65,.92],returnA:[.3,.16]};
 const sum=weights.reduce((a,b)=>a+b,0);
 let start=0;
 const sections=types.map((type,i)=>{
   const end=i===types.length-1?duration:duration*weights.slice(0,i+1).reduce((a,b)=>a+b,0)/sum;
   const [from,to]=targets[type];
   const item={id:type,label:LABELS[type],start,end,duration:end-start,tensionStart:from,tensionEnd:to,
     reason:type==='intro'?'主題の前に導入を置く':type==='A'?'主題を提示する':type==='Aprime'?'主題を変化させる':type==='B'?'主題との対比を作り緊張の頂点を置く':'主題へ戻り緊張を解決する'};
   start=end;return item;
 });
 return {version:'1.0',seed,duration,sections,diagnostics:{rule:'duration-weighted-form-v1',sectionCount:n,omitted:Object.keys(LABELS).filter(x=>!types.includes(x)),peakSection:types.includes('B')?'B':'A',reason:'曲の長さに応じてセクション数を減らし、主題と回帰を維持する',audioGenerated:false}};
}
root.PlotuneSongForm={plan};
})(typeof window!=='undefined'?window:globalThis);
