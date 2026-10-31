import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LocalStore} from '../src/lib/server/local-store';
import {executePlanCore,undoReceiptCore,type ExecutionServices} from '../src/lib/server/execution-core';
import type {Message,Decision} from '../src/lib/types';
async function fixture() {
 const local=new LocalStore(':memory:');
 const messages:Message[]=['m1','m2'].map(id=>({id,subject:'Disposable fixture',from:'test@example.invalid',date:'2026-01-01',labels:['INBOX','CATEGORY_PROMOTIONS']}));
 await local.from('quest_plans').insert({id:'p',user_id:'owner',messages,play_approved:true,expires_at:new Date(Date.now()+900000).toISOString()});
 const mailbox=new Map(messages.map(m=>[m.id,structuredClone(m)]));let writes=0;let failAt=0;let failAfterWrite=false;
 const services:ExecutionServices={store:local as unknown as ExecutionServices['store'],readMessage:async id=>structuredClone(mailbox.get(id)!),cleanupLabel:async()=> 'QuestLabel',googleFetch:async(path,init)=>{writes++;if(writes===failAt&&!failAfterWrite)throw new Error('Injected outage');const id=path.split('/')[1];const change=JSON.parse(init!.body as string);const m=mailbox.get(id)!;m.labels=[...new Set([...m.labels.filter(l=>!change.removeLabelIds.includes(l)),...change.addLabelIds])];if(writes===failAt&&failAfterWrite)throw new Error('Response lost after commit');return {};}};
 const decisions:Decision[]=[{id:'m1',action:'archive'},{id:'m2',action:'label'}];
 return {local,services,mailbox,decisions,writes:()=>writes,fail:(n:number,after=false)=>{failAt=n;failAfterWrite=after;}};
}
test('approved deltas verify, retry returns same receipt, and undo restores only quest changes',async()=>{
 const f=await fixture();const result=await executePlanCore('owner','p',f.decisions,f.services);assert.equal(result.status,'verified');assert.equal(result.xp,50);assert.equal(f.writes(),2);
 assert(!f.mailbox.get('m1')!.labels.includes('INBOX'));assert(f.mailbox.get('m2')!.labels.includes('QuestLabel'));
 await executePlanCore('owner','p',f.decisions,f.services);assert.equal(f.writes(),2);
 f.mailbox.get('m1')!.labels.push('UnrelatedLabel');
 const undo=await undoReceiptCore('owner','p',f.services);assert.equal(undo.status,'undone');assert.equal(undo.xp,0);
 assert(f.mailbox.get('m1')!.labels.includes('INBOX'));assert(f.mailbox.get('m1')!.labels.includes('UnrelatedLabel'));assert(!f.mailbox.get('m2')!.labels.includes('QuestLabel'));
 const n=f.writes();await undoReceiptCore('owner','p',f.services);assert.equal(f.writes(),n);f.local.sqlite.close();
});
test('lost response after Gmail commit gives no XP and recovery restores all recorded targets',async()=>{
 const f=await fixture();f.fail(2,true);const r=await executePlanCore('owner','p',f.decisions,f.services);assert.equal(r.status,'partial');assert.equal(r.xp,0);assert(f.mailbox.get('m2')!.labels.includes('QuestLabel'));
 await executePlanCore('owner','p',f.decisions,f.services);assert.equal(f.writes(),2);
 assert.equal((await undoReceiptCore('owner','p',f.services)).status,'undone');assert(!f.mailbox.get('m2')!.labels.includes('QuestLabel'));f.local.sqlite.close();
});
test('stale labels, wrong owner, expired plans and invalid IDs cannot cause writes',async()=>{
 const f=await fixture();await assert.rejects(executePlanCore('intruder','p',f.decisions,f.services));
 await assert.rejects(executePlanCore('owner','p',[{id:'outside',action:'archive'}],f.services));
 f.mailbox.get('m1')!.labels.push('STARRED');await assert.rejects(executePlanCore('owner','p',f.decisions,f.services),/changed|protected/);assert.equal(f.writes(),0);
 await f.local.from('quest_plans').update({expires_at:'2000-01-01'}).eq('id','p');await assert.rejects(executePlanCore('owner','p',f.decisions,f.services),/expired/);f.local.sqlite.close();
});
test('concurrent duplicate triggers cause one execution; no-op choices grant zero XP',async()=>{
 const f=await fixture();const results=await Promise.allSettled([executePlanCore('owner','p',f.decisions,f.services),executePlanCore('owner','p',f.decisions,f.services)]);assert(results.some(r=>r.status==='fulfilled'));assert.equal(f.writes(),2);f.local.sqlite.close();
 const g=await fixture();const result=await executePlanCore('owner','p',g.decisions.map(d=>({...d,action:'keep' as const})),g.services);assert.equal(result.xp,0);assert.equal(result.count,0);assert.equal(g.writes(),0);g.local.sqlite.close();
});
test('a plan without pre-game approval cannot execute any action',async()=>{
 const f=await fixture();await f.local.from('quest_plans').update({play_approved:false}).eq('id','p');
 await assert.rejects(executePlanCore('owner','p',f.decisions,f.services),/Approve the quest scope/);assert.equal(f.writes(),0);f.local.sqlite.close();
});
test('a failed first operation grants no XP; undo can be retried after interruption',async()=>{
 const f=await fixture();f.fail(1);const failed=await executePlanCore('owner','p',f.decisions,f.services);assert.equal(failed.status,'partial');assert.equal(failed.xp,0);assert(f.mailbox.get('m1')!.labels.includes('INBOX'));
 f.fail(2);assert.equal((await undoReceiptCore('owner','p',f.services)).status,'partial');
 assert.equal((await undoReceiptCore('owner','p',f.services)).status,'undone');f.local.sqlite.close();
});
test('verification mismatch and protected-folder undo never produce false success',async()=>{
 const f=await fixture();f.services.googleFetch=async()=>({});const r=await executePlanCore('owner','p',f.decisions,f.services);assert.equal(r.status,'partial');assert.equal(r.xp,0);
 f.mailbox.get('m1')!.labels.push('TRASH');assert.equal((await undoReceiptCore('owner','p',f.services)).status,'partial');f.local.sqlite.close();
});
test('fresh execution heartbeat blocks undo even for an older receipt',async()=>{
 const f=await fixture();await f.local.from('quest_receipts').insert({id:'p',user_id:'owner',status:'executing',count:0,changes:[],detail:'active',created_at:'2000-01-01',updated_at:new Date().toISOString()});
 await assert.rejects(undoReceiptCore('owner','p',f.services),/still in progress/);assert.equal(f.writes(),0);f.local.sqlite.close();
});
test('a delayed execution cannot overwrite a receipt already restored by recovery',async()=>{
 const f=await fixture();const original=f.services.googleFetch;
 f.services.googleFetch=async(path,init)=>{await original(path,init);f.mailbox.get('m1')!.labels.push('INBOX');await f.local.from('quest_receipts').update({status:'undone',detail:'Restored by another recovery worker'}).eq('id','p');return {};};
 const r=await executePlanCore('owner','p',[{id:'m1',action:'archive'},{id:'m2',action:'keep'}],f.services);
 assert.equal(r.status,'undone');assert.equal(r.xp,0);f.local.sqlite.close();
});
test('database unavailability is reported as unavailable, not a missing quest',async()=>{
 const f=await fixture();f.local.sqlite.close();
 await assert.rejects(executePlanCore('owner','p',f.decisions,f.services),(e:unknown)=>!!e&&typeof e==='object'&&'status' in e&&e.status===503);
});
