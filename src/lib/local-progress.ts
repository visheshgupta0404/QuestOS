import type {Receipt,Decision,Message,Plan} from './types';
import {DEMO_MESSAGES} from './demo';
const ACTIONS=['archive','label','keep'];
/** Maximum number of receipts stored locally in localStorage. */
const MAX_LOCAL_RECEIPTS = 200;
/** Maximum number of decisions allowed per quest plan. */
const MAX_DECISIONS = 12;
/** Maximum timer value in seconds for a demo quest session. */
const MAX_TIMER_SECONDS = 60;
/**
 * Parses and validates receipts from a raw JSON string (e.g. from localStorage).
 * Rejects malformed entries, live-account records, and receipts with out-of-range fields.
 * Returns an empty array on any parse error.
 */
export function parseLocalReceipts(raw:string|null):Receipt[]{
 try {
  const values:unknown=JSON.parse(raw||'[]');if(!Array.isArray(values))return [];
  return values.filter((v):v is Receipt=>{
   if(!v||typeof v!=='object')return false;
   const r=v as Record<string,unknown>;
   return typeof r.id==='string'&&r.id.length>0&&r.id.length<150&&['demo','local'].includes(String(r.mode))&&['inbox','files'].includes(String(r.module))&&['verified','undone'].includes(String(r.status))&&typeof r.title==='string'&&r.title.length<=200&&typeof r.detail==='string'&&r.detail.length<=12000&&typeof r.createdAt==='string'&&Number.isFinite(Date.parse(r.createdAt))&&Number.isInteger(r.count)&&Number(r.count)>=0&&Number(r.count)<=250&&Number.isInteger(r.xp)&&Number(r.xp)>=0&&Number(r.xp)<=5000;
  }).slice(0,MAX_LOCAL_RECEIPTS).map(r=>({...r,decisions:validDecisions(r.decisions),canUndo:r.mode==='demo'&&r.module==='inbox'&&r.status==='verified'&&r.count>0}));
 }catch{return [];}
}
function validDecisions(value:unknown):Decision[]|undefined{
 if(!Array.isArray(value)||value.length>MAX_DECISIONS)return undefined;
 if(!value.every(d=>d&&typeof d.id==='string'&&ACTIONS.includes(d.action)))return undefined;
 return value.map(d=>({id:d.id,action:d.action}));
}
function receiptDecisions(r:Receipt):Decision[]{
 if(r.decisions)return validDecisions(r.decisions)||[];
 // Migrate the previous app's sample-only textual receipts without hiding kept messages.
 try{return validDecisions(JSON.parse(r.detail.split('Decisions: ')[1]||'null'))||[];}catch{return [];}
}
/**
 * Returns the effective demo mailbox state by applying verified demo receipts
 * to the baseline demo messages.
 */
export function demoMailbox(receipts:Receipt[]):Message[]{ const messages=structuredClone(DEMO_MESSAGES);
 for(const r of receipts.filter(r=>r.mode==='demo'&&r.module==='inbox'&&r.status==='verified').sort((a,b)=>a.createdAt.localeCompare(b.createdAt))){
  for(const d of receiptDecisions(r)){const m=messages.find(m=>m.id===d.id);if(!m)continue;if(d.action==='archive')m.labels=m.labels.filter(l=>l!=='INBOX');if(d.action==='label'&&!m.labels.includes('QuestOS/Cleared'))m.labels.push('QuestOS/Cleared');}
 }
 return messages.filter(m=>m.labels.includes('INBOX'));
}
/**
 * Filters decisions to only those that represent an actual state change
 * compared to current message labels.
 */
export function changedDemoDecisions(messages:Message[],decisions:Decision[]):Decision[]{
 return decisions.filter(d=>{const m=messages.find(m=>m.id===d.id);return !!m&&(d.action==='archive'?m.labels.includes('INBOX'):d.action==='label'?!m.labels.includes('QuestOS/Cleared'):false);});
}
/**
 * Merges two receipt lists, keeping the newest entry per ID and giving
 * precedence to 'undone' receipts. Results are limited to MAX_LOCAL_RECEIPTS.
 */
export function mergeLocalReceipts(a:Receipt[],b:Receipt[]):Receipt[]{
 const map=new Map<string,Receipt>();
 for(const r of [...a,...b]){const old=map.get(r.id);if(!old||old.status!=='undone')map.set(r.id,r);}
 return [...map.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,MAX_LOCAL_RECEIPTS);
}
/** Represents the state of an active demo quest draft saved in session storage. */
export type DemoDraft={plan:Plan;decisions:Decision[];phase:'briefing'|'game'|'review';timer:number};
/**
 * Serializes an in-progress demo quest draft to a JSON string for sessionStorage.
 */
export function serializeDemoDraft(draft:DemoDraft):string{
 return JSON.stringify({planId:draft.plan.id,candidateIds:draft.plan.messages.map(m=>m.id),createdAt:draft.plan.createdAt,expiresAt:draft.plan.expiresAt,decisions:draft.decisions,phase:draft.phase,timer:draft.timer});
}
/**
 * Restores and validates a demo quest draft from sessionStorage against the current receipts.
 * Returns null if the stored draft is invalid, corrupted, or has expired.
 */
export function restoreDemoDraft(raw:string|null,receipts:Receipt[]):DemoDraft|null{
 try {
  const d=JSON.parse(raw||'null');if(!d||typeof d.planId!=='string'||d.planId.length>150||!['briefing','game','review'].includes(d.phase)||!Array.isArray(d.candidateIds)||d.candidateIds.length<1||d.candidateIds.length>6||new Set(d.candidateIds).size!==d.candidateIds.length||!Number.isFinite(Date.parse(d.expiresAt))||Date.parse(d.expiresAt)<=Date.now())return null;
  const mailbox=demoMailbox(receipts);const messages=d.candidateIds.map((id:string)=>mailbox.find(m=>m.id===id));if(messages.some((m:Message|undefined)=>!m))return null;
  const decisions=validDecisions(d.decisions);if(!decisions||decisions.length>messages.length||decisions.some((choice,i)=>choice.id!==messages[i].id))return null;
  return {plan:{id:d.planId,messages,createdAt:typeof d.createdAt==='string'?d.createdAt:new Date().toISOString(),expiresAt:d.expiresAt},decisions,phase:decisions.length===messages.length?'review':d.phase,timer:Number.isInteger(d.timer)?Math.max(0,Math.min(MAX_TIMER_SECONDS,d.timer)):MAX_TIMER_SECONDS};
 }catch{return null;}
}
