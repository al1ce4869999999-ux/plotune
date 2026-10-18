/* Plotune v1.2 Zeta export: true AAC/MP4 signature, 30+ sec, no API */
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),window={};
const script=fs.readFileSync(path.join(root,'zeta-export-v12.js'),'utf8');
vm.runInNewContext(script,{window,Blob,Uint8Array,ArrayBuffer,console,setTimeout,clearTimeout,setInterval,clearInterval});
const Z=window.PlotuneZetaExport;
const mp4Header=()=>new Blob([new Uint8Array([0,0,0,24,102,116,121,112,77,52,65,32,0,0,0,0])],{type:'audio/mp4'});
const fake={samples:new Float32Array(30*22050),sampleRate:22050};
assert.equal(Z.checkTrack(null).ok,false);
assert.equal(Z.checkTrack({...fake,samples:new Float32Array(15*22050)}).ok,false);
assert.equal(Z.checkTrack(fake).ok,true);
assert.equal(Z.checkTrack({...fake,samples:new Float32Array(60*22050)}).ok,true);
assert.equal(Z.checkTrack({...fake,samples:new Float32Array(301*22050)}).ok,false);
assert.equal(Z.MAX_BYTES,20*1024*1024);
assert.equal(Z.filename('ぽんぽん:得意げ','m4a'),'ぽんぽん_得意げ_Zeta.m4a');
assert.equal(Z.supported(undefined),null);
class Unsupported{static isTypeSupported(x){return false}}
assert.equal(Z.supported(Unsupported),null);
class Recorder{
 static isTypeSupported(x){return x==='audio/mp4'}
 constructor(stream,opts){this.stream=stream;this.opts=opts;this.mimeType=opts.mimeType;this.state='inactive'}
 start(){this.state='recording'}
 stop(){this.state='inactive';this.ondataavailable?.({data:mp4Header()});this.onstop?.()}
}
assert.equal(Z.supported(Recorder).extension,'m4a');
class FakeAudio{
 constructor(){this.sampleRate=44100;this.currentTime=0;this.destination={}}
 createMediaStreamDestination(){return{stream:{getTracks(){return[{stop(){}}]}}}}
 createBuffer(c,n,r){const floats=new Float32Array(n);return{copyToChannel(src){floats.set(src)},getChannelData(){return floats}}}
 createBufferSource(){const source={connect(){},disconnect(){},stop(){},start:()=>queueMicrotask(()=>{if(source.onended)source.onended()})};return source}
 async resume(){}
 async close(){}
}
(async()=>{
 assert.equal(await Z.checkSignature(mp4Header(),'mp4'),true);
 assert.equal(await Z.checkSignature(new Blob(['RIFFfakeWAV']), 'mp4'),false);
 assert.equal(await Z.checkSignature(new Blob([new Uint8Array([255,241,80])]),'aac'),true);
 await assert.rejects(()=>Z.encode(fake,{AudioContextClass:FakeAudio,Recorder:Unsupported}),/M4A\/AAC/);
 const result=await Z.encode(fake,{AudioContextClass:FakeAudio,Recorder});
 assert.equal(result.extension,'m4a');
 assert.equal(result.duration,30);
 assert.ok(result.blob.size>0);
 assert.equal(result.blob.type,'audio/mp4');
 console.log('PASS Zeta export: 30s validation, codec detection, MP4 signature, real MediaRecorder path, size, filename');
})().catch(e=>{console.error(e);process.exitCode=1});
