export type Module = 'inbox' | 'files';
export type Message = { id: string; subject: string; from: string; date: string; labels: string[] };
export type Decision = { id: string; action: 'archive' | 'label' | 'keep' };
export type Plan = { id: string; messages: Message[]; createdAt: string; expiresAt: string };
export type Receipt = { id: string; module: Module; title: string; count: number; xp: number; createdAt: string; status: 'verified' | 'undone' | 'partial' | 'failed' | 'executing' | 'undoing'; mode: 'demo' | 'live' | 'local'; detail: string; canUndo?: boolean; decisions?: Decision[] };
export type QuestStory = { title: string; briefing: string; victory: string; source: 'gemini' | 'rules' };
export type FileEntry = { id: string; file: File; hash: string; category: string; duplicateOf?: string; path: string };
export type IntegrationStatus = { configured: boolean; connected: boolean; email?: string; ai: boolean; storage: boolean; storageProvider?: 'local'|'supabase'; missing: string[] };
