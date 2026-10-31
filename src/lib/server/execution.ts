import 'server-only';
import type { Decision } from '../types';
import { db } from './db';
import { cleanupLabel, googleFetch, readMessage } from './google';
import { executePlanCore, undoReceiptCore } from './execution-core';
export { receiptView } from './execution-core';
export const executePlan = (userId:string,planId:string,decisions:Decision[]) => executePlanCore(userId,planId,decisions,{store:db(),cleanupLabel,googleFetch,readMessage});
export const undoReceipt = (userId:string,id:string) => undoReceiptCore(userId,id,{store:db(),cleanupLabel,googleFetch,readMessage});
