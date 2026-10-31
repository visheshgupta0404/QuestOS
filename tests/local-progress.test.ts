import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoMailbox,changedDemoDecisions,parseLocalReceipts,mergeLocalReceipts,restoreDemoDraft,serializeDemoDraft} from '../src/lib/local-progress';
import type {Receipt} from '../src/lib/types';
const base:Receipt={id:'quest',title:'Demo',module:'inbox',mode:'demo',count:1,xp:25,createdAt:'2026-10-31T00:00:00Z',status:'verified',detail:'Simulated'};
test('keep preserves candidates, archive clears only the selected message and undo restores it',()=>{
 const r={...base,decisions:[{id:'demo-1',action:'archive' as const},{id:'demo-2',action:'keep' as const}]};
 const mailbox=demoMailbox([r]);assert.equal(mailbox.length,5);assert(mailbox.some(m=>m.id==='demo-2'));
 assert.equal(demoMailbox([{...r,status:'undone'}]).length,6);
});
test('labeling an already labeled sample grants no additional XP',()=>{
 const receipt={...base,decisions:[{id:'demo-1',action:'label' as const}]};
 const mailbox=demoMailbox([receipt]);assert.equal(mailbox.length,6);assert.equal(changedDemoDecisions(mailbox,[{id:'demo-1',action:'label'}]).length,0);
});
test('corrupt browser records and live-account receipts are rejected safely',()=>{
 assert.deepEqual(parseLocalReceipts('{bad'),[]);
 assert.equal(parseLocalReceipts(JSON.stringify([{...base,title:{}},{...base,xp:1e99},{...base,mode:'live'},base])).length,1);
});
test('cross-tab merge preserves separate wins and never resurrects an undone quest',()=>{
 const undone={...base,status:'undone' as const,xp:0};assert.equal(mergeLocalReceipts([undone],[base])[0].status,'undone');assert.equal(mergeLocalReceipts([base],[{...base,id:'second'}]).length,2);
});
test('sample quest recovery stores IDs only and validates restored choices and expiry',()=>{
 const plan={id:'draft',messages:demoMailbox([]),createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+60000).toISOString()};
 const raw=serializeDemoDraft({plan,decisions:[{id:'demo-1',action:'keep'}],phase:'game',timer:42});assert(!raw.includes('subject'));assert.equal(restoreDemoDraft(raw,[])?.decisions.length,1);assert.equal(restoreDemoDraft(raw,[])?.timer,42);
 assert.equal(restoreDemoDraft('{bad',[]),null);assert.equal(restoreDemoDraft(raw.replace('demo-1','outside'),[]),null);
 assert.equal(restoreDemoDraft(serializeDemoDraft({plan:{...plan,expiresAt:'2000-01-01'},decisions:[],phase:'briefing',timer:60}),[]),null);
});
