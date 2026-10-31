import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LocalStore} from '../src/lib/server/local-store';
import {mkdtempSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('local database isolates owners, round-trips JSON and claims once',async()=>{
 const s=new LocalStore(':memory:');
 assert.equal((await s.from('quest_plans').insert({id:'p',user_id:'alice',messages:[{id:'m'}],expires_at:'2099-01-01'})).error,null);
 const other=await s.from('quest_plans').select('*').eq('id','p').eq('user_id','bob').maybeSingle();assert.equal(other.data,null);
 const a=await s.from('quest_plans').update({claimed:true}).eq('id','p').eq('user_id','alice').eq('claimed',false).select();
 const b=await s.from('quest_plans').update({claimed:true}).eq('id','p').eq('user_id','alice').eq('claimed',false).select();
 assert.equal((a.data as unknown[]).length,1);assert.equal((b.data as unknown[]).length,0);
 assert.deepEqual((a.data as Record<string,unknown>[])[0].messages,[{id:'m'}]);
 assert.equal((await s.from('quest_plans').insert({id:'p',user_id:'alice',messages:[],expires_at:'2099'})).data,null);
 s.sqlite.close();
});
test('local receipts update correctly and AI budget is account scoped',async()=>{
 const s=new LocalStore(':memory:');
 await s.from('quest_receipts').insert({id:'r',user_id:'alice',status:'verified',count:2,changes:[{id:'m',add:['x'],remove:[]}],detail:'verified'});
 const r=await s.from('quest_receipts').update({status:'undone'}).eq('id','r').eq('user_id','alice').eq('status','verified').select().single();
 assert.equal((r.data as Record<string,unknown>).status,'undone');
 for(let i=0;i<10;i++)assert.equal((await s.rpc('claim_quest_generation',{owner_id:'alice'})).data,true);
 assert.equal((await s.rpc('claim_quest_generation',{owner_id:'alice'})).data,false);
 assert.equal((await s.rpc('claim_quest_generation',{owner_id:'bob'})).data,true);
 s.sqlite.close();
});
test('plans and receipts survive closing and reopening a disk database',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'questos-audit-'));const path=join(directory,'test.sqlite');
 const first=new LocalStore(path);await first.from('quest_plans').insert({id:'persist',user_id:'owner',messages:[{id:'test'}],expires_at:'2099-01-01'});first.sqlite.close();
 const second=new LocalStore(path);const result=await second.from('quest_plans').select().eq('id','persist').eq('user_id','owner').single();assert.deepEqual((result.data as Record<string,unknown>).messages,[{id:'test'}]);second.sqlite.close();
 unlinkSync(path);rmdirSync(directory);
});
