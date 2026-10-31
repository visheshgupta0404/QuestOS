import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateQuest} from '../src/lib/quest-engine';
import {recommendCleanup} from '../src/lib/recommendations';
const story={title:'Guard the gates',briefing:'Review two old promotions before clearing the castle gates.',victory:'Your decisions are ready for review.'};
const valid=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(story)}]}}]});
test('Gemini sends schema and anonymous task counts, returning validated narrative only',async()=>{
 let payload:Record<string,unknown>={};
 const fetcher:typeof fetch=async(_url,init)=>{payload=JSON.parse(init!.body as string);return valid();};
 const result=await generateQuest('inbox',2,{key:'test-key',model:'test-model',fetcher});assert.equal(result.source,'gemini');assert.equal(result.title,story.title);
 assert('responseJsonSchema' in (payload.generationConfig as object));assert(!('tools' in payload));
 const userPart=(payload.contents as {parts:{text:string}[]}[])[0].parts[0].text;
 assert.deepEqual(JSON.parse(userPart),{module:'inbox',count:2});
 assert(JSON.stringify(payload).includes('inbox'));assert(!JSON.stringify(payload).includes('test@example'));
});
test('transient service errors retry once and permanent failures fall back immediately',async()=>{
 let calls=0;const transient:typeof fetch=async()=>++calls===1?new Response('',{status:503}):valid();
 assert.equal((await generateQuest('files',6,{key:'k',model:'m',fetcher:transient,pause:async()=>{}})).source,'gemini');assert.equal(calls,2);
 calls=0;const forbidden:typeof fetch=async()=>{calls++;return new Response('',{status:403});};assert.equal((await generateQuest('inbox',2,{key:'k',model:'m',fetcher:forbidden})).source,'rules');assert.equal(calls,1);
});
test('malformed, truncated, extra operation fields and network failure never invent completion',async()=>{
 for(const text of ['not JSON',JSON.stringify({...story,execute:'archive-all'}),JSON.stringify({...story,briefing:'short'})]){
  let calls=0;const bad:typeof fetch=async()=>{calls++;return Response.json({candidates:[{content:{parts:[{text}]}}]});};
  const result=await generateQuest('files',3,{key:'k',model:'m',fetcher:bad,pause:async()=>{}});assert.equal(result.source,'rules');assert.equal(calls,2);
 }
 const fail:typeof fetch=async()=>{throw new Error('network');};assert.equal((await generateQuest('inbox',2,{key:'k',model:'m',fetcher:fail,pause:async()=>{}})).source,'rules');
 const truncated:typeof fetch=async()=>Response.json({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:JSON.stringify(story)}]}}]});assert.equal((await generateQuest('files',2,{key:'k',model:'m',fetcher:truncated})).source,'rules');
});
test('timeouts propagate AbortSignal and fall back without task actions',async()=>{
 const aborting:typeof fetch=async(_u,init)=>new Promise((_resolve,reject)=>{init!.signal!.addEventListener('abort',()=>reject(new Error('aborted')));setTimeout(()=>reject(new Error('test timer')),50);});
 assert.equal((await generateQuest('inbox',2,{key:'k',model:'m',fetcher:aborting,timeoutMs:5,pause:async()=>{}})).source,'rules');
});
test('cleanup recommendations protect important mail and retain likely receipts',()=>{
 const base={from:'fixture@example.invalid',date:'2026-01-01',labels:['INBOX','CATEGORY_PROMOTIONS']};
 const r=recommendCleanup([{...base,id:'1',subject:'Sale ends today'},{...base,id:'2',subject:'Your invoice'},{...base,id:'3',subject:'Promo',labels:[...base.labels,'STARRED']}]);
 assert.deepEqual(r.map(x=>x.action),['archive','label','keep']);assert(r.every(x=>x.reason.length>10));
});
