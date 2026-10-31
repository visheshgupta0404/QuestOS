import type { Decision, Message, Receipt } from '../types';
import type { db } from './db';
import { ApiError } from '../errors';

/** Experience points awarded per verified message change. */
export const XP_PER_MESSAGE = 25;
/** Lease grace period in milliseconds (2 minutes) before an interrupted execution or undo can be claimed. */
export const LEASE_GRACE_MS = 120_000;

function check(error: unknown) { if(error) throw new ApiError(503,'Receipt storage is unavailable.'); }

/** Database row structure for quest receipts. */
export interface ReceiptRow {
  id: string;
  user_id: string;
  status: string;
  count: number;
  changes?: unknown;
  detail?: string;
  created_at: string;
  updated_at?: string;
}

/** Dependencies required to execute and undo quest plans against Gmail and database storage. */
export type ExecutionServices = {
  store: ReturnType<typeof db>;
  readMessage: (id:string)=>Promise<Message>;
  cleanupLabel: ()=>Promise<string>;
  googleFetch: (path:string,init?:RequestInit)=>Promise<unknown>;
};

async function transition(store: ExecutionServices['store'],id:string,userId:string,expected:string,values:Record<string,unknown>,lease?:string){
  let query=store.from('quest_receipts').update(values).eq('id',id).eq('user_id',userId).eq('status',expected);
  if(lease)query=query.eq('updated_at',lease);
  const result=await query.select('*').maybeSingle();check(result.error);
  if(result.data)return result.data;
  const current=await store.from('quest_receipts').select('*').eq('id',id).eq('user_id',userId).maybeSingle();check(current.error);
  if(!current.data)throw new ApiError(409,'The execution receipt changed. Refresh activity before retrying.');
  return current.data;
}

function nextHeartbeat(previous:string){return new Date(Math.max(Date.now(),Date.parse(previous)+1)).toISOString();}

/** Represents label delta additions and removals planned for a specific Gmail message. */
export type Change = { id: string; add: string[]; remove: string[] };

/**
 * Maps a database receipt row into a user-facing Receipt domain object.
 */
export function receiptView(row: Record<string, unknown>): Receipt {
  const status = row.status as Receipt['status'];
  return { id: row.id as string, module: 'inbox', title: 'Inbox Kingdom cleanup', count: Number(row.count || 0), xp: status === 'verified' ? Number(row.count || 0)*XP_PER_MESSAGE : 0, createdAt: row.created_at as string, mode: 'live', status, detail: row.detail as string || 'Execution recorded.', canUndo: ['verified','partial','failed'].includes(status) || (status === 'executing' && Date.now()-Date.parse((row.updated_at||row.created_at) as string)>LEASE_GRACE_MS) };
}

/**
 * Validates, claims, executes, and verifies an approved quest plan against Gmail.
 * Guarantees idempotency via atomic plan claiming and receipt logging before mutation.
 */
export async function executePlanCore(userId: string, planId: string, decisions: Decision[], services: ExecutionServices) {
  const {store,readMessage,cleanupLabel,googleFetch} = services;
  const { data: plan, error } = await store.from('quest_plans').select('*').eq('id',planId).eq('user_id',userId).maybeSingle();
  check(error);
  if (!plan) throw new ApiError(404,'This quest was not found. Scan again.');
  const existing = await store.from('quest_receipts').select('*').eq('id',planId).eq('user_id',userId).maybeSingle(); check(existing.error);
  if (existing.data) return receiptView(existing.data);
  if (!plan.play_approved) throw new ApiError(409,'Approve the quest scope before playing and executing.');
  if (!Number.isFinite(Date.parse(plan.expires_at)) || Date.parse(plan.expires_at)<Date.now()) throw new ApiError(409,'This quest expired. Scan again to review fresh candidates.');
  const messages = plan.messages as Message[];
  if (decisions.length !== messages.length || new Set(decisions.map(d=>d.id)).size !== decisions.length || decisions.some(d=>!messages.some(m=>m.id === d.id))) throw new ApiError(400,'Decisions must match every message in this quest exactly once.');
  const claimed = await store.from('quest_plans').update({ claimed: true }).eq('id',planId).eq('user_id',userId).eq('claimed',false).select('id'); check(claimed.error);
  if (!claimed.data?.length) throw new ApiError(409,'This quest is already being executed. Check receipts before retrying.');
  const changes: Change[] = [];
  try {
    const selected = decisions.filter(d=>d.action !== 'keep');
    const fresh = await Promise.all(selected.map(d=>readMessage(d.id)));
    for (const m of fresh) {
      const old = messages.find(x=>x.id === m.id)!;
      if ([...m.labels].sort().join() !== [...old.labels].sort().join()) throw new ApiError(409,'A message changed since scanning. No cleanup started. Scan again.');
      if (m.labels.some(l=>['STARRED','IMPORTANT','TRASH','SPAM'].includes(l))) throw new ApiError(409,'A protected message was detected. Scan again.');
    }
    const labelId = selected.some(d=>d.action === 'label') ? await cleanupLabel() : undefined;
    for (const d of selected) {
      const m = fresh.find(x=>x.id===d.id)!;
      changes.push({ id: d.id, add: d.action === 'label' && labelId && !m.labels.includes(labelId) ? [labelId] : [], remove: d.action === 'archive' && m.labels.includes('INBOX') ? ['INBOX'] : [] });
    }
    const insert = await store.from('quest_receipts').insert({ id: planId, user_id: userId, status: 'executing', count: 0, changes, detail: 'Approved actions recorded; execution pending verification.' }); check(insert.error);
    let count = 0;
    try {
      for (const c of changes) {
        if (!c.add.length && !c.remove.length) continue;
        const heartbeat=await store.from('quest_receipts').update({updated_at:new Date().toISOString()}).eq('id',planId).eq('user_id',userId).eq('status','executing').select('id');check(heartbeat.error);
        if(!heartbeat.data?.length)throw new Error('Execution ownership changed');
        await googleFetch(`messages/${encodeURIComponent(c.id)}/modify`, { method: 'POST', body: JSON.stringify({ addLabelIds: c.add, removeLabelIds: c.remove }) });
        const actual = await readMessage(c.id);
        if (c.add.some(l=>!actual.labels.includes(l)) || c.remove.some(l=>actual.labels.includes(l))) throw new Error('Verification mismatch');
        count++;
      }
      return receiptView(await transition(store,planId,userId,'executing',{status:'verified',count,updated_at:new Date().toISOString(),detail: count ? count+' message changes independently verified with Gmail. Undo is available.' : 'No message changes were needed. No XP awarded.'}));
    } catch {
      return receiptView(await transition(store,planId,userId,'executing',{status:'partial',count,updated_at:new Date().toISOString(),detail: count+' changes verified before an interruption. Other recorded changes may have completed. Undo reconciles all approved targets; no XP awarded.'}));
    }
  } catch(e) {
    // Release only if no receipt exists: after recording targets, never permit blind re-execution.
    const receipt = await store.from('quest_receipts').select('id').eq('id',planId).maybeSingle();
    if (!receipt.error && !receipt.data) await store.from('quest_plans').update({ claimed:false }).eq('id',planId).eq('user_id',userId);
    throw e;
  }
}
/**
 * Undoes an executed quest receipt by reversing approved label deltas.
 * Verified with read-after-write; restores INBOX and strips QuestOS/Cleared.
 */
export async function undoReceiptCore(userId: string, id: string, services: ExecutionServices) {
  const {store,readMessage,googleFetch} = services;
  const found = await store.from('quest_receipts').select('*').eq('id',id).eq('user_id',userId).maybeSingle();
  check(found.error);
  if (!found.data) throw new ApiError(404,'Receipt not found.');
  if (found.data.status === 'undone') return receiptView(found.data);
  if (found.data.status === 'executing' && Date.now()-Date.parse(found.data.updated_at)<LEASE_GRACE_MS) throw new ApiError(409,'Execution is still in progress. Wait before recovery.');
  if (found.data.status === 'undoing' && Date.now()-Date.parse(found.data.updated_at)<LEASE_GRACE_MS) throw new ApiError(409,'Undo is in progress.');
  const claim = await store.from('quest_receipts').update({ status:'undoing', updated_at:new Date().toISOString() }).eq('id',id).eq('user_id',userId).eq('status',found.data.status).eq('updated_at',found.data.updated_at).select('*').single();
  if (claim.error || !claim.data) throw new ApiError(409,'Receipt is busy. Refresh and try again.');
  let lease=claim.data.updated_at as string;
  try {
    for (const c of claim.data.changes as Change[]) {
      if (!c.add.length && !c.remove.length) continue;
      const updatedAt=nextHeartbeat(lease);
      const heartbeat=await store.from('quest_receipts').update({updated_at:updatedAt}).eq('id',id).eq('user_id',userId).eq('status','undoing').eq('updated_at',lease).select('id').maybeSingle();check(heartbeat.error);
      if(!heartbeat.data)throw new Error('Undo ownership changed');
      lease=updatedAt;
      const before = await readMessage(c.id);
      if (before.labels.includes('TRASH') || before.labels.includes('SPAM')) throw new Error('Message moved to a protected folder');
      await googleFetch(`messages/${encodeURIComponent(c.id)}/modify`, { method:'POST', body:JSON.stringify({ addLabelIds:c.remove, removeLabelIds:c.add }) });
      const after = await readMessage(c.id);
      if (c.remove.some(l=>!after.labels.includes(l)) || c.add.some(l=>after.labels.includes(l))) throw new Error('Undo verification failed');
    }
    return receiptView(await transition(store,id,userId,'undoing',{status:'undone',updated_at:nextHeartbeat(lease),detail:'Original inbox placement restored and only labels added by this quest removed. Undo verified with Gmail. XP reversed.'},lease));
  } catch {
    return receiptView(await transition(store,id,userId,'undoing',{status:'partial',updated_at:nextHeartbeat(lease),detail:'Undo was interrupted or a message moved to Trash/Spam. Some changes may be restored. Resolve any protected messages and retry undo; XP remains withheld.'},lease));
  }
}
