import type {Message,Decision} from './types';
/** A decision augmented with a human-readable reason for the recommendation. */
export type Recommendation=Decision & {reason:string};
/**
 * Produces rule-based cleanup recommendations for a list of messages.
 * Protected labels (STARRED, IMPORTANT, TRASH, SPAM) are always kept.
 * Non-promotional messages are kept for manual review.
 * Receipt-like subjects are labelled; other promotions are archived.
 */
export function recommendCleanup(messages:Message[]):Recommendation[]{
 return messages.map(m=>{
  if(m.labels.some(l=>['STARRED','IMPORTANT','TRASH','SPAM'].includes(l)))return{id:m.id,action:'keep',reason:'Protected label: keep this message unchanged.'};
  if(!m.labels.includes('CATEGORY_PROMOTIONS'))return{id:m.id,action:'keep',reason:'Not a promotional message; review manually.'};
  if(/receipt|invoice|order confirmation|payment|booking/i.test(m.subject))return{id:m.id,action:'label',reason:'May be a useful record. Label for later review; keep in inbox.'};
  return{id:m.id,action:'archive',reason:'Old promotion selected by the scan; archive is reversible.'};
 });
}
