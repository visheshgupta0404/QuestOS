import 'server-only';
import type { Decision, Message, Receipt } from '../types';
import { db, check } from './db';
import { ApiError } from './config';
import { cleanupLabel, googleFetch, readMessage } from './google';
export type Change = { id: string; add: string[]; remove: string[] };
export function receiptView(row: Record<string, unknown>): Receipt {
  const status = row.status as Receipt['status'];
  return { id: row.id as string, module: 'inbox', title: 'Inbox Kingdom cleanup', count: Number(row.count || 0), xp: status === 'verified' ? Number(row.count || 0)*25 : 0, createdAt: row.created_at as string, mode: 'live', status, detail: row.detail as string || 'Execution recorded.', canUndo: ['verified','partial','failed'].includes(status) || (status === 'executing' && Date.now()-Date.parse(row.created_at as string)>120_000) };
}
export async function executePlan(userId: string, planId: string, decisions: Decision[]) {
  const store = db();
  const { data: plan, error } = await store.from('quest_plans').select('*').eq('id',planId).eq('user_id',userId).single();
  if (error || !plan) throw new ApiError(404,'This quest was not found. Scan again.');
  const existing = await store.from('quest_receipts').select('*').eq('id',planId).eq('user_id',userId).maybeSingle(); check(existing.error);
  if (existing.data) return receiptView(existing.data);
  if (Date.parse(plan.expires_at)<Date.now()) throw new ApiError(409,'This quest expired. Scan again to review fresh candidates.');
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
        await googleFetch(`messages/${encodeURIComponent(c.id)}/modify`, { method: 'POST', body: JSON.stringify({ addLabelIds: c.add, removeLabelIds: c.remove }) });
        const actual = await readMessage(c.id);
        if (c.add.some(l=>!actual.labels.includes(l)) || c.remove.some(l=>actual.labels.includes(l))) throw new Error('Verification mismatch');
        count++;
      }
      const result = await store.from('quest_receipts').update({ status: 'verified', count, detail: `${count} message changes independently verified with Gmail. Undo is available.` }).eq('id',planId).eq('user_id',userId).select('*').single(); check(result.error);
      return receiptView(result.data);
    } catch {
      const result = await store.from('quest_receipts').update({ status: 'partial', count, detail: `${count} changes verified before an interruption. Other recorded changes may have completed. Undo reconciles all approved targets; no XP awarded.` }).eq('id',planId).eq('user_id',userId).select('*').single(); check(result.error);
      return receiptView(result.data);
    }
  } catch(e) {
    // Release only if no receipt exists: after recording targets, never permit blind re-execution.
    const receipt = await store.from('quest_receipts').select('id').eq('id',planId).maybeSingle();
    if (!receipt.error && !receipt.data) await store.from('quest_plans').update({ claimed:false }).eq('id',planId).eq('user_id',userId);
    throw e;
  }
}
export async function undoReceipt(userId: string, id: string) {
  const store = db();
  const found = await store.from('quest_receipts').select('*').eq('id',id).eq('user_id',userId).single();
  if (found.error || !found.data) throw new ApiError(404,'Receipt not found.');
  if (found.data.status === 'undone') return receiptView(found.data);
  if (found.data.status === 'executing' && Date.now()-Date.parse(found.data.created_at)<120_000) throw new ApiError(409,'Execution is still in progress. Wait before recovery.');
  if (found.data.status === 'undoing' && Date.now()-Date.parse(found.data.updated_at)<120_000) throw new ApiError(409,'Undo is in progress.');
  const claim = await store.from('quest_receipts').update({ status:'undoing', updated_at:new Date().toISOString() }).eq('id',id).eq('user_id',userId).eq('status',found.data.status).eq('updated_at',found.data.updated_at).select('*').single();
  if (claim.error || !claim.data) throw new ApiError(409,'Receipt is busy. Refresh and try again.');
  try {
    for (const c of claim.data.changes as Change[]) {
      if (!c.add.length && !c.remove.length) continue;
      const before = await readMessage(c.id);
      if (before.labels.includes('TRASH') || before.labels.includes('SPAM')) throw new Error('Message moved to a protected folder');
      await googleFetch(`messages/${encodeURIComponent(c.id)}/modify`, { method:'POST', body:JSON.stringify({ addLabelIds:c.remove, removeLabelIds:c.add }) });
      const after = await readMessage(c.id);
      if (c.remove.some(l=>!after.labels.includes(l)) || c.add.some(l=>after.labels.includes(l))) throw new Error('Undo verification failed');
    }
    const result = await store.from('quest_receipts').update({ status:'undone', updated_at:new Date().toISOString(), detail:'Original inbox placement restored and only labels added by this quest removed. Undo verified with Gmail. XP reversed.' }).eq('id',id).eq('user_id',userId).select('*').single(); check(result.error); return receiptView(result.data);
  } catch {
    const result = await store.from('quest_receipts').update({ status:'partial', updated_at:new Date().toISOString(), detail:'Undo was interrupted or a message moved to Trash/Spam. Some changes may be restored. Resolve any protected messages and retry undo; XP remains withheld.' }).eq('id',id).eq('user_id',userId).select('*').single(); check(result.error); return receiptView(result.data);
  }
}
